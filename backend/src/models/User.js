import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['student', 'club'],
    default: 'student'
  },
  // Student specific fields
  studentId: {
    type: String,
    sparse: true, // Allows null/undefined values while maintaining uniqueness for non-null values
    unique: true,
    required: function() {
      return this.role === 'student'
    }
  },
  year: {
    type: String,
    enum: ['FE', 'SE', 'TE', 'BE', '1st Year', '2nd Year', '3rd Year', '4th Year'],
    required: function() {
      return this.role === 'student'
    }
  },
  branch: {
    type: String,
    enum: [
      // Engineering Branches
      'AI&DS', 'AI&ML', 'CIVIL', 'COMPS', 'CS&E', 'E&CS', 'E&TC', 'IoT', 'IT', 'MECH', 'M&ME',
      // Other Courses
      'BCA', 'MCA', 'MBA', 'BVOC'
    ],
    required: function() {
      return this.role === 'student'
    }
  },
  // Course type to distinguish between Engineering, Management, etc.
  courseType: {
    type: String,
    enum: ['Engineering', 'Management', 'Computer Applications', 'Vocational'],
    required: function() {
      return this.role === 'student'
    }
  },
  // Club specific fields
  clubName: {
    type: String,
    required: function() {
      return this.role === 'club'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  verified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // RSVP events for students
  rsvpEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  // Events created by clubs
  eventsCreated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  // Saved/bookmarked posts
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  // Profile settings
  profileSettings: {
    showEmail: {
      type: Boolean,
      default: false
    },
    showYear: {
      type: Boolean,
      default: true
    },
    showBranch: {
      type: Boolean,
      default: true
    },
    allowMessages: {
      type: Boolean,
      default: true
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    }
  },
  // Social stats (will be updated via triggers/middleware)
  socialStats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    totalUpvotes: {
      type: Number,
      default: 0
    },
    totalDownvotes: {
      type: Number,
      default: 0
    },
    reputation: {
      type: Number,
      default: 0
    }
  },
  // Last activity tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Clean up undefined fields before validation
userSchema.pre('validate', function(next) {
  // Remove undefined values for club registrations
  if (this.role === 'club') {
    this.studentId = undefined
    this.year = undefined
    this.branch = undefined
    this.courseType = undefined
  }
  next()
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

// Update last activity
userSchema.methods.updateLastActivity = function() {
  this.lastActivityAt = new Date()
  return this.save()
}

// Calculate user reputation based on posts and comments
userSchema.methods.calculateReputation = function() {
  // Reputation = (upvotes * 2) - (downvotes * 1) + (posts * 1) + (comments * 0.5)
  const { totalUpvotes, totalDownvotes } = this.socialStats
  const { totalPosts, totalComments } = this.socialStats
  
  return (totalUpvotes * 2) - (totalDownvotes * 1) + (totalPosts * 1) + (totalComments * 0.5)
}

// Update social stats (to be called when posts/comments/votes change)
userSchema.methods.updateSocialStats = async function() {
  const Post = mongoose.model('Post')
  const Comment = mongoose.model('Comment')
  
  // Count posts and comments
  const [postCount, commentCount] = await Promise.all([
    Post.countDocuments({ author: this._id }),
    Comment.countDocuments({ author: this._id })
  ])
  
  // Count upvotes and downvotes received
  const [upvotesResult, downvotesResult] = await Promise.all([
    Post.aggregate([
      { $match: { author: this._id } },
      { $project: { upvoteCount: { $size: '$upvotes' } } },
      { $group: { _id: null, total: { $sum: '$upvoteCount' } } }
    ]),
    Post.aggregate([
      { $match: { author: this._id } },
      { $project: { downvoteCount: { $size: '$downvotes' } } },
      { $group: { _id: null, total: { $sum: '$downvoteCount' } } }
    ])
  ])
  
  this.socialStats.totalPosts = postCount
  this.socialStats.totalComments = commentCount
  this.socialStats.totalUpvotes = upvotesResult[0]?.total || 0
  this.socialStats.totalDownvotes = downvotesResult[0]?.total || 0
  this.socialStats.reputation = this.calculateReputation()
  
  return this.save()
}

// Check if user has saved a specific post
userSchema.methods.hasSavedPost = function(postId) {
  return this.savedPosts.some(savedPostId => savedPostId.toString() === postId.toString())
}

// Get public profile data (respecting privacy settings)
userSchema.methods.getPublicProfile = function() {
  const publicData = {
    _id: this._id,
    name: this.name,
    role: this.role,
    profilePicture: this.profilePicture,
    description: this.description,
    verified: this.verified,
    socialStats: this.socialStats,
    createdAt: this.createdAt
  }
  
  // Add fields based on privacy settings
  if (this.profileSettings.showEmail) {
    publicData.email = this.email
  }
  
  if (this.role === 'student') {
    if (this.profileSettings.showYear) {
      publicData.year = this.year
    }
    if (this.profileSettings.showBranch) {
      publicData.branch = this.branch
      publicData.courseType = this.courseType
    }
    publicData.studentId = this.studentId
  } else if (this.role === 'club') {
    publicData.clubName = this.clubName
  }
  
  return publicData
}

// Create compound index to allow same email for different roles
userSchema.index({ email: 1, role: 1 }, { unique: true, name: 'email_role_compound' })

const User = mongoose.model('User', userSchema)

// Function to fix database indexes
User.fixIndexes = async function() {
  try {
    const collection = this.collection
    
    // Drop the old email index if it exists
    try {
      await collection.dropIndex('email_1')
      console.log('🔧 Dropped old email_1 index')
    } catch (error) {
      if (!error.message.includes('index not found')) {
        console.log('Index info:', error.message)
      }
    }
    
    // Ensure the compound index exists
    await this.createIndexes()
    console.log('✅ Ensured compound index exists')
    
    return true
  } catch (error) {
    console.log('⚠️  Index fix warning:', error.message)
    return false
  }
}

export default User