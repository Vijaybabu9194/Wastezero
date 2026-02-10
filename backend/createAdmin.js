const mongoose = require('mongoose');
const User = require('./models/User');
const readline = require('readline');
const dotenv = require('dotenv');

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createAdmin = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wastezero';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    console.log('=== Create Admin Account ===\n');

    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Admin Password: ');
    const phone = await question('Phone Number: ');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('\n❌ User with this email already exists!');
      process.exit(1);
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      phone,
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

    console.log('\n✅ Admin account created successfully!\n');
    console.log('Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nYou can now login at http://localhost:5173/login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
