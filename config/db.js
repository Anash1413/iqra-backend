const mongoose = require('mongoose');
const dns = require('node:dns');

// Force custom public DNS servers to resolve MongoDB Atlas SRV lookup errors (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e.message);
}

const connectDB = async () => {
  try {
    const primaryUri = process.env.MONGODB_URI;
    if (!primaryUri) {
      throw new Error('MONGODB_URI environment variable is missing from system environment config.');
    }
    const conn = await mongoose.connect(primaryUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
