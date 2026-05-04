const { MongoClient } = require('mongodb');

let db = null;
let client = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // If local MongoDB fails, use in-memory server for development
    try {
      const testClient = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
      await testClient.connect();
      await testClient.db().command({ ping: 1 });
      await testClient.close();
    } catch (localErr) {
      console.log('⚠️  Local MongoDB not available, starting in-memory server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('✅ In-memory MongoDB started at', uri);
    }

    client = new MongoClient(uri);
    await client.connect();
    db = client.db('legaldesk');
    console.log('✅ MongoDB Connected Successfully');

    // Create indexes for performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('cases').createIndex({ lawyer: 1 });
    await db.collection('cases').createIndex({ client: 1 });
    await db.collection('cases').createIndex({ status: 1 });
    await db.collection('documents').createIndex({ case: 1 });
    await db.collection('appointments').createIndex({ lawyer: 1, dateTime: 1 });
    await db.collection('invoices').createIndex({ case: 1 });

    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

const getClient = () => client;

module.exports = { connectDB, getDB, getClient };
