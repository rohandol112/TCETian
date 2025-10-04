import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [5000, 'Comment cannot exceed 5000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required']
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required']
  },
  // For nested comments (replies)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  // Child comments (replies to this comment)
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // Voting system for comments
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
  // Comment depth (for nested comments visualization)
  depth: {
    type: Number,
    default: 0,
    max: 5 // Limit nesting to 5 levels
  },
  // Moderation
  isDeleted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  // Awards for comments
  awards: [{
    type: {
      type: String,
      enum: ['helpful', 'insightful', 'funny', 'wholesome']
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    givenAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Virtual for net vote count
commentSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length
})

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length
})

// Index for efficient queries
commentSchema.index({ post: 1, createdAt: -1 })
commentSchema.index({ author: 1, createdAt: -1 })
commentSchema.index({ parentComment: 1, createdAt: -1 })
commentSchema.index({ 'upvotes.user': 1 })
commentSchema.index({ 'downvotes.user': 1 })

// Ensure virtuals are included in JSON
commentSchema.set('toJSON', { virtuals: true })

// Method to check if user has upvoted
commentSchema.methods.hasUpvoted = function(userId) {
  return this.upvotes.some(vote => vote.user.toString() === userId.toString())
}

// Method to check if user has downvoted
commentSchema.methods.hasDownvoted = function(userId) {
  return this.downvotes.some(vote => vote.user.toString() === userId.toString())
}

// Method to upvote comment
commentSchema.methods.upvote = function(userId) {
  // Remove any existing votes from this user
  this.upvotes = this.upvotes.filter(vote => vote.user.toString() !== userId.toString())
  this.downvotes = this.downvotes.filter(vote => vote.user.toString() !== userId.toString())
  
  // Add upvote
  this.upvotes.push({ user: userId })
}

// Method to downvote comment
commentSchema.methods.downvote = function(userId) {
  // Remove any existing votes from this user
  this.upvotes = this.upvotes.filter(vote => vote.user.toString() !== userId.toString())
  this.downvotes = this.downvotes.filter(vote => vote.user.toString() !== userId.toString())
  
  // Add downvote
  this.downvotes.push({ user: userId })
}

// Method to remove vote
commentSchema.methods.removeVote = function(userId) {
  this.upvotes = this.upvotes.filter(vote => vote.user.toString() !== userId.toString())
  this.downvotes = this.downvotes.filter(vote => vote.user.toString() !== userId.toString())
}

export default mongoose.model('Comment', commentSchema)