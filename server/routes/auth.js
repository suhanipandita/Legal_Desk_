const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { protect, requireRole } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// POST /api/auth/register - Client self-registration
router.post('/register', validateRegister, async (req, res) => {
  try {
    const db = getDB();
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      name,
      email,
      password: hashedPassword,
      role: 'client', // Self-registration is always client
      phone: phone || '',
      language: 'en',
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);
    const token = generateToken({ _id: result.insertedId, role: 'client', name });

    res.status(201).json({
      token,
      user: {
        id: result.insertedId,
        name,
        email,
        role: 'client',
        phone: phone || '',
        language: 'en',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        language: user.language,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        language: req.user.language,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/me/language - Toggle language preference
router.put('/me/language', protect, async (req, res) => {
  try {
    const db = getDB();
    const { language } = req.body;

    if (!['en', 'mr'].includes(language)) {
      return res.status(400).json({ message: 'Language must be "en" or "mr"' });
    }

    await db.collection('users').updateOne(
      { _id: req.user._id },
      { $set: { language } }
    );

    res.json({ message: 'Language updated', language });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
