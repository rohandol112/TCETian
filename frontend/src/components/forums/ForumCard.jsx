import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FiUsers, 
  FiMessageSquare, 
  FiTrendingUp, 
  FiUserPlus,
  FiUserMinus,
  FiLock,
  FiGlobe,
  FiMoreVertical
} from 'react-icons/fi'

const ForumCard = ({ 
  forum, 
  viewMode = 'grid', 
  onJoin, 
  onLeave, 
  isAuthenticated, 
  currentUser 
}) => {
  const [showMenu, setShowMenu] = useState(false)
  
  const isCreator = currentUser && forum.creator._id === currentUser._id
  const isMember = forum.userMembership?.isMember || false
  const memberRole = forum.userMembership?.role
  
  const handleJoinLeave = () => {
    if (isMember) {
      onLeave()
    } else {
      onJoin()
    }
  }
  
  const formatMemberCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M'
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K'
    }
    return count.toString()
  }
  
  const getCategoryColor = (category) => {
    const colors = {
      Academic: 'from-blue-500 to-blue-600',
      Technology: 'from-green-500 to-green-600',
      Sports: 'from-orange-500 to-orange-600',
      Arts: 'from-pink-500 to-pink-600',
      General: 'from-gray-500 to-gray-600',
      Events: 'from-purple-500 to-purple-600',
      Career: 'from-indigo-500 to-indigo-600',
      Entertainment: 'from-red-500 to-red-600'
    }
    return colors[category] || 'from-gray-500 to-gray-600'
  }
  
  if (viewMode === 'list') {
    return (
      <div className="glass rounded-xl p-6 card-hover">
        <div className="flex items-center gap-4">
          {/* Forum Icon */}
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(forum.category)} flex items-center justify-center flex-shrink-0`}>
            {forum.icon ? (
              <img src={forum.icon} alt={forum.displayName} className="w-8 h-8 rounded" />
            ) : (
              <FiMessageSquare className="w-6 h-6 text-white" />
            )}
          </div>
          
          {/* Forum Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <Link 
                  to={`/forums/${forum.name}`}
                  className="text-lg font-semibold text-white hover:text-gradient transition-colors"
                >
                  r/{forum.name}
                </Link>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {forum.description}
                </p>
              </div>
              
              {/* Privacy Indicator */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {forum.settings.isPublic ? (
                  <><FiGlobe className="w-3 h-3" /> Public</>
                ) : (
                  <><FiLock className="w-3 h-3" /> Private</>
                )}
              </div>
            </div>
            
            {/* Tags */}
            {forum.tags && forum.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {forum.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-white/10 rounded-full text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
                {forum.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{forum.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <FiUsers className="w-4 h-4" />
              <span>{formatMemberCount(forum.stats.memberCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiMessageSquare className="w-4 h-4" />
              <span>{formatMemberCount(forum.stats.postCount)}</span>
            </div>
          </div>
          
          {/* Action Button */}
          {isAuthenticated && !isCreator && (
            <button
              onClick={handleJoinLeave}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isMember
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                  : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
              }`}
            >
              {isMember ? (
                <>
                  <FiUserMinus className="w-4 h-4" />
                  Leave
                </>
              ) : (
                <>
                  <FiUserPlus className="w-4 h-4" />
                  Join
                </>
              )}
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // Grid view (default)
  return (
    <div className="glass rounded-xl overflow-hidden card-hover">
      {/* Header with banner or gradient */}
      <div className={`h-24 bg-gradient-to-r ${getCategoryColor(forum.category)} relative`}>
        {forum.banner && (
          <img 
            src={forum.banner} 
            alt={forum.displayName}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Privacy indicator */}
        <div className="absolute top-3 right-3">
          {forum.settings.isPublic ? (
            <FiGlobe className="w-4 h-4 text-white/70" />
          ) : (
            <FiLock className="w-4 h-4 text-white/70" />
          )}
        </div>
        
        {/* Forum icon */}
        <div className="absolute -bottom-6 left-6">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(forum.category)} border-2 border-gray-900 flex items-center justify-center`}>
            {forum.icon ? (
              <img src={forum.icon} alt={forum.displayName} className="w-8 h-8 rounded" />
            ) : (
              <FiMessageSquare className="w-6 h-6 text-white" />
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 pt-8">
        {/* Forum Name and Description */}
        <div className="mb-4">
          <Link 
            to={`/forums/${forum.name}`}
            className="text-xl font-bold text-white hover:text-gradient transition-colors block mb-1"
          >
            r/{forum.name}
          </Link>
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {forum.description}
          </p>
          <span className={`inline-block px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getCategoryColor(forum.category)} text-white`}>
            {forum.category}
          </span>
        </div>
        
        {/* Tags */}
        {forum.tags && forum.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {forum.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-white/10 rounded-full text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Stats */}
        <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FiUsers className="w-4 h-4" />
              <span>{formatMemberCount(forum.stats.memberCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiMessageSquare className="w-4 h-4" />
              <span>{formatMemberCount(forum.stats.postCount)}</span>
            </div>
          </div>
          
          {forum.stats.dailyActiveUsers > 0 && (
            <div className="flex items-center gap-1 text-green-400">
              <FiTrendingUp className="w-3 h-3" />
              <span className="text-xs">{forum.stats.dailyActiveUsers} active</span>
            </div>
          )}
        </div>
        
        {/* Member Status */}
        {isMember && (
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
              memberRole === 'admin' 
                ? 'bg-red-600/20 text-red-400'
                : memberRole === 'moderator'
                ? 'bg-yellow-600/20 text-yellow-400'
                : 'bg-green-600/20 text-green-400'
            }`}>
              {memberRole === 'admin' ? '👑 Admin' : memberRole === 'moderator' ? '🛡️ Mod' : '✅ Member'}
            </span>
          </div>
        )}
        
        {/* Action Button */}
        <div className="flex gap-2">
          <Link
            to={`/forums/${forum.name}`}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white text-center py-2 px-4 rounded-lg transition-colors font-medium"
          >
            View Forum
          </Link>
          
          {isAuthenticated && !isCreator && (
            <button
              onClick={handleJoinLeave}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isMember
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                  : 'btn-gradient text-white'
              }`}
            >
              {isMember ? <FiUserMinus className="w-4 h-4" /> : <FiUserPlus className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForumCard