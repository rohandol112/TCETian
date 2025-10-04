import { useState, useEffect } from 'react'
import { FiActivity, FiMessageCircle, FiHeart, FiUserPlus, FiTrendingUp } from 'react-icons/fi'
import { useSocket } from '../../context/SocketContext'

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([])
  const { onNewPost, onPostUpdate, onNewComment, isConnected } = useSocket()

  useEffect(() => {
    if (!isConnected) return

    // Listen for new posts
    const unsubscribeNewPost = onNewPost((post) => {
      const activity = {
        id: `post-${post._id}-${Date.now()}`,
        type: 'new_post',
        message: `${post.author.name} created a new post`,
        user: post.author.name,
        timestamp: new Date(),
        data: post
      }
      setActivities(prev => [activity, ...prev].slice(0, 10)) // Keep last 10 activities
    })

    // Listen for post updates (votes)
    const unsubscribePostUpdate = onPostUpdate(({ postId, voteCount }) => {
      const activity = {
        id: `vote-${postId}-${Date.now()}`,
        type: 'post_vote',
        message: `Post received ${voteCount > 0 ? 'an upvote' : 'a downvote'}`,
        timestamp: new Date(),
        data: { postId, voteCount }
      }
      setActivities(prev => [activity, ...prev].slice(0, 10))
    })

    // Listen for new comments
    const unsubscribeNewComment = onNewComment((comment) => {
      const activity = {
        id: `comment-${comment._id}-${Date.now()}`,
        type: 'new_comment',
        message: `${comment.author.name} commented on a post`,
        user: comment.author.name,
        timestamp: new Date(),
        data: comment
      }
      setActivities(prev => [activity, ...prev].slice(0, 10))
    })

    return () => {
      unsubscribeNewPost()
      unsubscribePostUpdate()
      unsubscribeNewComment()
    }
  }, [isConnected, onNewPost, onPostUpdate, onNewComment])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_post':
        return <FiMessageCircle className="w-4 h-4 text-blue-400" />
      case 'post_vote':
        return <FiHeart className="w-4 h-4 text-red-400" />
      case 'new_comment':
        return <FiMessageCircle className="w-4 h-4 text-green-400" />
      case 'user_join':
        return <FiUserPlus className="w-4 h-4 text-purple-400" />
      default:
        return <FiActivity className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - timestamp) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FiActivity className={`w-5 h-5 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} />
        <h3 className="text-lg font-semibold">Live Activity</h3>
        {isConnected && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="text-center py-8 text-gray-400">
          <FiActivity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Connect to see live activity</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FiTrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
          <p className="text-xs mt-1">Activity will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors animate-fadeIn"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Stats */}
      {activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 text-center">
            {activities.length} recent activities
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveActivityFeed