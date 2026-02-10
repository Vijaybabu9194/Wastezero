const mongoose = require('mongoose');
const User = require('./models/User');
const Agent = require('./models/Agent');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wastezero';

// Admin user - created by default
const seedUsers = [
  {
    name: 'Vijay Babu',
    email: 'vijaybabuarumilli@gmail.com',
    password: 'Vijaybabu99@',
    phone: '+919876543210',
    role: 'admin',
    address: {
      street: 'Admin Office',
      city: 'Hyderabad',
      state: 'TS',
      zipCode: '500001',
      coordinates: {
        lat: 17.3850,
        lng: 78.4867
      }
    }
  }
  // Add more users here if needed
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Agent.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    if (seedUsers.length > 0) {
      const createdUsers = await User.create(seedUsers);
      console.log('Created users:', createdUsers.map(u => u.email));

      // Create agent profile for agent users
      const agentUser = createdUsers.find(u => u.role === 'agent');
      if (agentUser) {
        await Agent.create({
          userId: agentUser._id,
          vehicleType: 'truck',
          vehicleNumber: 'VEHICLE-001',
          licenseNumber: 'LICENSE-001',
          serviceAreas: ['10001', '10002', '10003'],
          currentLocation: {
            coordinates: {
              lat: agentUser.address.coordinates.lat,
              lng: agentUser.address.coordinates.lng
            },
            lastUpdated: new Date()
          },
          status: 'available',
          isVerified: true
        });
        console.log('Created agent profile');
      }

      console.log('\n✅ Database seeded successfully!');
      console.log(`Created ${createdUsers.length} user(s)`);
    } else {
      console.log('\n✅ Database cleared successfully!');
      console.log('No seed users defined. Please register new accounts via the app.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
