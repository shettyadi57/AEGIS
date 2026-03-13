// AEGIS — MongoDB Connection
const mongoose = require('mongoose');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis', {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[AEGIS] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[AEGIS] MongoDB connection error:', err.message);
    console.error('Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  }
}

module.exports = connectDB;
