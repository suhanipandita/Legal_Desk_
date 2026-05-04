require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function seed() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();

  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.collection('users').deleteMany({});
  await db.collection('cases').deleteMany({});
  await db.collection('documents').deleteMany({});
  await db.collection('appointments').deleteMany({});
  await db.collection('invoices').deleteMany({});

  const salt = await bcrypt.genSalt(12);

  // Create Admin
  const admin = await db.collection('users').insertOne({
    name: 'Sunita Sharma',
    email: 'admin@legaldesk.com',
    password: await bcrypt.hash('admin123', salt),
    role: 'admin',
    phone: '9876543210',
    language: 'en',
    createdAt: new Date(),
  });

  // Create Lawyers
  const lawyer1 = await db.collection('users').insertOne({
    name: 'Adv. Rajesh Mehta',
    email: 'lawyer@legaldesk.com',
    password: await bcrypt.hash('lawyer123', salt),
    role: 'lawyer',
    phone: '9876543211',
    specialization: 'Property Law',
    language: 'en',
    createdBy: admin.insertedId,
    createdAt: new Date(),
  });

  const lawyer2 = await db.collection('users').insertOne({
    name: 'Adv. Priya Desai',
    email: 'lawyer2@legaldesk.com',
    password: await bcrypt.hash('lawyer123', salt),
    role: 'lawyer',
    phone: '9876543212',
    specialization: 'Criminal Law',
    language: 'en',
    createdBy: admin.insertedId,
    createdAt: new Date(),
  });

  // Create Clients
  const client1 = await db.collection('users').insertOne({
    name: 'Priya Patel',
    email: 'client@legaldesk.com',
    password: await bcrypt.hash('client123', salt),
    role: 'client',
    phone: '9876543213',
    language: 'en',
    createdAt: new Date(),
  });

  const client2 = await db.collection('users').insertOne({
    name: 'Amit Kumar',
    email: 'client2@legaldesk.com',
    password: await bcrypt.hash('client123', salt),
    role: 'client',
    phone: '9876543214',
    language: 'mr',
    createdAt: new Date(),
  });

  // Create Cases
  const case1 = await db.collection('cases').insertOne({
    title: 'Patel vs. State Housing Board',
    caseNumber: 'LD-2024-1001',
    type: 'Property',
    status: 'active',
    client: client1.insertedId,
    lawyer: lawyer1.insertedId,
    courtName: 'Mumbai High Court',
    nextHearingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    filingDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    timeline: [
      { event: 'Case filed', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), addedBy: admin.insertedId },
      { event: 'First hearing completed', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), addedBy: lawyer1.insertedId },
      { event: 'Evidence submitted', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), addedBy: lawyer1.insertedId },
    ],
    missingDocs: true,
    description: 'Property dispute regarding land ownership in Pune district.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  });

  const case2 = await db.collection('cases').insertOne({
    title: 'Kumar Family Trust Dispute',
    caseNumber: 'LD-2024-1002',
    type: 'Family',
    status: 'urgent',
    client: client2.insertedId,
    lawyer: lawyer1.insertedId,
    courtName: 'Pune District Court',
    nextHearingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    filingDeadline: null,
    timeline: [
      { event: 'Case filed', date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), addedBy: admin.insertedId },
    ],
    missingDocs: false,
    description: 'Family trust property inheritance dispute.',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  });

  const case3 = await db.collection('cases').insertOne({
    title: 'State vs. Rohit Sharma',
    caseNumber: 'LD-2024-1003',
    type: 'Criminal',
    status: 'hearing_soon',
    client: client1.insertedId,
    lawyer: lawyer2.insertedId,
    courtName: 'Mumbai Sessions Court',
    nextHearingDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    filingDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    timeline: [
      { event: 'FIR filed', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), addedBy: admin.insertedId },
      { event: 'Bail granted', date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), addedBy: lawyer2.insertedId },
    ],
    missingDocs: false,
    description: 'Criminal defense case.',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  });

  // Create Invoices
  await db.collection('invoices').insertOne({
    case: case1.insertedId,
    client: client1.insertedId,
    lawyer: lawyer1.insertedId,
    billableHours: 15,
    hourlyRate: 2000,
    expenses: [
      { description: 'Court filing fee', amount: 5000, date: new Date() },
      { description: 'Document notarization', amount: 1500, date: new Date() },
    ],
    totalAmount: 36500,
    paymentStatus: 'pending',
    pdfUrl: null,
    createdAt: new Date(),
  });

  await db.collection('invoices').insertOne({
    case: case2.insertedId,
    client: client2.insertedId,
    lawyer: lawyer1.insertedId,
    billableHours: 8,
    hourlyRate: 2000,
    expenses: [
      { description: 'Stamp duty', amount: 3000, date: new Date() },
    ],
    totalAmount: 19000,
    paymentStatus: 'paid',
    pdfUrl: null,
    createdAt: new Date(),
  });

  // Create Appointments
  await db.collection('appointments').insertOne({
    case: case1.insertedId,
    client: client1.insertedId,
    lawyer: lawyer1.insertedId,
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    status: 'confirmed',
    notes: 'Discuss property documents',
    createdAt: new Date(),
  });

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:  admin@legaldesk.com  / admin123');
  console.log('  Lawyer: lawyer@legaldesk.com / lawyer123');
  console.log('  Client: client@legaldesk.com / client123\n');

  await client.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
