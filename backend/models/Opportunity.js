const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  location: {
    address: {
      type: String,
      required: [true, 'Location address is required']
    },
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  maxVolunteers: {
    type: Number,
    default: 10,
    min: [1, 'At least 1 volunteer spot required']
  },
  currentVolunteers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: [
      'pending_review',   // waiting for NGO review
      'accepted',         // NGO has accepted to coordinate
      'assigned',         // assigned to a volunteer
      'in_progress',      // volunteer actively working
      'completed',        // completed by volunteer
      'draft',
      'cancelled',
      'rejected'          // rejected by NGO
    ],
    default: 'pending_review'
  },
  // NGO who accepted/reviewed this opportunity (coordinator)
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: { type: Date, default: null },
  // Volunteer(s) assigned by NGO (task executor)
  assignedTo: [{
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  category: {
    type: String,
    enum: ['waste-collection', 'awareness', 'recycling', 'cleanup-drive', 'education', 'other'],
    default: 'other'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient searching
opportunitySchema.index({ status: 1, startDate: 1 });
opportunitySchema.index({ category: 1 });
opportunitySchema.index({ createdBy: 1 });

// Virtual for available spots
opportunitySchema.virtual('availableSpots').get(function() {
  const approvedVolunteers = this.currentVolunteers.filter(v => v.status === 'approved').length;
  return this.maxVolunteers - approvedVolunteers;
});

// Virtual to check if opportunity is full
opportunitySchema.virtual('isFull').get(function() {
  const approvedVolunteers = this.currentVolunteers.filter(v => v.status === 'approved').length;
  return approvedVolunteers >= this.maxVolunteers;
});

// Ensure virtuals are included in JSON
opportunitySchema.set('toJSON', { virtuals: true });
opportunitySchema.set('toObject', { virtuals: true });

// Pre-save validation to ensure end date is after start date
opportunitySchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Opportunity', opportunitySchema);
