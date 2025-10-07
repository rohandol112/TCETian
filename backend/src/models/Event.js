import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event organizer is required']
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: [
      'Technical', 
      'Cultural', 
      'Sports', 
      'Workshop', 
      'Seminar', 
      'Competition', 
      'Social',
      'Academic',
      'Other'
    ]
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(date) {
        // Skip validation for existing documents (editing)
        if (!this.isNew) return true
        return date > new Date()
      },
      message: 'Event date must be in the future'
    }
  },
  eventTime: {
    type: String,
    required: [true, 'Event time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  duration: {
    type: Number, // Duration in hours
    required: [true, 'Event duration is required'],
    min: [0.5, 'Duration must be at least 0.5 hours'],
    max: [24, 'Duration cannot exceed 24 hours']
  },
  venue: {
    type: String,
    required: [true, 'Event venue is required'],
    trim: true,
    maxlength: [200, 'Venue cannot exceed 200 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [5000, 'Capacity cannot exceed 5000']
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required'],
    validate: {
      validator: function(date) {
        // Skip validation for existing documents (editing/fetching)
        if (!this.isNew) return true
        
        // For new events, check if before event date (allow same day registration)
        if (!this.eventDate) return true // Will be validated in controller
        
        // Registration deadline should be before event date
        return date < this.eventDate
      },
      message: 'Registration deadline must be before the event start time'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  requirements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Requirement cannot exceed 200 characters']
  }],
  prizes: [{
    position: {
      type: String,
      enum: ['1st', '2nd', '3rd', 'Participation', 'Other']
    },
    description: {
      type: String,
      maxlength: [200, 'Prize description cannot exceed 200 characters']
    }
  }],
  // RSVP Management
  rsvpUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rsvpDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'waitlist', 'cancelled'],
      default: 'confirmed'
    }
  }],
  maxRSVP: {
    type: Number,
    default: function() {
      return this.capacity
    }
  },
  // Event Status
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'published'
  },
  // Contact Information
  contactInfo: {
    email: {
      type: String,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    }
  },
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  // Featured event
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Virtual for current RSVP count
eventSchema.virtual('currentRSVP').get(function() {
  if (!this.rsvpUsers || !Array.isArray(this.rsvpUsers)) {
    return 0
  }
  return this.rsvpUsers.filter(rsvp => rsvp && rsvp.status === 'confirmed').length
})

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  const maxRSVP = this.maxRSVP || 0
  const currentRSVP = this.currentRSVP || 0
  return Math.max(0, maxRSVP - currentRSVP)
})

// Virtual for is full
eventSchema.virtual('isFull').get(function() {
  return this.currentRSVP >= this.maxRSVP
})

// Index for efficient queries
eventSchema.index({ eventDate: 1, status: 1 })
eventSchema.index({ organizer: 1, eventDate: -1 })
eventSchema.index({ category: 1, eventDate: 1 })
eventSchema.index({ tags: 1 })

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true })

// Method to check if user has RSVP'd (any active status)
eventSchema.methods.hasUserRSVP = function(userId) {
  if (!this.rsvpUsers) return false
  return this.rsvpUsers.some(rsvp => {
    const rsvpUserId = rsvp.user._id || rsvp.user
    return rsvpUserId?.toString() === userId?.toString() && 
           (rsvp.status === 'confirmed' || rsvp.status === 'waitlist')
  })
}

// Method to get user's RSVP status
eventSchema.methods.getUserRSVPStatus = function(userId) {
  if (!this.rsvpUsers) return null
  const rsvp = this.rsvpUsers.find(rsvp => {
    const rsvpUserId = rsvp.user._id || rsvp.user
    return rsvpUserId?.toString() === userId?.toString() &&
           (rsvp.status === 'confirmed' || rsvp.status === 'waitlist')
  })
  
  return rsvp ? rsvp.status : null
}

// Method to add RSVP
eventSchema.methods.addRSVP = function(userId) {
  if (!this.rsvpUsers) this.rsvpUsers = []
  
  // Check if user already RSVP'd
  const existingRSVP = this.rsvpUsers.find(rsvp => {
    const rsvpUserId = rsvp.user._id || rsvp.user
    return rsvpUserId?.toString() === userId?.toString()
  })
  
  if (existingRSVP) {
    if (existingRSVP.status === 'cancelled') {
      existingRSVP.status = 'confirmed'
      existingRSVP.rsvpDate = new Date()
    }
    return existingRSVP
  }
  
  // Add new RSVP
  const newRSVP = {
    user: userId,
    status: this.isFull ? 'waitlist' : 'confirmed'
  }
  
  this.rsvpUsers.push(newRSVP)
  return newRSVP
}

// Method to cancel RSVP
eventSchema.methods.cancelRSVP = function(userId) {
  if (!this.rsvpUsers) return null
  
  const rsvp = this.rsvpUsers.find(rsvp => {
    const rsvpUserId = rsvp.user._id || rsvp.user
    return rsvpUserId?.toString() === userId?.toString()
  })
  
  if (rsvp) {
    rsvp.status = 'cancelled'
    // Promote waitlist user if spot available
    const waitlistUser = this.rsvpUsers.find(r => r.status === 'waitlist')
    if (waitlistUser) {
      waitlistUser.status = 'confirmed'
    }
  }
  
  return rsvp
}

export default mongoose.model('Event', eventSchema)