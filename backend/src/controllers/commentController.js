import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import UserActivity from '../models/UserActivity.js'
import socketService from '../services/socketService.js'

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params
    const { sort = 'best', limit = 20, page = 1 } = req.query

    // Check if post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Build sort criteria
    let sortCriteria = {}
    switch (sort) {
      case 'best':
        // Sort by vote count then by creation time
        sortCriteria = { voteCount: -1, createdAt: -1 }
        break
      case 'new':
        sortCriteria = { createdAt: -1 }
        break
      case 'old':
        sortCriteria = { createdAt: 1 }
        break
      case 'controversial':
        // Will need aggregation for this
        break
      default:
        sortCriteria = { createdAt: -1 }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    let comments
    if (sort === 'controversial') {
      // Use aggregation for controversial sorting
      comments = await Comment.aggregate([
        {
          $match: {
            post: post._id,
            parentComment: null, // Only top-level comments
            isDeleted: false
          }
        },
        {
          $addFields: {
            voteCount: { $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
            controversyScore: {
              $cond: {
                if: { $eq: [{ $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] }, 0] },
                then: 0,
                else: {
                  $divide: [
                    { $add: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
                    { $abs: { $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] } }
                  ]
                }
              }
            }
          }
        },
        { $sort: { controversyScore: -1, createdAt: -1 } },
        { $skip: skip },
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
          $lookup: {
            from: 'comments',
            localField: 'replies',
            foreignField: '_id',
            as: 'replies'
          }
        }
      ])
    } else {
      comments = await Comment.find({
        post: postId,
        parentComment: null, // Only top-level comments
        isDeleted: false
      })
        .populate('author', 'name studentId year branch profilePicture')
        .populate({
          path: 'replies',
          populate: {
            path: 'author',
            select: 'name studentId year branch profilePicture'
          },
          options: { sort: { createdAt: 1 } }
        })
        .sort(sortCriteria)
        .skip(skip)
        .limit(parseInt(limit))
    }

    const totalComments = await Comment.countDocuments({
      post: postId,
      parentComment: null,
      isDeleted: false
    })

    // Add userVote field if user is authenticated
    if (req.user) {
      comments = comments.map(comment => {
        const commentObj = comment.toObject ? comment.toObject() : comment
        
        // Determine user's vote on this comment
        let userVote = null
        if (commentObj.upvotes && commentObj.upvotes.some(vote => 
          (vote.user || vote).toString() === req.user.id.toString()
        )) {
          userVote = 'up'
        } else if (commentObj.downvotes && commentObj.downvotes.some(vote => 
          (vote.user || vote).toString() === req.user.id.toString()
        )) {
          userVote = 'down'
        }
        
        // Add userVote to replies as well
        if (commentObj.replies) {
          commentObj.replies = commentObj.replies.map(reply => {
            let replyUserVote = null
            if (reply.upvotes && reply.upvotes.some(vote => 
              (vote.user || vote).toString() === req.user.id.toString()
            )) {
              replyUserVote = 'up'
            } else if (reply.downvotes && reply.downvotes.some(vote => 
              (vote.user || vote).toString() === req.user.id.toString()
            )) {
              replyUserVote = 'down'
            }
            return {
              ...reply,
              userVote: replyUserVote
            }
          })
        }
        
        return {
          ...commentObj,
          userVote
        }
      })
    }

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / parseInt(limit)),
          total: totalComments,
          limit: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching comments'
    })
  }
}

// @desc    Create new comment
// @route   POST /api/comments
// @access  Private (Students only)
export const createComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body

    // Check if post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    // Check if post is locked
    if (post.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'This post is locked and no longer accepts comments'
      })
    }

    let depth = 0
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId)
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        })
      }
      depth = parentComment.depth + 1
      
      // Limit nesting depth
      if (depth > 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum comment nesting depth reached'
        })
      }
    }

    const comment = await Comment.create({
      content,
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null,
      depth
    })

    // Add comment to post's comments array
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id }
    })

    // Add reply to parent comment if it's a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id }
      })
    }

    // Populate author info
    await comment.populate('author', 'name studentId year branch profilePicture')

    // Add userVote field for the author (new comment has no votes initially)
    const commentWithUserVote = {
      ...comment.toObject(),
      userVote: null
    }

    // Log user activity
    await UserActivity.logActivity(req.user.id, 'comment_created', comment._id, 'Comment', {
      postId: postId,
      content: comment.content.substring(0, 100), // First 100 chars
      isReply: !!parentCommentId,
      depth: depth
    }, req)

    // Emit real-time event for new comment with user interaction
    socketService.emitNewComment(postId, commentWithUserVote)
    socketService.emitUserPostInteraction(req.user.id, postId, 'commented', {
      commentId: comment._id,
      isReply: !!parentCommentId
    })

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment: commentWithUserVote }
    })
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error creating comment'
    })
  }
}

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (Author only)
export const updateComment = async (req, res) => {
  try {
    const { content } = req.body
    
    const comment = await Comment.findById(req.params.id)
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      })
    }

    // Check if comment is deleted
    if (comment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit deleted comment'
      })
    }

    comment.content = content
    comment.isEdited = true
    comment.editedAt = new Date()
    await comment.save()

    await comment.populate('author', 'name studentId year branch profilePicture')

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    })
  } catch (error) {
    console.error('Update comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error updating comment'
    })
  }
}

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Author only)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      })
    }

    // Soft delete - mark as deleted but keep the structure
    comment.isDeleted = true
    comment.content = '[deleted]'
    await comment.save()

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error deleting comment'
    })
  }
}

// @desc    Vote on comment
// @route   POST /api/comments/:id/vote
// @access  Private (Students only)
export const voteComment = async (req, res) => {
  try {
    const { voteType } = req.body // 'up', 'down', or 'remove'
    
    const comment = await Comment.findById(req.params.id)
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Prevent users from voting on their own comments
    if (comment.author.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on your own comment'
      })
    }

    // Check if comment is deleted
    if (comment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on deleted comment'
      })
    }

    switch (voteType) {
      case 'up':
        comment.upvote(req.user.id)
        break
      case 'down':
        comment.downvote(req.user.id)
        break
      case 'remove':
        comment.removeVote(req.user.id)
        break
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid vote type'
        })
    }

    await comment.save()

    // Log user activity
    if (voteType !== 'remove') {
      await UserActivity.logActivity(req.user.id, `comment_${voteType}voted`, comment._id, 'Comment', {
        postId: comment.post,
        voteCount: comment.voteCount
      }, req)
    }

    // Emit real-time comment vote update with user interaction
    socketService.emitCommentUpdate(comment.post, comment._id, {
      voteCount: comment.voteCount,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes
    })
    
    socketService.emitUserPostInteraction(req.user.id, comment.post, `comment_${voteType}vote`, {
      commentId: comment._id,
      voteCount: comment.voteCount
    })

    // Determine user's vote status
    let userVote = null
    if (comment.upvotes.some(vote => 
      (vote.user || vote).toString() === req.user.id.toString()
    )) {
      userVote = 'up'
    } else if (comment.downvotes.some(vote => 
      (vote.user || vote).toString() === req.user.id.toString()
    )) {
      userVote = 'down'
    }

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        voteCount: comment.voteCount,
        hasUpvoted: comment.hasUpvoted(req.user.id),
        hasDownvoted: comment.hasDownvoted(req.user.id),
        userVote
      }
    })
  } catch (error) {
    console.error('Vote comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error processing vote'
    })
  }
}

