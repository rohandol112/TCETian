import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  FiUsers, 
  FiMessageSquare, 
  FiTrendingUp, 
  FiPlus,
  FiArrowLeft,
  FiGlobe,
  FiLock,
  FiUserPlus,
  FiUserMinus,
  FiSettings
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { forumService } from '../services/forumService.js'
import { postService } from '../services/postService.js'
import PostCard from '../components/social/PostCard'
import CreatePostModal from '../components/social/CreatePostModal'

const ForumDetail = () => {
  const { forumName } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [forum, setForum] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sortBy, setSortBy] = useState('hot')
  
  useEffect(() => {
    loadForum()
    loadForumPosts()
  }, [forumName, sortBy])
  
  const loadForum = async () => {
    try {
      setLoading(true)
      const response = await forumService.getForum(forumName)
      if (response.success) {
        setForum(response.data.forum)
      }
    } catch (error) {
      console.error('Error loading forum:', error)
      showToast('Failed to load forum', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const loadForumPosts = async () => {
    if (!forum) return
    
    try {
      setPostsLoading(true)
      const response = await forumService.getForumPosts(forum._id, { sort: sortBy })
      if (response.success) {
        setPosts(response.data.posts)
      }
    } catch (error) {
      console.error('Error loading forum posts:', error)
      showToast('Failed to load posts', 'error')
    } finally {
      setPostsLoading(false)
    }
  }
  
  const handleJoinForum = async () => {
    try {
      const response = await forumService.joinForum(forumName)
      if (response.success) {
        loadForum()
        showToast('Successfully joined forum!', 'success')
      }
    } catch (error) {
      console.error('Error joining forum:', error)
      showToast('Failed to join forum', 'error')
    }
  }
  
  const handleLeaveForum = async () => {
    try {
      const response = await forumService.leaveForum(forumName)
      if (response.success) {
        loadForum()
        showToast('Successfully left forum', 'success')
      }
    } catch (error) {
      console.error('Error leaving forum:', error)
      showToast('Failed to leave forum', 'error')
    }
  }
  
  const handlePostCreated = () => {
    loadForumPosts()
    setShowCreateModal(false)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-white/10 rounded-xl"></div>
            <div className="h-20 bg-white/10 rounded-xl"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 bg-white/10 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!forum) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20">
        <div className="max-w-6xl mx-auto text-center py-20">
          <FiMessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Forum Not Found</h2>
          <p className="text-gray-400 mb-6">The forum you're looking for doesn't exist.</p>
          <Link
            to="/social"
            className="btn-gradient px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Social Hub
          </Link>
        </div>
      </div>
    )
  }
  
  const isCreator = user && forum.creator._id === user._id
  const isMember = forum.userMembership?.isMember || false
  const memberRole = forum.userMembership?.role
  
  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/social"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Social Hub
          </Link>
        </div>
        
        {/* Forum Header */}
        <div className="glass rounded-xl overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600 relative">
            {forum.banner && (
              <img 
                src={forum.banner} 
                alt={forum.displayName}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Privacy Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-black/30 rounded-full text-sm text-white">
              {forum.settings.isPublic ? (
                <>
                  <FiGlobe className="w-3 h-3" />
                  Public
                </>
              ) : (
                <>
                  <FiLock className="w-3 h-3" />
                  Private
                </>
              )}
            </div>
          </div>
          
          {/* Forum Info */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gradient mb-2">
                  r/{forum.name}
                </h1>
                <p className="text-gray-300 mb-4">{forum.description}</p>
                
                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <FiUsers className="w-4 h-4" />
                    <span>{forum.stats.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiMessageSquare className="w-4 h-4" />
                    <span>{forum.stats.postCount} posts</span>
                  </div>
                  {forum.stats.dailyActiveUsers > 0 && (
                    <div className="flex items-center gap-1 text-green-400">
                      <FiTrendingUp className="w-3 h-3" />
                      <span>{forum.stats.dailyActiveUsers} online</span>
                    </div>
                  )}
                </div>
                
                {/* Member Status */}
                {isMember && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                      memberRole === 'admin' 
                        ? 'bg-red-600/20 text-red-400'
                        : memberRole === 'moderator'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-green-600/20 text-green-400'
                    }`}>
                      {memberRole === 'admin' ? '👑 Admin' : memberRole === 'moderator' ? '🛡️ Moderator' : '✅ Member'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                {isAuthenticated && !isCreator && (
                  <button
                    onClick={isMember ? handleLeaveForum : handleJoinForum}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      isMember
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                        : 'btn-gradient text-white'
                    }`}
                  >
                    {isMember ? (
                      <>
                        <FiUserMinus className="w-4 h-4" />
                        Leave Forum
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="w-4 h-4" />
                        Join Forum
                      </>
                    )}
                  </button>
                )}
                
                {isAuthenticated && isMember && forum.settings.allowPosts && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-gradient px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Create Post
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Posts Section */}
        <div className="space-y-6">
          {/* Sort Controls */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Forum Posts</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input py-2 pr-8 min-w-[120px]"
            >
              <option value="hot">🔥 Hot</option>
              <option value="new">🆕 New</option>
              <option value="top">⭐ Top</option>
            </select>
          </div>
          
          {/* Posts List */}
          {postsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 bg-white/20 rounded mb-4 w-2/3"></div>
                  <div className="h-20 bg-white/20 rounded"></div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onVote={() => {}}
                  onDelete={() => {}}
                  onSave={() => {}}
                  onShare={() => {}}
                  formatTimeAgo={(date) => {
                    const now = new Date()
                    const diffInHours = Math.floor((now - new Date(date)) / (1000 * 60 * 60))
                    if (diffInHours < 1) return 'Just now'
                    if (diffInHours < 24) return `${diffInHours}h ago`
                    return `${Math.floor(diffInHours / 24)}d ago`
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiMessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No posts yet</h3>
              <p className="text-gray-400 mb-6">
                Be the first to start a discussion in this forum!
              </p>
              {isAuthenticated && isMember && forum.settings.allowPosts && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn-gradient px-6 py-3 rounded-lg font-semibold"
                >
                  Create First Post
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onPostCreated={handlePostCreated}
            forumId={forum._id}
          />
        )}
      </div>
    </div>
  )
}

export default ForumDetail