import express from 'express'
import { authenticate } from '../middleware/auth.js'
import UserActivity from '../models/UserActivity.js'
import socketService from '../services/socketService.js'

const router = express.Router()

// @desc    Get current user's activity summary
// @route   GET /api/analytics/activity
// @access  Private
router.get('/activity', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query
    
    const activitySummary = await UserActivity.getUserActivitySummary(req.user.id, parseInt(days))
    
    // Get current online status
    const isOnline = socketService.isUserOnline(req.user.id)
    const lastActivity = socketService.getUserLastActivity(req.user.id)
    const currentRooms = socketService.getUserRooms(req.user.id)

    res.json({
      success: true,
      data: {
        activitySummary,
        onlineStatus: {
          isOnline,
          lastActivity,
          currentRooms,
          joinedRoomsCount: currentRooms.length
        },
        periodDays: parseInt(days)
      }
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching activity data'
    })
  }
})

// @desc    Get user's detailed activity log
// @route   GET /api/analytics/activity/detailed
// @access  Private
router.get('/activity/detailed', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      activityType, 
      days = 7 
    } = req.query

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    const query = {
      user: req.user.id,
      createdAt: { $gte: startDate }
    }

    if (activityType) {
      query.activityType = activityType
    }

    const activities = await UserActivity.find(query)
      .populate('targetId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const totalActivities = await UserActivity.countDocuments(query)

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalActivities / parseInt(limit)),
          total: totalActivities,
          limit: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching detailed activity:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching detailed activity'
    })
  }
})

// @desc    Get online users statistics (Admin only for now, can be expanded)
// @route   GET /api/analytics/online-stats
// @access  Private
router.get('/online-stats', authenticate, async (req, res) => {
  try {
    const onlineStats = socketService.getOnlineStats()
    const connectedUsers = socketService.getConnectedUsers()

    res.json({
      success: true,
      data: {
        ...onlineStats,
        connectedUserIds: connectedUsers
      }
    })
  } catch (error) {
    console.error('Error fetching online stats:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching online statistics'
    })
  }
})

// @desc    Get users in a specific room (for post discussions)
// @route   GET /api/analytics/room/:roomName/users
// @access  Private
router.get('/room/:roomName/users', authenticate, async (req, res) => {
  try {
    const { roomName } = req.params
    const usersInRoom = socketService.getUsersInRoom(roomName)

    res.json({
      success: true,
      data: {
        roomName,
        userCount: usersInRoom.length,
        userIds: usersInRoom
      }
    })
  } catch (error) {
    console.error('Error fetching room users:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching room users'
    })
  }
})

// @desc    Get comprehensive user analytics
// @route   GET /api/analytics/user-analytics
// @access  Private
router.get('/user-analytics', authenticate, async (req, res) => {
  try {
    const { timeframe = 'week', userId } = req.query
    const targetUserId = userId || req.user.id

    // Calculate date range
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Import models at the top if not already imported
    const Post = (await import('../models/Post.js')).default
    const Comment = (await import('../models/Comment.js')).default

    // Get user's posts and comments for the period
    const [posts, comments, savedPosts] = await Promise.all([
      Post.find({
        author: targetUserId,
        createdAt: { $gte: startDate }
      }).populate('author', 'name').sort({ createdAt: -1 }),
      
      Comment.find({
        author: targetUserId,
        createdAt: { $gte: startDate }
      }).populate('author', 'name').sort({ createdAt: -1 }),

      Post.find({
        savedBy: targetUserId,
        createdAt: { $gte: startDate }
      }).populate('author', 'name').sort({ createdAt: -1 })
    ])

    // Calculate summary statistics
    const totalPosts = posts.length
    const totalComments = comments.length
    const totalVotesReceived = posts.reduce((sum, post) => sum + (post.upvotes - post.downvotes), 0)
    const totalUpvotes = posts.reduce((sum, post) => sum + post.upvotes, 0)
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0)

    // Get previous period for comparison
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - days)
    
    const [prevPosts, prevComments] = await Promise.all([
      Post.find({
        author: targetUserId,
        createdAt: { $gte: prevStartDate, $lt: startDate }
      }),
      Comment.find({
        author: targetUserId,
        createdAt: { $gte: prevStartDate, $lt: startDate }
      })
    ])

    // Calculate changes
    const postsChange = prevPosts.length > 0 ? ((totalPosts - prevPosts.length) / prevPosts.length * 100).toFixed(1) : 0
    const commentsChange = prevComments.length > 0 ? ((totalComments - prevComments.length) / prevComments.length * 100).toFixed(1) : 0

    // Activity trend (daily breakdown)
    const activityTrend = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayPosts = posts.filter(p => p.createdAt >= dayStart && p.createdAt <= dayEnd).length
      const dayComments = comments.filter(c => c.createdAt >= dayStart && c.createdAt <= dayEnd).length

      activityTrend.push({
        date: dayStart.toISOString().split('T')[0],
        posts: dayPosts,
        comments: dayComments,
        total: dayPosts + dayComments
      })
    }

    // Top posts by engagement
    const topPosts = posts
      .map(post => ({
        ...post.toObject(),
        engagement: post.upvotes + post.commentCount + (post.views || 0) * 0.1
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)

    // Top comments by upvotes
    const topComments = comments
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, 5)

    const summary = {
      totalPosts,
      totalComments,
      totalVotesReceived,
      totalUpvotes,
      totalViews,
      postsChange: parseFloat(postsChange),
      commentsChange: parseFloat(commentsChange),
      votesChange: 0, // Could be calculated if needed
      viewsChange: 0,  // Could be calculated if needed
      avgUpvotesPerPost: totalPosts > 0 ? (totalUpvotes / totalPosts).toFixed(1) : 0,
      avgCommentsPerPost: totalPosts > 0 ? (posts.reduce((sum, p) => sum + p.commentCount, 0) / totalPosts).toFixed(1) : 0,
      engagementRate: totalPosts > 0 ? ((totalUpvotes + posts.reduce((sum, p) => sum + p.commentCount, 0)) / totalPosts).toFixed(1) : 0
    }

    res.json({
      success: true,
      data: {
        summary,
        activityTrend,
        topPosts,
        topComments,
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    })
  }
})

export default router