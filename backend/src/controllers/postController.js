import Post from '../models/Post.js'
import Comment from '../models/Comment.js'
import User from '../models/User.js'
import UserActivity from '../models/UserActivity.js'
import socketService from '../services/socketService.js'

// @desc    Get all posts with filtering, sorting, and pagination
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'hot', // hot, new, top, controversial
      category,
      search,
      year,
      branch,
      author
    } = req.query

    // Build filter object
    const filter = { isHidden: false }
    
    if (category && category !== 'all') {
      filter.category = category
    }
    
    if (year && year !== 'All') {
      filter.$or = [
        { targetYear: year },
        { targetYear: 'All' }
      ]
    }
    
    if (branch && branch !== 'All') {
      filter.$or = [
        ...(filter.$or || []),
        { targetBranch: branch },
        { targetBranch: 'All' }
      ]
    }
    
    if (author) {
      filter.author = author
    }
    
    if (search) {
      filter.$text = { $search: search }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    // Build aggregation pipeline for sorting
    let pipeline = [
      { $match: filter },
      {
        $addFields: {
          voteCount: { $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
          commentCount: { $size: "$comments" },
          ageInHours: {
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              3600000 // Convert milliseconds to hours
            ]
          }
        }
      }
    ]

    // Add sorting based on algorithm
    switch (sort) {
      case 'hot':
        pipeline.push({
          $addFields: {
            hotScore: {
              $divide: [
                { $add: ["$voteCount", { $multiply: ["$commentCount", 0.5] }] },
                { $pow: [{ $add: ["$ageInHours", 2] }, 1.8] }
              ]
            }
          }
        })
        pipeline.push({ $sort: { hotScore: -1 } })
        break
      case 'new':
        pipeline.push({ $sort: { createdAt: -1 } })
        break
      case 'top':
        pipeline.push({ $sort: { voteCount: -1, createdAt: -1 } })
        break
      case 'controversial':
        pipeline.push({
          $addFields: {
            controversyScore: {
              $cond: {
                if: { $eq: ["$voteCount", 0] },
                then: 0,
                else: {
                  $divide: [
                    { $add: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
                    { $abs: "$voteCount" }
                  ]
                }
              }
            }
          }
        })
        pipeline.push({ $sort: { controversyScore: -1, createdAt: -1 } })
        break
      default:
        pipeline.push({ $sort: { createdAt: -1 } })
    }

    // Add pagination
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit) })

    // Populate author information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    })
    pipeline.push({ $unwind: '$author' })

    // Remove sensitive author information but keep vote user IDs for userVote calculation
    pipeline.push({
      $project: {
        'author.password': 0,
        'author.email': 0
      }
    })

    const posts = await Post.aggregate(pipeline)
    
    // Add userVote field for authenticated users
    if (req.user) {
      posts.forEach(post => {
        const userUpvoted = post.upvotes.some(vote => vote.user?.toString() === req.user.id)
        const userDownvoted = post.downvotes.some(vote => vote.user?.toString() === req.user.id)
        
        if (userUpvoted) {
          post.userVote = 'up'
        } else if (userDownvoted) {
          post.userVote = 'down'
        } else {
          post.userVote = null
        }
      })
    }
    
    // Get total count for pagination
    const total = await Post.countDocuments(filter)
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit))
    const hasNextPage = parseInt(page) < totalPages
    const hasPrevPage = parseInt(page) > 1

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts'
    })
  }
}

// @desc    Get single post with comments
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name studentId year branch profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name studentId year branch profilePicture'
        },
        options: { sort: { createdAt: -1 } }
      })

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Add userVote field for authenticated users
    if (req.user) {
      const userUpvoted = post.upvotes.some(vote => vote.user?.toString() === req.user.id)
      const userDownvoted = post.downvotes.some(vote => vote.user?.toString() === req.user.id)
      
      if (userUpvoted) {
        post.userVote = 'up'
      } else if (userDownvoted) {
        post.userVote = 'down'
      } else {
        post.userVote = null
      }
    }

    // Increment view count
    post.viewCount += 1
    await post.save()

    res.json({
      success: true,
      data: { post }
    })
  } catch (error) {
    console.error('Get post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching post'
    })
  }
}

// @desc    Create new post
// @route   POST /api/posts
// @access  Private (Students only)
export const createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      author: req.user.id
    }

    // Handle file upload
    if (req.file) {
      postData.image = `/uploads/${req.file.filename}`
    }

    // Process tags (FormData sends as string, need to parse JSON if it's JSON string)
    if (postData.tags) {
      try {
        // Try to parse as JSON first (from FormData)
        postData.tags = JSON.parse(postData.tags)
      } catch {
        // If not JSON, treat as comma-separated string
        if (typeof postData.tags === 'string') {
          postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      }
    }

    const post = await Post.create(postData)
    
    // Populate author info
    await post.populate('author', 'name studentId year branch profilePicture')

    // Log user activity
    await UserActivity.logActivity(req.user.id, 'post_created', post._id, 'Post', {
      title: post.title,
      category: post.category,
      postType: post.postType
    }, req)

    // Emit real-time event for new post with user notification
    socketService.emitNewPost(post)
    socketService.emitUserPostInteraction(req.user.id, post._id, 'created', { title: post.title })

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error creating post'
    })
  }
}

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Author only)
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      })
    }

    // Process tags
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name studentId year branch profilePicture')

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post: updatedPost }
    })
  } catch (error) {
    console.error('Update post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error updating post'
    })
  }
}

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Author only)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      })
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: req.params.id })
    
    // Delete the post
    await Post.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error deleting post'
    })
  }
}

// @desc    Vote on post
// @route   POST /api/posts/:id/vote
// @access  Private (Students only)
export const votePost = async (req, res) => {
  try {
    const { voteType } = req.body // 'up', 'down', or 'remove'
    
    const post = await Post.findById(req.params.id)
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Prevent users from voting on their own posts
    if (post.author.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on your own post'
      })
    }

    switch (voteType) {
      case 'up':
        post.upvote(req.user.id)
        break
      case 'down':
        post.downvote(req.user.id)
        break
      case 'remove':
        post.removeVote(req.user.id)
        break
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid vote type'
        })
    }

    await post.save()

    // Log user activity
    if (voteType !== 'remove') {
      await UserActivity.logActivity(req.user.id, `post_${voteType}voted`, post._id, 'Post', {
        title: post.title,
        voteCount: post.voteCount
      }, req)
    }

    // Emit real-time vote update with user interaction
    socketService.emitPostUpdate(post._id, {
      voteCount: post.voteCount,
      upvotes: post.upvotes,
      downvotes: post.downvotes
    })
    
    socketService.emitUserPostInteraction(req.user.id, post._id, `${voteType}vote`, {
      voteCount: post.voteCount
    })

    // Determine user's vote status
    let userVote = null
    if (post.upvotes.some(vote => 
      (vote.user || vote).toString() === req.user.id.toString()
    )) {
      userVote = 'up'
    } else if (post.downvotes.some(vote => 
      (vote.user || vote).toString() === req.user.id.toString()
    )) {
      userVote = 'down'
    }

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        voteCount: post.voteCount,
        hasUpvoted: post.hasUpvoted(req.user.id),
        hasDownvoted: post.hasDownvoted(req.user.id),
        userVote
      }
    })
  } catch (error) {
    console.error('Vote post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error processing vote'
    })
  }
}

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
export const getTrendingPosts = async (req, res) => {
  try {
    const { limit = 5 } = req.query
    
    // Get posts from last 24 hours with high engagement
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const trendingPosts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: oneDayAgo },
          isHidden: false
        }
      },
      {
        $addFields: {
          voteCount: { $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
          commentCount: { $size: "$comments" },
          engagementScore: {
            $add: [
              { $multiply: [{ $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] }, 2] },
              { $size: "$comments" },
              { $divide: ["$viewCount", 10] }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $project: {
          'author.password': 0,
          'author.email': 0,
          'upvotes.user': 0,
          'downvotes.user': 0
        }
      }
    ])

    res.json({
      success: true,
      data: { posts: trendingPosts }
    })
  } catch (error) {
    console.error('Get trending posts error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching trending posts'
    })
  }
}

// @desc    Save/bookmark post
// @route   POST /api/posts/:id/save
// @access  Private (Students only)
export const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Check if post is already saved
    if (user.savedPosts.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Post already saved'
      })
    }

    // Add post to saved posts
    user.savedPosts.push(req.params.id)
    await user.save()

    res.json({
      success: true,
      message: 'Post saved successfully'
    })
  } catch (error) {
    console.error('Save post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error saving post'
    })
  }
}

// @desc    Unsave/unbookmark post
// @route   DELETE /api/posts/:id/save
// @access  Private (Students only)
export const unsavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    // Remove post from saved posts
    user.savedPosts = user.savedPosts.filter(
      postId => postId.toString() !== req.params.id
    )
    await user.save()

    res.json({
      success: true,
      message: 'Post unsaved successfully'
    })
  } catch (error) {
    console.error('Unsave post error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error unsaving post'
    })
  }
}

