const express = require('express');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/lawyers - List all lawyers
router.get('/lawyers', protect, requireRole('admin', 'client'), async (req, res) => {
  try {
    const db = getDB();
    const lawyers = await db.collection('users')
      .find({ role: 'lawyer' }, { projection: { password: 0 } })
      .toArray();
    res.json(lawyers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/clients - List all clients
router.get('/clients', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const clients = await db.collection('users')
      .find({ role: 'client' }, { projection: { password: 0 } })
      .toArray();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/lawyers - Create lawyer account (Admin)
router.post('/lawyers', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const { name, email, password, phone, specialization } = req.body;

    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const lawyer = {
      name,
      email,
      password: hashedPassword,
      role: 'lawyer',
      phone: phone || '',
      specialization: specialization || '',
      language: 'en',
      createdBy: req.user._id,
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(lawyer);
    const { password: _, ...lawyerData } = lawyer;
    lawyerData._id = result.insertedId;

    res.status(201).json(lawyerData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id - Update user (Admin)
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const { name, email, phone, specialization } = req.body;
    const update = { $set: {} };
    if (name) update.$set.name = name;
    if (email) update.$set.email = email;
    if (phone) update.$set.phone = phone;
    if (specialization) update.$set.specialization = specialization;

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      update,
      { returnDocument: 'after', projection: { password: 0 } }
    );
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id - Delete user (Admin)
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/lawyers/:id/stats - Lawyer performance stats
router.get('/lawyers/:id/stats', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const lawyerId = new ObjectId(req.params.id);

    const [totalCases, activeCases, closedCases, revenue] = await Promise.all([
      db.collection('cases').countDocuments({ lawyer: lawyerId }),
      db.collection('cases').countDocuments({ lawyer: lawyerId, status: 'active' }),
      db.collection('cases').countDocuments({ lawyer: lawyerId, status: { $in: ['closed', 'completed'] } }),
      db.collection('invoices').aggregate([
        { $match: { lawyer: lawyerId, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
    ]);

    res.json({
      totalCases,
      activeCases,
      closedCases,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/stats/dashboard - Admin dashboard stats
router.get('/stats/dashboard', protect, requireRole('admin'), async (req, res) => {
  try {
    const db = getDB();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalActive, closedThisMonth, totalRevenue, pendingInvoices, lawyerWorkload] = await Promise.all([
      db.collection('cases').countDocuments({ status: 'active' }),
      db.collection('cases').countDocuments({ status: { $in: ['closed', 'completed'] }, updatedAt: { $gte: startOfMonth } }),
      db.collection('invoices').aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
      db.collection('invoices').countDocuments({ paymentStatus: { $in: ['pending', 'overdue'] } }),
      db.collection('cases').aggregate([
        { $match: { status: { $ne: 'closed' } } },
        { $group: { _id: '$lawyer', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'lawyer' } },
        { $addFields: { lawyer: { $arrayElemAt: ['$lawyer', 0] } } },
        { $project: { name: '$lawyer.name', count: 1 } },
      ]).toArray(),
    ]);

    res.json({
      totalActiveCases: totalActive,
      closedThisMonth: closedThisMonth || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingInvoices,
      lawyerWorkload,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
