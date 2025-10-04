import { useState, useEffect } from 'react'
import { 
  FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, 
  FiMessageSquare, FiHeart, FiBookmark, FiEdit3, FiEye 
} from 'react-icons/fi'
import { userService } from '../../services/userService.js'

const UserAnalytics = ({ userId = null }) => {
  const [analytics, setAnalytics] = useState({
    summary: {},
    activityTrend: [],
    topPosts: [],
    topComments: [],
    weeklyStats: {}
  })
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('week')

  useEffect(() => {
    loadAnalytics()
  }, [timeframe, userId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90
      
      const [activityRes, summaryRes] = await Promise.all([
        userService.getUserActivity({ days, userId }),
        userService.getUserAnalytics({ timeframe, userId })
      ])

      if (activityRes.success && summaryRes.success) {
        setAnalytics({
          summary: summaryRes.data.summary || {},
          activityTrend: summaryRes.data.activityTrend || [],
          topPosts: summaryRes.data.topPosts || [],
          topComments: summaryRes.data.topComments || [],
          weeklyStats: activityRes.data.activitySummary || {}
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getChangeIcon = (change) => {
    if (change > 0) return <FiTrendingUp className="w-4 h-4 text-green-400" />
    if (change < 0) return <FiTrendingDown className="w-4 h-4 text-red-400" />
    return <FiActivity className="w-4 h-4 text-gray-400" />
  }

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="h-20 bg-white/10 rounded"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {[
          { value: 'week', label: '7 Days' },
          { value: 'month', label: '30 Days' },
          { value: 'quarter', label: '90 Days' }
        ].map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeframe(range.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === range.value
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <FiActivity className="w-5 h-5 text-purple-400" />
          <span>Activity Summary</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: FiEdit3,
              label: 'Posts',
              value: analytics.summary.totalPosts || 0,
              change: analytics.summary.postsChange || 0,
              color: 'text-blue-400'
            },
            {
              icon: FiMessageSquare,
              label: 'Comments',
              value: analytics.summary.totalComments || 0,
              change: analytics.summary.commentsChange || 0,
              color: 'text-green-400'
            },
            {
              icon: FiHeart,
              label: 'Votes Received',
              value: analytics.summary.totalVotesReceived || 0,
              change: analytics.summary.votesChange || 0,
              color: 'text-red-400'
            },
            {
              icon: FiEye,
              label: 'Post Views',
              value: analytics.summary.totalViews || 0,
              change: analytics.summary.viewsChange || 0,
              color: 'text-yellow-400'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                {getChangeIcon(stat.change)}
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">{stat.label}</div>
                <div className={`text-xs ${getChangeColor(stat.change)}`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Breakdown */}
      {Object.keys(analytics.weeklyStats).length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <FiCalendar className="w-5 h-5 text-purple-400" />
            <span>Activity Breakdown</span>
          </h3>
          
          <div className="space-y-3">
            {Object.entries(analytics.weeklyStats).map(([activityType, count]) => (
              <div key={activityType} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  {activityType === 'post_created' && <FiEdit3 className="w-4 h-4 text-blue-400" />}
                  {activityType === 'comment_created' && <FiMessageSquare className="w-4 h-4 text-green-400" />}
                  {activityType === 'post_upvoted' && <FiTrendingUp className="w-4 h-4 text-purple-400" />}
                  {activityType === 'post_downvoted' && <FiTrendingDown className="w-4 h-4 text-orange-400" />}
                  {activityType === 'post_saved' && <FiBookmark className="w-4 h-4 text-yellow-400" />}
                  <span className="capitalize">
                    {activityType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="font-semibold text-lg">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Posts */}
      {analytics.topPosts.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <FiTrendingUp className="w-5 h-5 text-purple-400" />
            <span>Top Posts</span>
          </h3>
          
          <div className="space-y-3">
            {analytics.topPosts.slice(0, 5).map((post, index) => (
              <div key={post._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <FiHeart className="w-3 h-3" />
                      <span>{post.upvotes - post.downvotes}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiMessageSquare className="w-3 h-3" />
                      <span>{post.commentCount}</span>
                    </span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-lg font-bold">#{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Metrics */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <FiHeart className="w-5 h-5 text-purple-400" />
          <span>Engagement Metrics</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {analytics.summary.avgUpvotesPerPost || 0}
            </div>
            <div className="text-sm text-gray-400">Avg Upvotes per Post</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {analytics.summary.avgCommentsPerPost || 0}
            </div>
            <div className="text-sm text-gray-400">Avg Comments per Post</div>
          </div>
          
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {((analytics.summary.totalUpvotes / (analytics.summary.totalPosts || 1)) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Engagement Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserAnalytics