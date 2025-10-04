import User from '../models/User.js'
import Post from '../models/Post.js'
import Comment from '../models/Comment.js'
import UserActivity from '../models/UserActivity.js'
import socketService from '../services/socketService.js'
import bcrypt from 'bcryptjs'

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedPosts', 'title createdAt author category')
      .populate('eventsCreated', 'title startDate endDate')
      .select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Get user statistics
    const [postCount, commentCount, totalUpvotes] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Comment.countDocuments({ author: user._id }),
      Post.aggregate([
        { $match: { author: user._id } },
        { $project: { upvoteCount: { $size: '$upvotes' } } },
        { $group: { _id: null, total: { $sum: '$upvoteCount' } } }
      ])
    ])

    // Get club-specific statistics if user is a club
    let clubStats = {}
    if (user.role === 'club') {
      const Event = (await import('../models/Event.js')).default
      
      const [eventsCreated, totalRSVPs, upcomingEvents, followers] = await Promise.all([
        Event.countDocuments({ organizer: user._id }),
        Event.aggregate([
          { $match: { organizer: user._id } },
          { $group: { _id: null, total: { $sum: '$currentRSVP' } } }
        ]),
        Event.countDocuments({ 
          organizer: user._id,
          eventDate: { $gt: new Date() }
        }),
        User.countDocuments({ followingClubs: user._id }) // Assuming followers feature
      ])

      clubStats = {
        eventsCreated,
        totalRSVPs: totalRSVPs[0]?.total || 0,
        upcomingEvents,
        followers
      }
    }

    // Get recent activity summary
    const recentActivity = await UserActivity.getUserActivitySummary(user._id, 7)

    // Check online status
    const isOnline = socketService.isUserOnline(user._id)
    const lastActivity = socketService.getUserLastActivity(user._id)

    // Log profile view activity
    await UserActivity.logActivity(req.user.id, 'profile_viewed', user._id, 'User', {
      viewedOwnProfile: req.user.id === user._id.toString()
    }, req)

    res.json({
      success: true,
      data: {
        user,
        stats: {
          postCount,
          commentCount: commentCount || 0,
          totalUpvotes: totalUpvotes[0]?.total || 0,
          savedPostsCount: user.savedPosts?.length || 0,
          eventsCreatedCount: user.eventsCreated?.length || 0,
          ...clubStats
        },
        recentActivity,
        onlineStatus: {
          isOnline,
          lastActivity
        }
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      year, 
      branch, 
      courseType,
      clubName 
    } = req.body

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Store old values for activity logging
    const oldProfile = {
      name: user.name,
      description: user.description,
      year: user.year,
      branch: user.branch,
      courseType: user.courseType,
      clubName: user.clubName
    }

    // Update fields based on user role
    if (name) user.name = name
    if (description !== undefined) user.description = description

    if (user.role === 'student') {
      if (year) user.year = year
      if (branch) user.branch = branch
      if (courseType) user.courseType = courseType
    } else if (user.role === 'club') {
      if (clubName) user.clubName = clubName
    }

    await user.save()

    // Log profile update activity
    await UserActivity.logActivity(req.user.id, 'profile_updated', user._id, 'User', {
      updatedFields: Object.keys(req.body),
      oldValues: oldProfile
    }, req)

    // Emit real-time profile update to user's connections
    socketService.sendToUser(req.user.id, 'profile_updated', {
      user: user.toJSON(),
      timestamp: new Date()
    })

    // Notify users in the same rooms about profile changes (for display updates)
    const userRooms = socketService.getUserRooms(req.user.id)
    userRooms.forEach(roomName => {
      socketService.sendToRoom(roomName, 'user_profile_updated', {
        userId: req.user.id,
        updatedFields: ['name', 'year', 'branch'], // Only broadcast relevant fields
        user: {
          _id: user._id,
          name: user.name,
          year: user.year,
          branch: user.branch,
          role: user.role
        }
      }, req.user.id)
    })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toJSON() }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    })
  }
}

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const oldProfilePicture = user.profilePicture
    user.profilePicture = `/uploads/${req.file.filename}`
    await user.save()

    // Log profile picture update
    await UserActivity.logActivity(req.user.id, 'profile_updated', user._id, 'User', {
      updatedFields: ['profilePicture'],
      oldProfilePicture
    }, req)

    // Emit real-time profile picture update
    socketService.sendToUser(req.user.id, 'profile_picture_updated', {
      profilePicture: user.profilePicture,
      timestamp: new Date()
    })

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { 
        profilePicture: user.profilePicture,
        user: user.toJSON() 
      }
    })
  } catch (error) {
    console.error('Update profile picture error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error updating profile picture'
    })
  }
}

// @desc    Change password
// @route   PUT /api/users/profile/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      })
    }

    const user = await User.findById(req.user.id).select('+password')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Log password change activity
    await UserActivity.logActivity(req.user.id, 'profile_updated', user._id, 'User', {
      updatedFields: ['password'],
      passwordChanged: true
    }, req)

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    })
  }
}

// @desc    Get user by ID (public profile)
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('eventsCreated', 'title startDate endDate')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Get public statistics
    const [postCount, commentCount, totalUpvotes] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Comment.countDocuments({ author: user._id }),
      Post.aggregate([
        { $match: { author: user._id } },
        { $project: { upvoteCount: { $size: '$upvotes' } } },
        { $group: { _id: null, total: { $sum: '$upvoteCount' } } }
      ])
    ])

    // Get user's recent posts (public)
    const recentPosts = await Post.find({ author: user._id })
      .select('title category createdAt voteCount')
      .sort({ createdAt: -1 })
      .limit(5)

    // Check online status
    const isOnline = socketService.isUserOnline(user._id)

    // Log profile view activity (if logged in)
    if (req.user) {
      await UserActivity.logActivity(req.user.id, 'profile_viewed', user._id, 'User', {
        viewedOwnProfile: req.user.id === user._id.toString(),
        targetUserName: user.name
      }, req)
    }

    res.json({
      success: true,
      data: {
        user,
        stats: {
          postCount,
          commentCount: commentCount || 0,
          totalUpvotes: totalUpvotes[0]?.total || 0,
          eventsCreatedCount: user.eventsCreated?.length || 0
        },
        recentPosts,
        onlineStatus: {
          isOnline
        }
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    })
  }
}

// @desc    Get user's posts
// @route   GET /api/users/:id/posts
// @access  Public
export const getUserPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'recent' 
    } = req.query

    let sortCriteria = { createdAt: -1 }
    if (sort === 'popular') {
      sortCriteria = { voteCount: -1, createdAt: -1 }
    }

    const posts = await Post.find({ 
      author: req.params.id,
      isHidden: false 
    })
      .populate('author', 'name studentId year branch profilePicture role')
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const totalPosts = await Post.countDocuments({ 
      author: req.params.id,
      isHidden: false 
    })

    // Add userVote field if user is authenticated
    if (req.user) {
      posts.forEach(post => {
        const userUpvoted = post.upvotes.some(vote => 
          (vote.user || vote).toString() === req.user.id.toString()
        )
        const userDownvoted = post.downvotes.some(vote => 
          (vote.user || vote).toString() === req.user.id.toString()
        )
        
        if (userUpvoted) {
          post.userVote = 'up'
        } else if (userDownvoted) {
          post.userVote = 'down'
        } else {
          post.userVote = null
        }
      })
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          total: totalPosts,
          limit: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Get user posts error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching user posts'
    })
  }
}

// @desc    Save/unsave post
// @route   POST /api/users/posts/:postId/save
// @access  Private
export const toggleSavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const post = await Post.findById(req.params.postId)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    const isSaved = user.savedPosts.includes(req.params.postId)
    
    if (isSaved) {
      // Unsave post
      user.savedPosts = user.savedPosts.filter(
        postId => postId.toString() !== req.params.postId
      )
      await user.save()

      // Log unsave activity
      await UserActivity.logActivity(req.user.id, 'post_unsaved', post._id, 'Post', {
        postTitle: post.title
      }, req)

      res.json({
        success: true,
        message: 'Post unsaved successfully',
        data: { isSaved: false }
      })
    } else {
      // Save post
      user.savedPosts.push(req.params.postId)
      await user.save()

      // Log save activity
      await UserActivity.logActivity(req.user.id, 'post_saved', post._id, 'Post', {
        postTitle: post.title
      }, req)

      // Emit real-time notification to user
      socketService.sendToUser(req.user.id, 'post_saved', {
        postId: post._id,
        postTitle: post.title,
        timestamp: new Date()
      })

      res.json({
        success: true,
        message: 'Post saved successfully',
        data: { isSaved: true }
      })
    }
  } catch (error) {
    console.error('Toggle save post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error saving/unsaving post'
    })
  }
}

// @desc    Get user's saved posts
// @route   GET /api/users/profile/saved-posts
// @access  Private
export const getSavedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedPosts',
        populate: {
          path: 'author',
          select: 'name studentId year branch profilePicture role'
        },
        options: {
          sort: { createdAt: -1 },
          limit: parseInt(limit),
          skip: (parseInt(page) - 1) * parseInt(limit)
        }
      })

    const totalSavedPosts = user.savedPosts.length

    // Add userVote field for saved posts
    if (user.savedPosts) {
      user.savedPosts.forEach(post => {
        const userUpvoted = post.upvotes.some(vote => 
          (vote.user || vote).toString() === req.user.id.toString()
        )
        const userDownvoted = post.downvotes.some(vote => 
          (vote.user || vote).toString() === req.user.id.toString()
        )
        
        if (userUpvoted) {
          post.userVote = 'up'
        } else if (userDownvoted) {
          post.userVote = 'down'
        } else {
          post.userVote = null
        }
      })
    }

    res.json({
      success: true,
      data: {
        savedPosts: user.savedPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSavedPosts / parseInt(limit)),
          total: totalSavedPosts,
          limit: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Get saved posts error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching saved posts'
    })
  }
}