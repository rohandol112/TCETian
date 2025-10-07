import { useState, useEffect } from 'react'
import { FiHeart, FiMessageCircle, FiShare, FiMoreVertical, FiChevronUp, FiChevronDown, FiTrash2, FiEdit, FiFlag, FiSend } from 'react-icons/fi'
import { FaHeart } from 'react-icons/fa'
import { commentService } from '../../services/commentService.js'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'

const PostCard = ({ post, currentUser, onVote, onDelete, onSave, onShare, formatTimeAgo }) => {
  const [showActions, setShowActions] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isSaved, setIsSaved] = useState(post.isSaved || false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [replyingTo, setReplyingTo] = useState(null) // Track which comment we're replying to
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  
  const { joinPostRoom, leavePostRoom, onNewComment, onCommentUpdate, onTypingComment, sendTypingIndicator } = useSocket()
  const { showToast } = useToast()

  const isAuthor = currentUser?._id === post.author._id
  const userVote = post.userVote // This will come from backend based on current user

  // Update saved state when post prop changes (for real-time updates)
  useEffect(() => {
    setIsSaved(post.isSaved || false)
  }, [post.isSaved])

  const handleVoteClick = (voteType) => {
    // Map frontend vote types to backend expected values
    let backendVoteType
    if (userVote === voteType) {
      backendVoteType = 'remove' // Remove vote if clicking same vote
    } else {
      backendVoteType = voteType === 'upvote' ? 'up' : 'down'
    }
    
    onVote(post._id, backendVoteType)
  }

  const loadComments = async () => {
    if (!showComments || loadingComments) return
    
    setLoadingComments(true)
    try {
      const response = await commentService.getComments(post._id)
      
      if (response.success && response.data) {
        setComments(response.data.comments || [])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      showToast('Failed to load comments', 'error')
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser || submittingComment) return

    setSubmittingComment(true)
    try {
      const response = await commentService.createComment({
        postId: post._id,
        content: newComment.trim()
      })
      
      if (response.success) {
        // Add comment to local state immediately
        setComments(prev => [response.data, ...prev])
        setNewComment('')
        
        // Update post comment count optimistically
        if (post.commentCount !== undefined) {
          post.commentCount = (post.commentCount || 0) + 1
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      showToast('Failed to post comment', 'error')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !currentUser || submittingReply || !replyingTo) return

    setSubmittingReply(true)
    try {
      const response = await commentService.createComment({
        postId: post._id,
        content: replyText.trim(),
        parentCommentId: replyingTo._id
      })
      
      if (response.success) {
        // Add reply to the parent comment
        setComments(prev => prev.map(comment => {
          if (comment._id === replyingTo._id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data.comment]
            }
          }
          return comment
        }))
        
        setReplyText('')
        setReplyingTo(null)
        showToast('Reply posted successfully', 'success')
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
      showToast('Failed to post reply', 'error')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleCommentVote = async (commentId, voteType) => {
    if (!currentUser) return
    
    try {
      // Find comment or reply
      let currentComment = null
      let currentVote = null
      
      // Check top-level comments
      currentComment = comments.find(c => c._id === commentId)
      if (currentComment) {
        currentVote = currentComment.userVote
      } else {
        // Check replies
        for (const comment of comments) {
          if (comment.replies) {
            const reply = comment.replies.find(r => r._id === commentId)
            if (reply) {
              currentComment = reply
              currentVote = reply.userVote
              break
            }
          }
        }
      }
      
      let backendVoteType
      const targetVoteType = voteType === 'upvote' ? 'up' : 'down'
      
      if (currentVote === targetVoteType) {
        backendVoteType = 'remove' // Remove vote if clicking same vote
      } else {
        backendVoteType = targetVoteType
      }
      
      // Optimistic update for comment/reply votes
      setComments(prevComments => 
        prevComments.map(comment => {
          // Handle top-level comment votes
          if (comment._id === commentId) {
            let newVoteCount = comment.voteCount || 0
            let newUserVote = comment.userVote
            
            // Handle vote changes based on backend voteType
            if (backendVoteType === 'remove') {
              if (currentVote === 'up') newVoteCount--
              if (currentVote === 'down') newVoteCount++
              newUserVote = null
            } else if (backendVoteType === 'up') {
              if (currentVote === 'up') return comment // No change
              if (currentVote === 'down') newVoteCount += 2
              else newVoteCount++
              newUserVote = 'up'
            } else if (backendVoteType === 'down') {
              if (currentVote === 'down') return comment // No change
              if (currentVote === 'up') newVoteCount -= 2
              else newVoteCount--
              newUserVote = 'down'
            }
            
            return {
              ...comment,
              voteCount: newVoteCount,
              userVote: newUserVote
            }
          }
          
          // Handle reply votes
          if (comment.replies) {
            const hasReplyUpdate = comment.replies.some(reply => reply._id === commentId)
            if (hasReplyUpdate) {
              const updatedReplies = comment.replies.map(reply => {
                if (reply._id === commentId) {
                  let newVoteCount = reply.voteCount || 0
                  let newUserVote = reply.userVote
                  
                  if (backendVoteType === 'remove') {
                    if (currentVote === 'up') newVoteCount--
                    if (currentVote === 'down') newVoteCount++
                    newUserVote = null
                  } else if (backendVoteType === 'up') {
                    if (currentVote === 'up') return reply // No change
                    if (currentVote === 'down') newVoteCount += 2
                    else newVoteCount++
                    newUserVote = 'up'
                  } else if (backendVoteType === 'down') {
                    if (currentVote === 'down') return reply // No change
                    if (currentVote === 'up') newVoteCount -= 2
                    else newVoteCount--
                    newUserVote = 'down'
                  }
                  
                  return {
                    ...reply,
                    voteCount: newVoteCount,
                    userVote: newUserVote
                  }
                }
                return reply
              })
              
              return { ...comment, replies: updatedReplies }
            }
          }
          
          return comment
        })
      )

      await commentService.voteComment(commentId, backendVoteType)
    } catch (error) {
      console.error('Error voting on comment:', error)
      showToast('Failed to vote on comment', 'error')
      // Revert on error
      loadComments()
    }
  }

  // Load comments when showComments changes to true
  useEffect(() => {
    if (showComments) {
      loadComments()
      joinPostRoom(post._id)
    } else {
      leavePostRoom(post._id)
    }

    return () => {
      if (showComments) {
        leavePostRoom(post._id)
      }
    }
  }, [showComments, post._id, joinPostRoom, leavePostRoom])

  // WebSocket real-time comment listeners
  useEffect(() => {
    if (!showComments) return

    // Listen for new comments on this post
    const unsubscribeNewComment = onNewComment((newComment) => {
      if (newComment.post === post._id) {
        // If it's a reply (has parentComment), add to parent's replies
        if (newComment.parentComment) {
          setComments(prevComments => prevComments.map(comment => {
            if (comment._id === newComment.parentComment) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment]
              }
            }
            return comment
          }))
        } else {
          // It's a top-level comment
          setComments(prevComments => [newComment, ...prevComments])
        }
      }
    })

    // Listen for comment updates (votes)
    const unsubscribeCommentUpdate = onCommentUpdate(({ commentId, voteCount, upvotes, downvotes }) => {
      setComments(prevComments => 
        prevComments.map(comment => {
          // Check if it's a top-level comment
          if (comment._id === commentId) {
            // Preserve the userVote from optimistic update or calculate it
            let userVote = comment.userVote
            if (currentUser) {
              if (upvotes.includes(currentUser._id)) {
                userVote = 'up'
              } else if (downvotes.includes(currentUser._id)) {
                userVote = 'down'
              } else {
                userVote = null
              }
            }
            
            return { ...comment, voteCount, upvotes, downvotes, userVote }
          }
          
          // Check if it's a reply
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply._id === commentId) {
                let userVote = reply.userVote
                if (currentUser) {
                  if (upvotes.includes(currentUser._id)) {
                    userVote = 'up'
                  } else if (downvotes.includes(currentUser._id)) {
                    userVote = 'down'
                  } else {
                    userVote = null
                  }
                }
                return { ...reply, voteCount, upvotes, downvotes, userVote }
              }
              return reply
            })
            
            if (updatedReplies.some(reply => reply._id === commentId)) {
              return { ...comment, replies: updatedReplies }
            }
          }
          
          return comment
        })
      )
    })

    // Listen for typing indicators
    const unsubscribeTyping = onTypingComment(({ userId, userName, isTyping }) => {
      if (userId !== currentUser?._id) {
        setTypingUsers(prev => {
          if (isTyping) {
            return [...prev.filter(u => u.userId !== userId), { userId, userName }]
          } else {
            return prev.filter(u => u.userId !== userId)
          }
        })
      }
    })

    return () => {
      unsubscribeNewComment()
      unsubscribeCommentUpdate()
      unsubscribeTyping()
    }
  }, [showComments, post._id, currentUser?._id, onNewComment, onCommentUpdate, onTypingComment])

  const getCategoryColor = (category) => {
    const colors = {
      'Academic': 'bg-blue-500/20 text-blue-300',
      'Events': 'bg-purple-500/20 text-purple-300',
      'Study Group': 'bg-green-500/20 text-green-300',
      'General': 'bg-gray-500/20 text-gray-300',
      'Placement': 'bg-orange-500/20 text-orange-300',
      'Sports': 'bg-red-500/20 text-red-300',
      'Culture': 'bg-pink-500/20 text-pink-300',
      'Tech': 'bg-cyan-500/20 text-cyan-300'
    }
    return colors[category] || colors['General']
  }

  const formatContent = (content) => {
    // Simple formatting for line breaks and basic markdown-like syntax
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="glass card-hover rounded-xl p-6 transition-all duration-200">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {post.author.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold">{post.author.name}</h4>
              {post.author.year && post.author.branch && (
                <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                  {post.author.year} {post.author.branch}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(post.category)}`}>
            {post.category}
          </div>
          
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-10 min-w-[150px]">
                  {isAuthor ? (
                    <>
                      <button className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-white/10 transition-colors">
                        <FiEdit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          onDelete(post._id)
                          setShowActions(false)
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-white/10 transition-colors">
                        <FiFlag className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                      <button 
                        onClick={() => {
                          onShare && onShare(post)
                          setShowActions(false)
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-white/10 transition-colors"
                      >
                        <FiShare className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        <h3 className="text-lg font-semibold mb-3 text-white">
          {post.title}
        </h3>
      )}

      {/* Post Content */}
      <div className="text-gray-300 mb-4 leading-relaxed">
        {formatContent(post.content)}
      </div>

      {/* Post Image */}
      {post.image && (
        <div className="mb-4">
          <img 
            src={post.image} 
            alt="Post content" 
            className="w-full max-h-96 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Post Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span 
              key={index}
              className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center space-x-6">
          {/* Voting */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleVoteClick('upvote')}
              className={`p-2 rounded-full transition-colors ${
                userVote === 'up' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'hover:bg-white/10 text-gray-400'
              }`}
              disabled={!currentUser}
            >
              <FiChevronUp className="w-5 h-5" />
            </button>
            
            <span className={`font-semibold min-w-[2rem] text-center ${
              post.voteCount > 0 ? 'text-green-400' :
              post.voteCount < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {post.voteCount || 0}
            </span>
            
            <button
              onClick={() => handleVoteClick('downvote')}
              className={`p-2 rounded-full transition-colors ${
                userVote === 'down' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'hover:bg-white/10 text-gray-400'
              }`}
              disabled={!currentUser}
            >
              <FiChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Comments */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <FiMessageCircle className="w-5 h-5" />
            <span>{post.commentCount || 0}</span>
          </button>

          {/* Save/Like */}
          <button 
            onClick={async () => {
              if (currentUser && onSave) {
                try {
                  // Optimistic update
                  setIsSaved(!isSaved)
                  await onSave(post._id, isSaved)
                } catch (error) {
                  // Revert on error
                  setIsSaved(isSaved)
                  showToast('Failed to save post', 'error')
                }
              }
            }}
            className={`flex items-center space-x-2 transition-colors ${
              isSaved 
                ? 'text-red-400' 
                : 'text-gray-400 hover:text-red-400'
            }`}
            disabled={!currentUser}
          >
{isSaved ? (
              <FaHeart className="w-5 h-5" />
            ) : (
              <FiHeart className="w-5 h-5" />
            )}
            <span>{isSaved ? 'Saved ✓' : 'Save'}</span>
          </button>
        </div>

        {/* Share */}
        <button 
          onClick={() => onShare && onShare(post)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FiShare className="w-5 h-5" />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-white/10">
          {currentUser && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => sendTypingIndicator(post._id, true)}
                    onBlur={() => sendTypingIndicator(post._id, false)}
                    placeholder="Add a comment..."
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg resize-none h-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={submittingComment}
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="btn-gradient px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend className="w-4 h-4" />
                      <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="text-xs text-gray-400 italic mb-2">
              {typingUsers.length === 1 
                ? `${typingUsers[0].userName} is typing...`
                : `${typingUsers.length} users are typing...`
              }
            </div>
          )}
          
          <div className="space-y-4">
            {loadingComments ? (
              <div className="text-center py-4 text-gray-400">
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-sm">{comment.author?.name}</span>
                        <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                    </div>
                    
                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCommentVote(comment._id, 'upvote')}
                          className={`p-1 rounded transition-colors ${
                            comment.userVote === 'up' 
                              ? 'text-green-400' 
                              : 'text-gray-400 hover:text-green-400'
                          }`}
                          disabled={!currentUser}
                        >
                          <FiChevronUp className="w-4 h-4" />
                        </button>
                        
                        <span className={`text-xs font-semibold ${
                          comment.voteCount > 0 ? 'text-green-400' :
                          comment.voteCount < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {comment.voteCount || 0}
                        </span>
                        
                        <button
                          onClick={() => handleCommentVote(comment._id, 'downvote')}
                          className={`p-1 rounded transition-colors ${
                            comment.userVote === 'down' 
                              ? 'text-red-400' 
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                          disabled={!currentUser}
                        >
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => setReplyingTo(comment)}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                    
                    {/* Reply Form */}
                    {replyingTo && replyingTo._id === comment._id && (
                      <form onSubmit={handleSubmitReply} className="mt-3">
                        <div className="flex space-x-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Reply to ${comment.author?.name}...`}
                              className="w-full p-2 bg-white/10 border border-white/20 rounded-lg resize-none h-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              disabled={submittingReply}
                            />
                            <div className="flex justify-between mt-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyText('')
                                }}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit"
                                disabled={!replyText.trim() || submittingReply}
                                className="btn-gradient px-3 py-1 rounded-lg font-semibold text-xs flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span>{submittingReply ? 'Posting...' : 'Reply'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    )}
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-6 space-y-3 border-l-2 border-white/10 pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply._id} className="flex space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {reply.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="bg-white/5 rounded-lg p-2">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-xs">{reply.author?.name}</span>
                                  <span className="text-xs text-gray-400">{formatTimeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="text-xs text-gray-300">{reply.content}</p>
                              </div>
                              
                              {/* Reply Actions */}
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleCommentVote(reply._id, 'upvote')}
                                    className={`p-1 rounded transition-colors ${
                                      reply.userVote === 'up' 
                                        ? 'text-green-400' 
                                        : 'text-gray-400 hover:text-green-400'
                                    }`}
                                    disabled={!currentUser}
                                  >
                                    <FiChevronUp className="w-3 h-3" />
                                  </button>
                                  
                                  <span className={`text-xs font-semibold ${
                                    reply.voteCount > 0 ? 'text-green-400' :
                                    reply.voteCount < 0 ? 'text-red-400' : 'text-gray-400'
                                  }`}>
                                    {reply.voteCount || 0}
                                  </span>
                                  
                                  <button
                                    onClick={() => handleCommentVote(reply._id, 'downvote')}
                                    className={`p-1 rounded transition-colors ${
                                      reply.userVote === 'down' 
                                        ? 'text-red-400' 
                                        : 'text-gray-400 hover:text-red-400'
                                    }`}
                                    disabled={!currentUser}
                                  >
                                    <FiChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  )
}

export default PostCard