import mongoose from 'mongoose'

const forumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['Academic', 'Technology', 'Sports', 'Arts', 'General', 'Events', 'Career', 'Entertainment']
  },
  tags: [{
    type: String,
    trim: true
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  rules: [{
    title: String,
    description: String
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowPosts: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowImages: {
      type: Boolean,
      default: true
    },
    allowPolls: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    memberCount: {
      type: Number,
      default: 0
    },
    postCount: {
      type: Number,
      default: 0
    },
    dailyActiveUsers: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
})

// Indexes for better performance (name index auto-created by unique: true)
forumSchema.index({ category: 1 })
forumSchema.index({ 'members.user': 1 })
forumSchema.index({ creator: 1 })

// Update member count when members change
forumSchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.stats.memberCount = this.members.length
  }
  next()
})

// Virtual for member count
forumSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0
})

export default mongoose.model('Forum', forumSchema)