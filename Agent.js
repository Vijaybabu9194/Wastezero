const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['truck', 'van', 'bike', 'car'],
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  serviceAreas: [{
    type: String // City or zip codes
  }],
  currentLocation: {
    coordinates: {
      lat: Number,
      lng: Number
    },
    lastUpdated: Date
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  completedPickups: {
    type: Number,
    default: 0
  },
  totalWeightCollected: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  documents: {
    license: String,
    vehicleRegistration: String,
    insurance: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Agent', agentSchema);
