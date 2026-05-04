const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { protect, requireRole } = require('../middleware/auth');
const { validateCase } = require('../middleware/validation');

const router = express.Router();

// Helper to generate case number
const generateCaseNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LD-${year}-${random}`;
};

// GET /api/cases - List cases (role-filtered)
router.get('/', protect, async (req, res) => {
  try {
    const db = getDB();
    let filter = {};

    if (req.user.role === 'lawyer') {
      filter.lawyer = req.user._id;
    } else if (req.user.role === 'client') {
      filter.client = req.user._id;
    }
    // Admin gets all cases (no filter)

    const cases = await db
      .collection('cases')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            localField: 'client',
            foreignField: '_id',
            as: 'clientInfo',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lawyer',
            foreignField: '_id',
            as: 'lawyerInfo',
          },
        },
        {
          $addFields: {
            clientInfo: { $arrayElemAt: ['$clientInfo', 0] },
            lawyerInfo: { $arrayElemAt: ['$lawyerInfo', 0] },
          },
        },
        {
          $project: {
            'clientInfo.password': 0,
            'lawyerInfo.password': 0,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.json(cases);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/cases/client/mine - Client's own cases
router.get('/client/mine', protect, requireRole('client'), async (req, res) => {
  try {
    const db = getDB();
    const cases = await db
      .collection('cases')
      .aggregate([
        { $match: { client: req.user._id } },
        {
          $lookup: {
            from: 'users',
            localField: 'lawyer',
            foreignField: '_id',
            as: 'lawyerInfo',
          },
        },
        {
          $addFields: {
            lawyerInfo: { $arrayElemAt: ['$lawyerInfo', 0] },
          },
        },
        {
          $project: { 'lawyerInfo.password': 0 },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/cases/:id - Get single case
router.get('/:id', protect, async (req, res) => {
  try {
    const db = getDB();
    const caseDoc = await db
      .collection('cases')
      .aggregate([
        { $match: { _id: new ObjectId(req.params.id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'client',
            foreignField: '_id',
            as: 'clientInfo',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lawyer',
            foreignField: '_id',
            as: 'lawyerInfo',
          },
        },
        {
          $addFields: {
            clientInfo: { $arrayElemAt: ['$clientInfo', 0] },
            lawyerInfo: { $arrayElemAt: ['$lawyerInfo', 0] },
          },
        },
        {
          $project: {
            'clientInfo.password': 0,
            'lawyerInfo.password': 0,
          },
        },
      ])
      .toArray();

    if (!caseDoc.length) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const c = caseDoc[0];

    // Access control: client can only see own case
    if (req.user.role === 'client' && c.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Access control: lawyer can only see assigned case
    if (req.user.role === 'lawyer' && c.lawyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(c);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/cases - Create new case (Admin only)
router.post('/', protect, requireRole('admin'), validateCase, async (req, res) => {
  try {
    const db = getDB();
    const { title, type, client, lawyer, courtName, nextHearingDate, filingDeadline, description } = req.body;

    const newCase = {
      title,
      caseNumber: generateCaseNumber(),
      type: type || 'Civil',
      status: 'active',
      client: new ObjectId(client),
      lawyer: new ObjectId(lawyer),
      courtName: courtName || '',
      nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
      filingDeadline: filingDeadline ? new Date(filingDeadline) : null,
      timeline: [
        {
          event: 'Case created',
          date: new Date(),
          addedBy: req.user._id,
        },
      ],
      missingDocs: false,
      description: description || '',
      createdAt: new Date(),
    };

    const result = await db.collection('cases').insertOne(newCase);
    newCase._id = result.insertedId;

    res.status(201).json(newCase);
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/cases/:id - Update case
router.put('/:id', protect, requireRole('admin', 'lawyer'), async (req, res) => {
  try {
    const db = getDB();
    const { status, nextHearingDate, filingDeadline, courtName, missingDocs, timelineEvent, lawyer, description } = req.body;

    const update = { $set: { updatedAt: new Date() } };

    if (status) update.$set.status = status;
    if (nextHearingDate) update.$set.nextHearingDate = new Date(nextHearingDate);
    if (filingDeadline) update.$set.filingDeadline = new Date(filingDeadline);
    if (courtName !== undefined) update.$set.courtName = courtName;
    if (missingDocs !== undefined) update.$set.missingDocs = missingDocs;
    if (description !== undefined) update.$set.description = description;
    if (lawyer) update.$set.lawyer = new ObjectId(lawyer);

    // Add timeline event
    if (timelineEvent) {
      update.$push = {
        timeline: {
          event: timelineEvent,
          date: new Date(),
          addedBy: req.user._id,
        },
      };
    }

    const result = await db.collection('cases').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      update,
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/cases/:id - Delete case (Admin only)
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('cases').deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Also delete associated documents, appointments, invoices
    await db.collection('documents').deleteMany({ case: new ObjectId(req.params.id) });
    await db.collection('appointments').deleteMany({ case: new ObjectId(req.params.id) });
    await db.collection('invoices').deleteMany({ case: new ObjectId(req.params.id) });

    res.json({ message: 'Case and associated data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
