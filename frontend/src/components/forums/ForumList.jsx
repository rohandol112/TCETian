import { useState, useEffect } from 'react'
import { 
  FiUsers, 
  FiMessageSquare, 
  FiTrendingUp, 
  FiPlus, 
  FiSearch,
  FiFilter,
  FiGrid,
  FiList
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { forumService } from '../../services/forumService.js'
import CreateForumModal from './CreateForumModal'
import ForumCard from './ForumCard'

const ForumList = () => {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [forums, setForums] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('members')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  useEffect(() => {
    loadForums()
    loadCategories()
  }, [selectedCategory, sortBy])
  
  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        loadForums()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      loadForums()
    }
  }, [searchTerm])
  
  const loadForums = async () => {
    try {
      setLoading(true)
      const params = {
        category: selectedCategory,
        search: searchTerm,
        sortBy: sortBy,
        limit: 20
      }
      
      const response = await forumService.getForums(params)
      if (response.success) {
        setForums(response.data.forums)
      }
    } catch (error) {
      console.error('Error loading forums:', error)
      showToast('Failed to load forums', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const loadCategories = async () => {
    try {
      const response = await forumService.getCategories()
      if (response.success) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }
  
  const handleForumCreated = (newForum) => {
    setForums(prev => [newForum, ...prev])
    setShowCreateModal(false)
    showToast('Forum created successfully!', 'success')
  }
  
  const handleJoinForum = async (forumName) => {
    try {
      const response = await forumService.joinForum(forumName)
      if (response.success) {
        loadForums() // Refresh to update membership status
        showToast('Successfully joined forum!', 'success')
      }
    } catch (error) {
      console.error('Error joining forum:', error)
      showToast('Failed to join forum', 'error')
    }
  }
  
  const handleLeaveForum = async (forumName) => {
    try {
      const response = await forumService.leaveForum(forumName)
      if (response.success) {
        loadForums() // Refresh to update membership status
        showToast('Successfully left forum', 'success')
      }
    } catch (error) {
      console.error('Error leaving forum:', error)
      showToast('Failed to leave forum', 'error')
    }
  }
  
  const sortOptions = [
    { value: 'members', label: 'Most Members' },
    { value: 'active', label: 'Most Active' },
    { value: 'posts', label: 'Most Posts' },
    { value: 'newest', label: 'Newest First' }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Discussion Forums</h1>
          <p className="text-gray-300">Join topic-based discussions and connect with your community</p>
        </div>
        
        {isAuthenticated && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-gradient px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Create Forum
          </button>
        )}
      </div>
      
      {/* Filters and Controls */}
      <div className="glass rounded-xl p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search forums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 pr-4 py-3 w-full"
          />
        </div>
        
        {/* Filters and View Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input py-2 pr-8"
            >
              <option value="all">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Technology">Technology</option>
              <option value="Sports">Sports</option>
              <option value="Arts">Arts</option>
              <option value="General">General</option>
              <option value="Events">Events</option>
              <option value="Career">Career</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>
          
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input py-2 pr-8"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Forums Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'space-y-4'
      }>
        {loading ? (
          // Loading Skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div 
              key={index} 
              className="glass rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))
        ) : forums.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiMessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No forums found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try different search terms' : 'Be the first to create a forum!'}
            </p>
          </div>
        ) : (
          forums.map((forum) => (
            <ForumCard
              key={forum._id}
              forum={forum}
              viewMode={viewMode}
              onJoin={() => handleJoinForum(forum.name)}
              onLeave={() => handleLeaveForum(forum.name)}
              isAuthenticated={isAuthenticated}
              currentUser={user}
            />
          ))
        )}
      </div>
      
      {/* Create Forum Modal */}
      <CreateForumModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onForumCreated={handleForumCreated}
      />
    </div>
  )
}

export default ForumList