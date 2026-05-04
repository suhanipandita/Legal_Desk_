const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { protect, requireRole } = require('../middleware/auth');
const { sendAppointmentEmail } = require('../services/emailService');

const router = express.Router();

// GET /api/appointments/availability/:lawyerId
router.get('/availability/:lawyerId', protect, async (req, res) => {
  try {
    const db = getDB();
    const lawyerId = new ObjectId(req.params.lawyerId);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const booked = await db.collection('appointments')
      .find({
        lawyer: lawyerId,
        dateTime: { $gte: now, $lte: nextWeek },
        status: { $in: ['pending', 'confirmed'] },
      })
      .project({ dateTime: 1 })
      .toArray();

    // Generate available slots (9 AM to 5 PM, 1-hour slots)
    const slots = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d + 1);
      for (let h = 9; h < 17; h++) {
        const slotTime = new Date(date);
        slotTime.setHours(h, 0, 0, 0);
        const isBooked = booked.some(
          (b) => new Date(b.dateTime).getTime() === slotTime.getTime()
        );
        if (!isBooked) {
          slots.push({ dateTime: slotTime, available: true });
        }
      }
    }

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/appointments
router.post('/', protect, requireRole('client'), async (req, res) => {
  try {
    const db = getDB();
    const { lawyer, dateTime, caseId, notes } = req.body;

    const appointment = {
      case: caseId ? new ObjectId(caseId) : null,
      client: req.user._id,
      lawyer: new ObjectId(lawyer),
      dateTime: new Date(dateTime),
      status: 'pending',
      notes: notes || '',
      createdAt: new Date(),
    };

    const result = await db.collection('appointments').insertOne(appointment);
    appointment._id = result.insertedId;

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/appointments/mine
router.get('/mine', protect, async (req, res) => {
  try {
    const db = getDB();
    let filter = {};

    if (req.user.role === 'client') filter.client = req.user._id;
    else if (req.user.role === 'lawyer') filter.lawyer = req.user._id;

    const appointments = await db.collection('appointments')
      .aggregate([
        { $match: filter },
        { $lookup: { from: 'users', localField: 'client', foreignField: '_id', as: 'clientInfo' } },
        { $lookup: { from: 'users', localField: 'lawyer', foreignField: '_id', as: 'lawyerInfo' } },
        { $addFields: { clientInfo: { $arrayElemAt: ['$clientInfo', 0] }, lawyerInfo: { $arrayElemAt: ['$lawyerInfo', 0] } } },
        { $project: { 'clientInfo.password': 0, 'lawyerInfo.password': 0 } },
        { $sort: { dateTime: 1 } },
      ])
      .toArray();

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/appointments/:id/status
router.put('/:id/status', protect, requireRole('lawyer', 'admin'), async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.body;

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await db.collection('appointments').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ message: 'Appointment not found' });

    // Send email notification
    try {
      const client = await db.collection('users').findOne({ _id: result.client });
      const lawyer = await db.collection('users').findOne({ _id: result.lawyer });
      if (client && lawyer) {
        await sendAppointmentEmail(client.email, lawyer.name, result.dateTime, status);
      }
    } catch (e) { console.warn('Email notification failed'); }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
