const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/iqra_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Ensure the default Super Admin exists with the correct password
    let superAdmin = await User.findOne({ email: 'superadmin@iqra.org' });
    if (!superAdmin) {
      await User.create({
        name: 'Demo Super Admin',
        email: 'superadmin@iqra.org',
        password: 'superadmin123',
        role: 'superadmin'
      });
      console.log('Created Default Super Admin account: superadmin@iqra.org / superadmin123');
    } else {
      // Force reset its password to superadmin123 to resolve login blockages
      superAdmin.password = 'superadmin123';
      superAdmin.name = 'Demo Super Admin';
      await superAdmin.save();
      console.log('Reset Default Super Admin password: superadmin@iqra.org / superadmin123');
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
