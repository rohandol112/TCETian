import Forum from '../models/Forum.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import { validationResult } from 'express-validator'
import socketService from '../services/socketService.js'

// Get all forums with filtering
export const getForums = async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1, sortBy = 'members' } = req.query
    
    let query = {}
    
    // Add category filter
    if (category && category !== 'all') {
      query.category = category
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    // Only show public forums or forums user is member of
    if (req.user) {
      query.$or = [
        { 'settings.isPublic': true },
        { 'members.user': req.user._id }
      ]
    } else {
      query['settings.isPublic'] = true
    }
    
    // Sort options
    let sortOptions = {}
    switch (sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 }
        break
      case 'active':
        sortOptions = { 'stats.dailyActiveUsers': -1, updatedAt: -1 }
        break
      case 'posts':
        sortOptions = { 'stats.postCount': -1 }
        break
      default: // members
        sortOptions = { 'stats.memberCount': -1, createdAt: -1 }
    }
    
    const skip = (page - 1) * limit
    
    const forums = await Forum.find(query)
      .populate('creator', 'name profilePicture role')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .lean()
    
    const totalForums = await Forum.countDocuments(query)
    
    // Add user membership status
    if (req.user) {
      forums.forEach(forum => {
        const membership = forum.members?.find(m => m.user?.toString() === req.user._id.toString())
        forum.userMembership = membership ? {
          isMember: true,
          role: membership.role,
          joinedAt: membership.joinedAt
        } : { isMember: false }
      })
    }
    
    res.json({
      success: true,
      data: {
        forums,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalForums / limit),
          totalForums,
          hasNext: skip + forums.length < totalForums,
          hasPrev: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching forums:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forums',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Get single forum with details
export const getForum = async (req, res) => {
  try {
    const { forumName } = req.params
    
    const forum = await Forum.findOne({ name: forumName })
      .populate('creator', 'name profilePicture role')
      .populate('moderators', 'name profilePicture role')
      .lean()
    
    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      })
    }
    
    // Check if user has access to private forum
    if (!forum.settings.isPublic && req.user) {
      const isMember = forum.members.some(m => m.user.toString() === req.user._id.toString())
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private forum'
        })
      }
    }
    
    // Get recent posts from this forum
    const recentPosts = await Post.find({ forum: forum._id })
      .populate('author', 'name profilePicture role')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    
    // Add user membership status
    if (req.user) {
      const membership = forum.members?.find(m => m.user?.toString() === req.user._id.toString())
      forum.userMembership = membership ? {
        isMember: true,
        role: membership.role,
        joinedAt: membership.joinedAt
      } : { isMember: false }
    }
    
    res.json({
      success: true,
      data: {
        forum,
        recentPosts
      }
    })
    
  } catch (error) {
    console.error('Error fetching forum:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Create new forum
export const createForum = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }
    
    const {
      name,
      displayName,
      description,
      category,
      tags,
      rules,
      settings
    } = req.body
    
    // Check if forum name already exists
    const existingForum = await Forum.findOne({ 
      name: name.toLowerCase().replace(/\s+/g, '-') 
    })
    
    if (existingForum) {
      return res.status(400).json({
        success: false,
        message: 'Forum name already exists'
      })
    }
    
    const forum = new Forum({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      displayName,
      description,
      category,
      tags: tags || [],
      creator: req.user._id,
      moderators: [req.user._id],
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }],
      rules: rules || [],
      settings: {
        isPublic: settings?.isPublic !== false,
        allowPosts: settings?.allowPosts !== false,
        requireApproval: settings?.requireApproval === true,
        allowImages: settings?.allowImages !== false,
        allowPolls: settings?.allowPolls !== false
      }
    })
    
    await forum.save()
    
    // Populate creator info
    await forum.populate('creator', 'name profilePicture role')
    
    // Emit real-time update
    socketService.emitToAll('forumCreated', {
      forum: forum.toObject()
    })
    
    res.status(201).json({
      success: true,
      message: 'Forum created successfully',
      data: { forum }
    })
    
  } catch (error) {
    console.error('Error creating forum:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create forum',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Join forum
export const joinForum = async (req, res) => {
  try {
    const { forumName } = req.params
    
    const forum = await Forum.findOne({ name: forumName })
    
    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      })
    }
    
    // Check if already a member
    const existingMember = forum.members.find(m => 
      m.user.toString() === req.user._id.toString()
    )
    
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this forum'
      })
    }
    
    // Add user as member
    forum.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date()
    })
    
    await forum.save()
    
    // Emit real-time update
    socketService.emitToRoom(`forum_${forum._id}`, 'memberJoined', {
      forumId: forum._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        profilePicture: req.user.profilePicture
      }
    })
    
    res.json({
      success: true,
      message: 'Successfully joined forum'
    })
    
  } catch (error) {
    console.error('Error joining forum:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to join forum',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Leave forum
export const leaveForum = async (req, res) => {
  try {
    const { forumName } = req.params
    
    const forum = await Forum.findOne({ name: forumName })
    
    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      })
    }
    
    // Check if user is creator (cannot leave own forum)
    if (forum.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Forum creator cannot leave their own forum'
      })
    }
    
    // Remove user from members
    forum.members = forum.members.filter(m => 
      m.user.toString() !== req.user._id.toString()
    )
    
    // Remove from moderators if applicable
    forum.moderators = forum.moderators.filter(m => 
      m.toString() !== req.user._id.toString()
    )
    
    await forum.save()
    
    // Emit real-time update
    socketService.emitToRoom(`forum_${forum._id}`, 'memberLeft', {
      forumId: forum._id,
      userId: req.user._id
    })
    
    res.json({
      success: true,
      message: 'Successfully left forum'
    })
    
  } catch (error) {
    console.error('Error leaving forum:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to leave forum',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Get forum categories
export const getForumCategories = async (req, res) => {
  try {
    const categories = await Forum.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalMembers: { $sum: '$stats.memberCount' },
          totalPosts: { $sum: '$stats.postCount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
    
    res.json({
      success: true,
      data: { categories }
    })
    
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}