import Post from '../models/Post.js'
import Comment from '../models/Comment.js'
import User from '../models/User.js'
import UserActivity from '../models/UserActivity.js'
import socketService from '../services/socketService.js'

// @desc    Get all posts with advanced filtering, sorting, and cursor-based pagination
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20, // Increased default limit for better UX
      sort = 'hot', // hot, new, top, controversial, rising
      category,
      search,
      year,
      branch,
      author,
      cursor, // For cursor-based pagination
      timeframe = 'all' // all, hour, day, week, month
    } = req.query

    // Enhanced filter building with optimization
    const filter = { isHidden: false }
    
    // Add pinned posts priority (they appear first)
    const pinnedFilter = { ...filter, isPinned: true }
    const regularFilter = { ...filter, isPinned: { $ne: true } }
    
    if (category && category !== 'all') {
      filter.category = category
    }
    
    // Optimized year/branch filtering
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
      filter.author = new mongoose.Types.ObjectId(author)
    }
    
    // Enhanced search with better text scoring
    if (search) {
      filter.$text = { 
        $search: search,
        $caseSensitive: false,
        $diacriticSensitive: false
      }
    }

    // Timeframe filtering for trending/top posts
    if (timeframe !== 'all') {
      const timeMap = {
        hour: 1,
        day: 24,
        week: 24 * 7,
        month: 24 * 30
      }
      const hoursBack = timeMap[timeframe] || 24
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
      filter.createdAt = { $gte: cutoffTime }
    }

    // Calculate pagination - support both offset and cursor
    const pageSize = Math.min(parseInt(limit), 50) // Max 50 posts per page
    const skip = cursor ? 0 : (parseInt(page) - 1) * pageSize
    
    // Enhanced aggregation pipeline with performance optimizations
    let pipeline = [
      { $match: filter }
    ]

    // Add cursor-based pagination if cursor is provided
    if (cursor) {
      try {
        const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString())
        if (cursorData.timestamp) {
          pipeline.push({
            $match: {
              $or: [
                { createdAt: { $lt: new Date(cursorData.timestamp) } },
                { 
                  createdAt: new Date(cursorData.timestamp),
                  _id: { $lt: new mongoose.Types.ObjectId(cursorData.id) }
                }
              ]
            }
          })
        }
      } catch (error) {
        console.warn('Invalid cursor provided:', cursor)
      }
    }

    // Pre-compute fields for sorting and filtering
    pipeline.push({
      $addFields: {
        voteCount: { $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
        commentCount: { $size: "$comments" },
        upvoteCount: { $size: "$upvotes" },
        downvoteCount: { $size: "$downvotes" },
        totalVotes: { $add: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
        ageInHours: {
          $divide: [
            { $subtract: [new Date(), "$createdAt"] },
            3600000
          ]
        },
        ageInMinutes: {
          $divide: [
            { $subtract: [new Date(), "$createdAt"] },
            60000
          ]
        }
      }
    })

    // Enhanced sorting algorithms
    switch (sort) {
      case 'hot':
        pipeline.push({
          $addFields: {
            hotScore: {
              $cond: {
                if: { $eq: ["$ageInHours", 0] },
                then: "$voteCount",
                else: {
                  $divide: [
                    { 
                      $add: [
                        { $multiply: ["$voteCount", 2] }, // Weight votes more
                        { $multiply: ["$commentCount", 0.8] }, // Comments boost
                        { $divide: ["$viewCount", 20] } // Views slight boost
                      ]
                    },
                    { $pow: [{ $add: ["$ageInHours", 2] }, 1.5] } // Less aggressive time decay
                  ]
                }
              }
            }
          }
        })
        pipeline.push({ $sort: { isPinned: -1, hotScore: -1, createdAt: -1 } })
        break
        
      case 'rising':
        // New algorithm for rising posts (recent posts gaining traction)
        pipeline.push({
          $addFields: {
            risingScore: {
              $cond: {
                if: { $lt: ["$ageInHours", 24] },
                then: {
                  $divide: [
                    { $add: ["$voteCount", { $multiply: ["$commentCount", 0.5] }] },
                    { $add: ["$ageInHours", 1] }
                  ]
                },
                else: 0
              }
            }
          }
        })
        pipeline.push({ $sort: { isPinned: -1, risingScore: -1, createdAt: -1 } })
        break
        
      case 'new':
        pipeline.push({ $sort: { isPinned: -1, createdAt: -1 } })
        break
        
      case 'top':
        pipeline.push({ $sort: { isPinned: -1, voteCount: -1, createdAt: -1 } })
        break
        
      case 'controversial':
        pipeline.push({
          $addFields: {
            controversyScore: {
              $cond: {
                if: { $and: [{ $gt: ["$totalVotes", 5] }, { $ne: ["$voteCount", 0] }] },
                then: {
                  $divide: [
                    "$totalVotes",
                    { $add: [{ $abs: "$voteCount" }, 1] }
                  ]
                },
                else: 0
              }
            }
          }
        })
        pipeline.push({ $sort: { isPinned: -1, controversyScore: -1, totalVotes: -1 } })
        break
        
      case 'discussed':
        // Most commented posts
        pipeline.push({ $sort: { isPinned: -1, commentCount: -1, createdAt: -1 } })
        break
        
      default:
        pipeline.push({ $sort: { isPinned: -1, createdAt: -1 } })
    }

    // Pagination
    if (!cursor) {
      pipeline.push({ $skip: skip })
    }
    pipeline.push({ $limit: pageSize + 1 }) // Get one extra to check if there are more

    // Optimized author population
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author',
        pipeline: [
          {
            $project: {
              name: 1,
              studentId: 1,
              year: 1,
              branch: 1,
              profilePicture: 1,
              role: 1,
              _id: 1
            }
          }
        ]
      }
    })
    pipeline.push({ $unwind: '$author' })

    // Add text search score if searching
    if (search) {
      pipeline.push({
        $addFields: {
          searchScore: { $meta: "textScore" }
        }
      })
    }

    // Execute aggregation
    const posts = await Post.aggregate(pipeline).allowDiskUse(true) // Allow disk use for large datasets
    
    // Check if there are more posts
    const hasMore = posts.length > pageSize
    if (hasMore) {
      posts.pop() // Remove the extra post
    }

    // Generate next cursor for cursor-based pagination
    let nextCursor = null
    if (hasMore && posts.length > 0) {
      const lastPost = posts[posts.length - 1]
      const cursorData = {
        timestamp: lastPost.createdAt,
        id: lastPost._id
      }
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')
    }
    
    // Add userVote and isSaved fields for authenticated users (batch operation)
    if (req.user && posts.length > 0) {
      const userId = req.user.id
      
      // Get user's saved posts for saved status check
      const user = await User.findById(userId).select('savedPosts')
      const savedPostIds = user?.savedPosts || []
      
      posts.forEach(post => {
        const userUpvoted = post.upvotes.some(vote => 
          vote.user?.toString() === userId || vote.toString() === userId
        )
        const userDownvoted = post.downvotes.some(vote => 
          vote.user?.toString() === userId || vote.toString() === userId
        )
        
        post.userVote = userUpvoted ? 'up' : (userDownvoted ? 'down' : null)
        post.isSaved = savedPostIds.some(savedId => savedId.toString() === post._id.toString())
      })
    }
    
    // Efficient total count (only for first page or when specifically requested)
    let total = null
    if (!cursor && page == 1) {
      // Use estimatedDocumentCount for better performance on large datasets
      if (Object.keys(filter).length === 1 && filter.isHidden === false) {
        total = await Post.estimatedDocumentCount()
      } else {
        // Use a separate aggregation for count with similar filters but no expensive operations
        const countPipeline = [
          { $match: filter },
          { $count: "total" }
        ]
        const countResult = await Post.aggregate(countPipeline)
        total = countResult.length > 0 ? countResult[0].total : 0
      }
    }
    
    // Calculate pagination info
    const currentPage = parseInt(page)
    const totalPages = total ? Math.ceil(total / pageSize) : null
    const hasNextPage = cursor ? hasMore : (total ? currentPage < totalPages : hasMore)
    const hasPrevPage = currentPage > 1

    // Response with enhanced metadata
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage,
          totalPages,
          total,
          hasNextPage,
          hasPrevPage,
          limit: pageSize,
          nextCursor,
          sort,
          category,
          timeframe
        },
        meta: {
          algorithm: sort,
          cached: false, // Will be true if implementing Redis cache
          responseTime: Date.now() - req.startTime,
          postCount: posts.length
        }
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

