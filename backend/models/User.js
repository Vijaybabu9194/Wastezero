const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  role: {
    type: String,
    enum: ['user', 'ngo', 'agent', 'admin'],
    default: 'user'
  },
  // Volunteer skills / preferred waste types (e.g., "plastic", "e-waste")
  skills: [{
    type: String,
    trim: true
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  wasteStats: {
    totalPickups: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 }, // in kg
    plasticWeight: { type: Number, default: 0 },
    organicWeight: { type: Number, default: 0 },
    ewasteWeight: { type: Number, default: 0 },
    paperWeight: { type: Number, default: 0 },
    glassWeight: { type: Number, default: 0 },
    metalWeight: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  suspensionReason: {
    type: String,
    trim: true,
    default: null
  },
  suspendedAt: {
    type: Date,
    default: null
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  profileImage: String,
  otp: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date,
    select: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update the updatedAt timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
