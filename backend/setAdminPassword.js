const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const setAdminPassword = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wastezero';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const newPassword = 'admin@123';
    
    // Find existing admin user
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('No admin found. Creating new admin account...\n');
      
      // Create new admin if doesn't exist
      admin = new User({
        name: 'Admin User',
        email: 'admin@wastezero.com',
        password: newPassword,
        phone: '9999999999',
        role: 'admin',
        address: {
          street: 'Admin Office',
          city: 'Admin City',
          state: 'AC',
          zipCode: '00000',
          coordinates: {
            lat: 0,
            lng: 0
          }
        }
      });
      
      await admin.save();
      console.log('✅ New admin account created successfully!\n');
      console.log('Login credentials:');
      console.log('Email: admin@wastezero.com');
      console.log('Password: admin@123\n');
    } else {
      // Update existing admin password
      admin.password = newPassword;
      await admin.save();
      console.log('✅ Admin password updated successfully!\n');
      console.log('Admin Email:', admin.email);
      console.log('New Password: admin@123\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting admin password:', error.message);
    process.exit(1);
  }
};

setAdminPassword();
