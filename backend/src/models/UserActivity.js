import mongoose from 'mongoose'

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: [
      'post_created', 'post_viewed', 'post_upvoted', 'post_downvoted', 'post_saved',
      'comment_created', 'comment_upvoted', 'comment_downvoted', 
      'user_login', 'user_logout', 'post_shared', 'profile_updated', 'profile_viewed',
      'socket_connected', 'socket_disconnected', 'room_joined', 'room_left'
    ],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    // Can reference Post, Comment, User, etc.
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    enum: ['Post', 'Comment', 'User', 'Event']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  sessionId: {
    type: String
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
userActivitySchema.index({ user: 1, createdAt: -1 })
userActivitySchema.index({ activityType: 1, createdAt: -1 })
userActivitySchema.index({ targetId: 1, targetType: 1 })
userActivitySchema.index({ createdAt: -1 })

// TTL index to auto-delete old activities (keep for 90 days)
userActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

// Static method to log activity
userActivitySchema.statics.logActivity = async function(userId, activityType, targetId = null, targetType = null, metadata = {}, req = null) {
  try {
    const activityData = {
      user: userId,
      activityType,
      metadata
    }

    if (targetId) {
      activityData.targetId = targetId
      activityData.targetType = targetType
    }

    if (req) {
      activityData.ipAddress = req.ip || req.connection.remoteAddress
      activityData.userAgent = req.get('User-Agent')
      activityData.sessionId = req.sessionID
    }

    await this.create(activityData)
  } catch (error) {
    console.error('Error logging user activity:', error)
  }
}

// Static method to get user activity summary
userActivitySchema.statics.getUserActivitySummary = async function(userId, days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ])
}

export default mongoose.model('UserActivity', userActivitySchema)