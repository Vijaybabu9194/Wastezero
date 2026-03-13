const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  wasteCategories: [{
    type: {
      type: String,
      enum: ['plastic', 'organic', 'e-waste', 'paper', 'glass', 'metal', 'other'],
      required: true
    },
    estimatedWeight: {
      type: Number, // in kg
      required: true
    },
    description: String
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTimeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true
  },
  pickupAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Track agents interested in the pickup (for future notifications)
  interestedAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }],
  // Timestamp when pickup was claimed by agent
  claimedAt: {
    type: Date
  },
  actualWeight: {
    type: Number // Updated after pickup completion
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'waived'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  notes: String,
  images: [String], // URLs to uploaded images
  rating: {
    score: Number,
    review: String
  },
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp
pickupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
pickupSchema.index({ userId: 1, createdAt: -1 });
pickupSchema.index({ agentId: 1, status: 1 });
pickupSchema.index({ status: 1, scheduledDate: 1 });
pickupSchema.index({ status: 1, createdAt: -1 }); // For finding available pickups

module.exports = mongoose.model('Pickup', pickupSchema);
