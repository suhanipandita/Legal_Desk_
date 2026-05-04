const express = require('express');
const { ObjectId } = require('mongodb');
const PDFDocument = require('pdfkit');
const { getDB } = require('../config/db');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/invoices/case/:id
router.get('/case/:id', protect, requireRole('lawyer', 'admin', 'client'), async (req, res) => {
  try {
    const db = getDB();
    const invoice = await db.collection('invoices')
      .aggregate([
        { $match: { case: new ObjectId(req.params.id) } },
        { $lookup: { from: 'users', localField: 'client', foreignField: '_id', as: 'clientInfo' } },
        { $lookup: { from: 'users', localField: 'lawyer', foreignField: '_id', as: 'lawyerInfo' } },
        { $lookup: { from: 'cases', localField: 'case', foreignField: '_id', as: 'caseInfo' } },
        { $addFields: {
          clientInfo: { $arrayElemAt: ['$clientInfo', 0] },
          lawyerInfo: { $arrayElemAt: ['$lawyerInfo', 0] },
          caseInfo: { $arrayElemAt: ['$caseInfo', 0] },
        }},
        { $project: { 'clientInfo.password': 0, 'lawyerInfo.password': 0 } },
      ])
      .toArray();

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/invoices
router.post('/', protect, requireRole('lawyer', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { case: caseId, client, lawyer, billableHours, hourlyRate, expenses } = req.body;

    const expenseTotal = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalAmount = (billableHours || 0) * (hourlyRate || 0) + expenseTotal;

    const invoice = {
      case: new ObjectId(caseId),
      client: new ObjectId(client),
      lawyer: new ObjectId(lawyer),
      billableHours: billableHours || 0,
      hourlyRate: hourlyRate || 0,
      expenses: expenses || [],
      totalAmount,
      paymentStatus: 'pending',
      pdfUrl: null,
      createdAt: new Date(),
    };

    const result = await db.collection('invoices').insertOne(invoice);
    invoice._id = result.insertedId;

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', protect, requireRole('lawyer', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { billableHours, hourlyRate, expenses } = req.body;

    const update = { $set: { updatedAt: new Date() } };
    if (billableHours !== undefined) update.$set.billableHours = billableHours;
    if (hourlyRate !== undefined) update.$set.hourlyRate = hourlyRate;
    if (expenses !== undefined) update.$set.expenses = expenses;

    // Recalculate total
    if (billableHours !== undefined || hourlyRate !== undefined || expenses !== undefined) {
      const existing = await db.collection('invoices').findOne({ _id: new ObjectId(req.params.id) });
      const bh = billableHours !== undefined ? billableHours : existing.billableHours;
      const hr = hourlyRate !== undefined ? hourlyRate : existing.hourlyRate;
      const exp = expenses !== undefined ? expenses : existing.expenses;
      const expTotal = (exp || []).reduce((s, e) => s + (e.amount || 0), 0);
      update.$set.totalAmount = bh * hr + expTotal;
    }

    const result = await db.collection('invoices').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      update,
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Invoice not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/invoices/:id/status
router.put('/:id/status', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const { paymentStatus } = req.body;
    if (!['paid', 'pending', 'overdue'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const result = await db.collection('invoices').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { paymentStatus, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'Invoice not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/invoices/:id/pdf
router.get('/:id/pdf', protect, requireRole('admin', 'client', 'lawyer'), async (req, res) => {
  try {
    const db = getDB();
    const invoice = await db.collection('invoices').findOne({ _id: new ObjectId(req.params.id) });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const client = await db.collection('users').findOne({ _id: invoice.client });
    const lawyer = await db.collection('users').findOne({ _id: invoice.lawyer });
    const caseDoc = await db.collection('cases').findOne({ _id: invoice.case });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice._id}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('LEGALDESK', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Tax Invoice', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Invoice details
    doc.fontSize(10);
    doc.text(`Invoice #: INV-${invoice._id.toString().slice(-8).toUpperCase()}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`);
    doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`);
    doc.moveDown();

    doc.text(`Client: ${client?.name || 'N/A'}`);
    doc.text(`Lawyer: ${lawyer?.name || 'N/A'}`);
    doc.text(`Case: ${caseDoc?.title || 'N/A'} (${caseDoc?.caseNumber || ''})`);
    doc.moveDown();

    // Billing details
    doc.font('Helvetica-Bold').text('Billing Details');
    doc.font('Helvetica');
    doc.text(`Billable Hours: ${invoice.billableHours} hrs @ ₹${invoice.hourlyRate}/hr`);
    doc.text(`Hours Total: ₹${(invoice.billableHours * invoice.hourlyRate).toLocaleString('en-IN')}`);
    doc.moveDown();

    if (invoice.expenses && invoice.expenses.length > 0) {
      doc.font('Helvetica-Bold').text('Expenses');
      doc.font('Helvetica');
      invoice.expenses.forEach(exp => {
        doc.text(`  ${exp.description}: ₹${(exp.amount || 0).toLocaleString('en-IN')}`);
      });
      doc.moveDown();
    }

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`TOTAL: ₹${invoice.totalAmount.toLocaleString('en-IN')}`, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF generation failed' });
  }
});

module.exports = router;
