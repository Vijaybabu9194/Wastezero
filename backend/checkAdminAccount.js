const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkAdminAccount = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wastezero';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin account found\n');
      process.exit(1);
    }
    

    console.log('Admin Account Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Name:', admin.name);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Is Active:', admin.isActive);
    console.log('Is Email Verified:', admin.isEmailVerified);
    console.log('Account Status:', admin.isSuspended ? 'SUSPENDED' : 'ACTIVE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Fix the account if inactive
    if (!admin.isActive) {
      console.log('⚠️  Account is deactivated. Activating...\n');
      admin.isActive = true;
      admin.isEmailVerified = true;
      await admin.save();
      console.log('✅ Admin account activated!\n');
    } else {
      console.log('✅ Admin account is already active\n');
    }

    console.log('Login credentials:');
    console.log('Email:', admin.email);
    console.log('Password: admin@123\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

checkAdminAccount();
