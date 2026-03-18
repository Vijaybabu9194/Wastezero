const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Backward-compatible field used by some controllers.
  // We normalize it into userId in pre-validation.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'pickup_scheduled',
      'agent_assigned',
      'pickup_assigned',
      'pickup_released',
      'pickup_started',
      'pickup_in-progress',
      'pickup_completed',
      'pickup_cancelled',
      'system_alert',
      'info',
      'success',
      'new_pickup_assigned'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedPickup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pickup'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.pre('validate', function(next) {
  if (!this.userId && this.user) {
    this.userId = this.user;
  }
  next();
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
