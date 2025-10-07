import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiMessageCircle, 
  FiArrowUp, 
  FiArrowDown, 
  FiShare, 
  FiTrendingUp,
  FiPlus,
  FiSearch,
  FiFilter,
  FiMoreHorizontal,
  FiEdit,
  FiTrash2,
  FiExternalLink,
  FiImage,
  FiLink,
  FiType
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useSocket } from '../context/SocketContext'
import { postService } from '../services/postService.js'
import PostCard from '../components/social/PostCard'
import CreatePostModal from '../components/social/CreatePostModal'
import OnlineStatus from '../components/realtime/OnlineStatus'
import LiveActivityFeed from '../components/realtime/LiveActivityFeed'

const Social = () => {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const { onNewPost, onPostUpdate, isConnected } = useSocket()
  
  const [posts, setPosts] = useState([])
  const [trendingPosts, setTrendingPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('hot')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const sortOptions = [
    { value: 'hot', label: '🔥 Hot', icon: FiTrendingUp },
    { value: 'new', label: '🆕 New' },
    { value: 'top', label: '⭐ Top' },
    { value: 'controversial', label: '💥 Controversial' }
  ]

  const categories = [
    'all', 'General Discussion', 'Academic Help', 'Tech Talk', 'Career Guidance',
    'Project Showcase', 'Internship & Jobs', 'Campus Life', 'Exam Discussion',
    'Study Groups', 'Events', 'Memes & Fun', 'Sports', 'Clubs & Societies'
  ]

  useEffect(() => {
    fetchPosts()
    fetchTrendingPosts()
  }, [sortBy, selectedCategory, searchTerm])

  // WebSocket real-time event listeners
  useEffect(() => {
    if (!isConnected) return

    // Listen for new posts
    const unsubscribeNewPost = onNewPost((newPost) => {
      setPosts(prevPosts => [newPost, ...prevPosts])
      showToast(`New post: ${newPost.title || newPost.content.substring(0, 50)}...`, 'info')
    })

    // Listen for post updates (votes, etc.)
    const unsubscribePostUpdate = onPostUpdate(({ postId, voteCount, upvotes, downvotes }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, voteCount, upvotes, downvotes }
            : post
        )
      )
    })

    return () => {
      unsubscribeNewPost()
      unsubscribePostUpdate()
    }
  }, [isConnected, onNewPost, onPostUpdate, showToast])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        sort: sortBy,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
        ...(user && { year: user.year, branch: user.branch }),
        limit: 15
      }
      
      const response = await postService.getPosts(params)
      setPosts(response.data.posts)
    } catch (error) {
      showToast('Failed to fetch posts', 'error')
      console.error('Fetch posts error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendingPosts = async () => {
    try {
      const response = await postService.getTrendingPosts(5)
      setTrendingPosts(response.data.posts)
    } catch (error) {
      console.error('Fetch trending posts error:', error)
    }
  }

  const handleVote = async (postId, voteType) => {
    if (!isAuthenticated) {
      showToast('Please login to vote', 'error')
      return
    }

    try {
      // Optimistic update - map backend types to frontend
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const currentVote = post.userVote
            let newVoteCount = post.voteCount || 0
            let newUserVote = currentVote
            
            // Handle vote changes based on backend voteType
            if (voteType === 'remove') {
              // Removing current vote
              if (currentVote === 'upvote') newVoteCount--
              if (currentVote === 'downvote') newVoteCount++
              newUserVote = null
            } else if (voteType === 'up') {
              // Remove previous vote effect if any
              if (currentVote === 'upvote') return post // No change
              if (currentVote === 'downvote') newVoteCount++
              // Add upvote
              newVoteCount++
              newUserVote = 'upvote'
            } else if (voteType === 'down') {
              // Remove previous vote effect if any
              if (currentVote === 'downvote') return post // No change
              if (currentVote === 'upvote') newVoteCount--
              // Add downvote
              newVoteCount--
              newUserVote = 'downvote'
            }
            
            return {
              ...post,
              voteCount: newVoteCount,
              userVote: newUserVote
            }
          }
          return post
        })
      )

      await postService.votePost(postId, voteType)
    } catch (error) {
      showToast(error.message || 'Failed to vote', 'error')
      // Revert optimistic update on error
      fetchPosts()
    }
  }

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postService.deletePost(postId)
        showToast('Post deleted successfully', 'success')
        fetchPosts()
      } catch (error) {
        showToast('Failed to delete post', 'error')
      }
    }
  }

  const handleSavePost = async (postId, isSaved) => {
    if (!isAuthenticated) {
      showToast('Please login to save posts', 'error')
      return
    }

    try {
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, isSaved: !isSaved }
            : post
        )
      )

      if (isSaved) {
        await postService.unsavePost(postId)
        showToast('Post removed from saved', 'success')
      } else {
        await postService.savePost(postId)
        showToast('Post saved successfully', 'success')
      }
    } catch (error) {
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, isSaved: isSaved }
            : post
        )
      )
      showToast(error.message || 'Failed to save post', 'error')
    }
  }

  const handleSharePost = async (post) => {
    const shareData = {
      title: post.title || 'Check out this post from TCETian',
      text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      url: `${window.location.origin}/post/${post._id}`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(`${window.location.origin}/post/${post._id}`)
        }
      }
    } else {
      copyToClipboard(`${window.location.origin}/post/${post._id}`)
    }
  }

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!', 'success')
      })
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('Link copied to clipboard!', 'success')
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  }

  // Show preview for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Social Hub
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect with your TCET community • Share knowledge • Build friendships
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="glass rounded-xl p-6 text-center">
                <FiMessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Social Discussions</h3>
                <p className="text-gray-300">Engage in academic discussions, get help with assignments, and share knowledge</p>
              </div>
              
              <div className="glass rounded-xl p-6 text-center">
                <FiTrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trending Topics</h3>
                <p className="text-gray-300">Stay updated with what's happening around campus and popular discussions</p>
              </div>
              
              <div className="glass rounded-xl p-6 text-center">
                <FiSearch className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
                <p className="text-gray-300">Find posts by category, search content, and discover relevant discussions</p>
              </div>
            </div>

            {/* Sample posts preview */}
            <div className="text-left mb-8">
              <h2 className="text-2xl font-bold mb-6">Recent Community Posts</h2>
              
              <div className="space-y-6">
                {/* Sample Post 1 */}
                <div className="glass rounded-xl p-6 opacity-75 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          S
                        </div>
                        <div>
                          <h4 className="font-semibold">Student • SE COMPS</h4>
                          <p className="text-sm text-gray-400">2 hours ago</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        Academic
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Looking for Data Structures study group</h3>
                    <p className="text-gray-300 mb-4">Anyone interested in forming a DS study group for the upcoming exams? We can meet in the library...</p>
                    <div className="flex items-center space-x-6 text-gray-400">
                      <span className="flex items-center space-x-1"><FiTrendingUp className="w-4 h-4" /> 12</span>
                      <span className="flex items-center space-x-1"><FiMessageCircle className="w-4 h-4" /> 8</span>
                    </div>
                  </div>
                </div>

                {/* Sample Post 2 */}
                <div className="glass rounded-xl p-6 opacity-75 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 pointer-events-none"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          A
                        </div>
                        <div>
                          <h4 className="font-semibold">Anonymous • TE IT</h4>
                          <p className="text-sm text-gray-400">5 hours ago</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        Events
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Tech Fest 2025 - Call for Volunteers</h3>
                    <p className="text-gray-300 mb-4">Join us in organizing the biggest tech event of the year! Multiple departments looking for enthusiastic volunteers...</p>
                    <div className="flex items-center space-x-6 text-gray-400">
                      <span className="flex items-center space-x-1"><FiTrendingUp className="w-4 h-4" /> 24</span>
                      <span className="flex items-center space-x-1"><FiMessageCircle className="w-4 h-4" /> 15</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blur overlay for locked content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Call to action */}
            <div className="glass rounded-xl p-8 text-center">
              <FiMessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Join the Conversation</h3>
              <p className="text-gray-300 mb-6">
                Connect with thousands of TCET students. Share knowledge, ask questions, and be part of an active learning community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/login"
                  className="btn-gradient px-8 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                >
                  <FiMessageCircle className="w-5 h-5" />
                  <span>Login to Join</span>
                </Link>
                <Link 
                  to="/register"
                  className="px-8 py-3 border border-white/20 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div className="flex items-start space-x-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
                    Social Hub
                  </h1>
                  <p className="text-xl text-gray-300">
                    Connect with your TCET community
                  </p>
                </div>
                <OnlineStatus />
              </div>
              
              {isAuthenticated && user?.role === 'student' && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 mt-6 md:mt-0"
                >
                  <FiPlus className="w-5 h-5" />
                  <span>Create Post</span>
                </button>
              )}
            </div>

            {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  {/* Search */}
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none min-w-[120px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none min-w-[180px]"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-900">
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Posts */}
            {loading ? (
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="glass rounded-xl p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-white/20 rounded mb-2"></div>
                        <div className="h-3 bg-white/20 rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-4 bg-white/20 rounded mb-2 w-2/3"></div>
                    <div className="h-10 bg-white/20 rounded"></div>
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
                    onVote={handleVote}
                    onDelete={handleDeletePost}
                    onSave={handleSavePost}
                    onShare={handleSharePost}
                    formatTimeAgo={formatTimeAgo}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <FiMessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No posts found</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Be the first to start a discussion!'
                  }
                </p>
                {isAuthenticated && user?.role === 'student' && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="btn-gradient px-6 py-3 rounded-xl font-semibold"
                  >
                    Create First Post
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Activity Feed */}
            <LiveActivityFeed />

            {/* Create Post CTA for non-students */}
            {(!isAuthenticated || user?.role !== 'student') && (
              <div className="glass rounded-xl p-6 text-center">
                <FiMessageCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Join the Discussion</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Login as a student to create posts and engage with the community
                </p>
              </div>
            )}

            {/* Trending Posts */}
            {trendingPosts.length > 0 && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FiTrendingUp className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold">Trending</h3>
                </div>
                <div className="space-y-3">
                  {trendingPosts.map((post) => (
                    <div key={post._id} className="cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                      <h4 className="text-sm font-medium line-clamp-2 mb-1">{post.title}</h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{post.voteCount} votes</span>
                        <span>•</span>
                        <span>{post.commentCount} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Guidelines */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Community Guidelines</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Be respectful and kind</p>
                <p>• No spam or self-promotion</p>
                <p>• Stay on topic</p>
                <p>• Help fellow students</p>
                <p>• Report inappropriate content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onPostCreated={fetchPosts}
          />
        )}
      </div>
    </div>
  )
}

export default Social