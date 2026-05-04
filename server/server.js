require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { startReminderCron } = require('./services/cronService');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const seedIfEmpty = async () => {
  const { getDB } = require('./config/db');
  const bcrypt = require('bcryptjs');
  const db = getDB();

  const userCount = await db.collection('users').countDocuments();
  if (userCount > 0) return;

  console.log('🌱 Database empty — auto-seeding demo data...');
  const salt = await bcrypt.genSalt(12);

  const admin = await db.collection('users').insertOne({
    name: 'Sunita Sharma', email: 'admin@legaldesk.com',
    password: await bcrypt.hash('admin123', salt),
    role: 'admin', phone: '9876543210', language: 'en', createdAt: new Date(),
  });
  const lawyer1 = await db.collection('users').insertOne({
    name: 'Adv. Rajesh Mehta', email: 'lawyer@legaldesk.com',
    password: await bcrypt.hash('lawyer123', salt),
    role: 'lawyer', phone: '9876543211', specialization: 'Property Law', language: 'en', createdBy: admin.insertedId, createdAt: new Date(),
  });
  const lawyer2 = await db.collection('users').insertOne({
    name: 'Adv. Priya Desai', email: 'lawyer2@legaldesk.com',
    password: await bcrypt.hash('lawyer123', salt),
    role: 'lawyer', phone: '9876543212', specialization: 'Criminal Law', language: 'en', createdBy: admin.insertedId, createdAt: new Date(),
  });
  const client1 = await db.collection('users').insertOne({
    name: 'Priya Patel', email: 'client@legaldesk.com',
    password: await bcrypt.hash('client123', salt),
    role: 'client', phone: '9876543213', language: 'en', createdAt: new Date(),
  });
  const client2 = await db.collection('users').insertOne({
    name: 'Amit Kumar', email: 'client2@legaldesk.com',
    password: await bcrypt.hash('client123', salt),
    role: 'client', phone: '9876543214', language: 'mr', createdAt: new Date(),
  });

  const case1 = await db.collection('cases').insertOne({
    title: 'Patel vs. State Housing Board', caseNumber: 'LD-2024-1001', type: 'Property', status: 'active',
    client: client1.insertedId, lawyer: lawyer1.insertedId, courtName: 'Mumbai High Court',
    nextHearingDate: new Date(Date.now() + 5*24*60*60*1000), filingDeadline: new Date(Date.now() + 10*24*60*60*1000),
    timeline: [
      { event: 'Case filed', date: new Date(Date.now() - 30*24*60*60*1000), addedBy: admin.insertedId },
      { event: 'First hearing completed', date: new Date(Date.now() - 15*24*60*60*1000), addedBy: lawyer1.insertedId },
      { event: 'Evidence submitted', date: new Date(Date.now() - 7*24*60*60*1000), addedBy: lawyer1.insertedId },
    ],
    missingDocs: true, description: 'Property dispute regarding land ownership in Pune district.', createdAt: new Date(Date.now() - 30*24*60*60*1000),
  });
  const case2 = await db.collection('cases').insertOne({
    title: 'Kumar Family Trust Dispute', caseNumber: 'LD-2024-1002', type: 'Family', status: 'urgent',
    client: client2.insertedId, lawyer: lawyer1.insertedId, courtName: 'Pune District Court',
    nextHearingDate: new Date(Date.now() + 2*24*60*60*1000), filingDeadline: null,
    timeline: [{ event: 'Case filed', date: new Date(Date.now() - 20*24*60*60*1000), addedBy: admin.insertedId }],
    missingDocs: false, description: 'Family trust property inheritance dispute.', createdAt: new Date(Date.now() - 20*24*60*60*1000),
  });
  await db.collection('cases').insertOne({
    title: 'State vs. Rohit Sharma', caseNumber: 'LD-2024-1003', type: 'Criminal', status: 'hearing_soon',
    client: client1.insertedId, lawyer: lawyer2.insertedId, courtName: 'Mumbai Sessions Court',
    nextHearingDate: new Date(Date.now() + 6*24*60*60*1000), filingDeadline: new Date(Date.now() + 3*24*60*60*1000),
    timeline: [
      { event: 'FIR filed', date: new Date(Date.now() - 60*24*60*60*1000), addedBy: admin.insertedId },
      { event: 'Bail granted', date: new Date(Date.now() - 45*24*60*60*1000), addedBy: lawyer2.insertedId },
    ],
    missingDocs: false, description: 'Criminal defense case.', createdAt: new Date(Date.now() - 60*24*60*60*1000),
  });

  await db.collection('invoices').insertOne({
    case: case1.insertedId, client: client1.insertedId, lawyer: lawyer1.insertedId,
    billableHours: 15, hourlyRate: 2000, expenses: [{ description: 'Court filing fee', amount: 5000, date: new Date() }],
    totalAmount: 35000, paymentStatus: 'pending', pdfUrl: null, createdAt: new Date(),
  });
  await db.collection('invoices').insertOne({
    case: case2.insertedId, client: client2.insertedId, lawyer: lawyer1.insertedId,
    billableHours: 8, hourlyRate: 2000, expenses: [{ description: 'Stamp duty', amount: 3000, date: new Date() }],
    totalAmount: 19000, paymentStatus: 'paid', pdfUrl: null, createdAt: new Date(),
  });
  await db.collection('appointments').insertOne({
    case: case1.insertedId, client: client1.insertedId, lawyer: lawyer1.insertedId,
    dateTime: new Date(Date.now() + 2*24*60*60*1000 + 10*60*60*1000), status: 'confirmed',
    notes: 'Discuss property documents', createdAt: new Date(),
  });

  console.log('✅ Demo data seeded! Credentials:');
  console.log('   Admin:  admin@legaldesk.com / admin123');
  console.log('   Lawyer: lawyer@legaldesk.com / lawyer123');
  console.log('   Client: client@legaldesk.com / client123');
};

const start = async () => {
  await connectDB();
  await seedIfEmpty();
  startReminderCron();

  app.listen(PORT, () => {
    console.log(`\n⚖️  LegalDesk API Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
  });
};

start().catch(console.error);
