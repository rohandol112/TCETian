import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post author is required']
  },
  category: {
    type: String,
    required: [true, 'Post category is required'],
    enum: [
      'Academic', 
      'Events', 
      'Study Group', 
      'General', 
      'Placement', 
      'Sports', 
      'Culture', 
      'Tech'
    ]
  },
  postType: {
    type: String,
    enum: ['text', 'image', 'link'],
    default: 'text'
  },
  // For image posts
  image: {
    type: String,
    validate: {
      validator: function(v) {
        return this.postType !== 'image' || (v && v.length > 0)
      },
      message: 'Image is required for image posts'
    }
  },
  // For link posts
  linkUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return this.postType !== 'link' || (v && v.length > 0)
      },
      message: 'Link URL is required for link posts'
    }
  },
  linkTitle: {
    type: String,
    maxlength: [200, 'Link title cannot exceed 200 characters']
  },
  // Tags for better discoverability
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  // Voting system
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Comments reference
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // Post stats
  viewCount: {
    type: Number,
    default: 0
  },
  // Moderation
  isLocked: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  // Awards/Recognition
  awards: [{
    type: {
      type: String,
      enum: ['helpful', 'insightful', 'funny', 'wholesome', 'gold']
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    givenAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Academic year filter (for year-specific discussions)
  targetYear: {
    type: String,
    enum: ['All', 'FE', 'SE', 'TE', 'BE', '1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: 'All'
  },
  // Branch filter (for branch-specific discussions)
  targetBranch: {
    type: String,
    enum: ['All', 'AI&DS', 'AI&ML', 'CIVIL', 'COMPS', 'CS&E', 'E&CS', 'E&TC', 'IoT', 'IT', 'MECH', 'M&ME', 'BCA', 'MCA', 'MBA', 'BVOC'],
    default: 'All'
  }
}, {
  timestamps: true
})

// Virtual for net vote count (upvotes - downvotes)
postSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length
})

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length
})

// Virtual for hot score (time-decay algorithm)
postSchema.virtual('hotScore').get(function() {
  const now = new Date()
  const ageInHours = (now - this.createdAt) / (1000 * 60 * 60)
  const voteScore = this.voteCount
  const commentBonus = this.commentCount * 0.5
  
  // Reddit-like hot algorithm
  return (voteScore + commentBonus) / Math.pow(ageInHours + 2, 1.8)
})

// Comprehensive indexing strategy for 500+ posts performance
// Primary indexes for common queries
postSchema.index({ createdAt: -1 }) // Sort by newest
postSchema.index({ isHidden: 1, createdAt: -1 }) // Active posts sorted by time

// Category and filter indexes
postSchema.index({ category: 1, createdAt: -1 })
postSchema.index({ category: 1, isHidden: 1, createdAt: -1 })
postSchema.index({ targetYear: 1, targetBranch: 1, isHidden: 1 })

// Author and engagement indexes
postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ 'upvotes.user': 1 })
postSchema.index({ 'downvotes.user': 1 })
postSchema.index({ tags: 1 })

// Compound indexes for hot/trending algorithms
postSchema.index({ 
  isHidden: 1, 
  createdAt: -1,
  'upvotes': 1,
  'downvotes': 1 
})

// Sparse index for pinned posts
postSchema.index({ isPinned: 1 }, { sparse: true })

// TTL index for view count optimization (optional - for analytics)
postSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
  partialFilterExpression: { viewCount: { $lt: 10 } } // Only low-engagement posts
})

// Text search index with weights
postSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,    // Title matches are most important
    tags: 5,      // Tag matches are moderately important  
    content: 1    // Content matches are least important
  },
  name: 'post_text_search'
})

// Geospatial index for location-based posts (future feature)
// postSchema.index({ location: '2dsphere' })

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true })

// Method to check if user has upvoted
postSchema.methods.hasUpvoted = function(userId) {
  return this.upvotes.some(vote => vote.user.toString() === userId.toString())
}

// Method to check if user has downvoted
postSchema.methods.hasDownvoted = function(userId) {
  return this.downvotes.some(vote => vote.user.toString() === userId.toString())
}

// Method to upvote post
postSchema.methods.upvote = function(userId) {
  // Remove any existing votes from this user
  this.upvotes = this.upvotes.filter(vote => vote.user.toString() !== userId.toString())
  this.downvotes = this.downvotes.filter(vote => vote.user.toString() !== userId.toString())
  
  // Add upvote
  this.upvotes.push({ user: userId })
}

// Method to downvote post
postSchema.methods.downvote = function(userId) {
  // Remove any existing votes from this user
  this.upvotes = this.upvotes.filter(vote => vote.user.toString() !== userId.toString())
  this.downvotes = this.downvotes.filter(vote => vote.user.toString() !== userId.toString())
  
  // Add downvote
  this.downvotes.push({ user: userId })
}

// Method to remove vote
postSchema.methods.removeVote = function(userId) {
  this.upvotes = this.upvotes.filter(vote => vote.user.toString() !== userId.toString())
  this.downvotes = this.downvotes.filter(vote => vote.user.toString() !== userId.toString())
}

export default mongoose.model('Post', postSchema)