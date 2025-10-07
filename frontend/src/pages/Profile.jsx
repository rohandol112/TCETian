import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../context/ToastContext'
import { 
  FiUser, FiMail, FiCalendar, FiEdit, FiCamera, FiLock, 
  FiBookmark, FiActivity, FiSettings, FiTrendingUp,
  FiMessageCircle, FiHeart, FiEye, FiWifi, FiWifiOff, FiBarChart
} from 'react-icons/fi'
import { userService } from '../services/userService'
import UserAnalytics from '../components/analytics/UserAnalytics'

const Profile = () => {
  const { user: currentUser, updateUser } = useAuth()
  // Use socket safely (may not be available)
  let isConnected = false
  let onProfileUpdate = () => () => {} // Return a cleanup function
  
  try {
    const socketContext = useSocket()
    isConnected = socketContext.isConnected
    onProfileUpdate = socketContext.onProfileUpdate
  } catch (error) {
    console.warn('Socket context not available:', error.message)
  }
  const { showToast } = useToast()
  
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [onlineStatus, setOnlineStatus] = useState({})
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    year: '',
    branch: '',
    courseType: '',
    clubName: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Try to get profile first
      try {
        const profileRes = await userService.getProfile()
        if (profileRes.success) {
          setProfile(profileRes.data.user)
          setStats(profileRes.data.stats || {})
          setOnlineStatus(profileRes.data.onlineStatus || {})
          setFormData({
            name: profileRes.data.user.name || '',
            description: profileRes.data.user.description || '',
            year: profileRes.data.user.year || '',
            branch: profileRes.data.user.branch || '',
            courseType: profileRes.data.user.courseType || '',
            clubName: profileRes.data.user.clubName || ''
          })
        }
      } catch (profileError) {
        console.error('Error loading profile:', profileError)
        // Use current user data as fallback
        if (currentUser) {
          setProfile(currentUser)
          setFormData({
            name: currentUser.name || '',
            description: currentUser.description || '',
            year: currentUser.year || '',
            branch: currentUser.branch || '',
            courseType: currentUser.courseType || '',
            clubName: currentUser.clubName || ''
          })
        }
      }

      // Try to get activity data (optional)
      try {
        const activityRes = await userService.getUserActivity({ days: 7 })
        if (activityRes.success) {
          setRecentActivity(activityRes.data.activitySummary || [])
        }
      } catch (activityError) {
        console.error('Error loading activity:', activityError)
        // Activity is optional, continue without it
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
      showToast('Some profile data could not be loaded', 'warning')
    } finally {
      setLoading(false)
    }
  }

  // Load saved posts
  const loadSavedPosts = async () => {
    try {
      const response = await userService.getSavedPosts({ limit: 5 })
      if (response.success) {
        setSavedPosts(response.data.savedPosts)
      }
    } catch (error) {
      console.error('Error loading saved posts:', error)
    }
  }

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const response = await userService.updateProfile(formData)
      if (response.success) {
        setProfile(response.data.user)
        updateUser(response.data.user)
        setEditMode(false)
        showToast('Profile updated successfully', 'success')
      }
    } catch (error) {
      showToast('Failed to update profile', 'error')
    }
  }

  // Update profile picture
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const response = await userService.updateProfilePicture(file)
        if (response.success) {
          setProfile(prev => ({ ...prev, profilePicture: response.data.profilePicture }))
          updateUser({ ...currentUser, profilePicture: response.data.profilePicture })
          showToast('Profile picture updated successfully', 'success')
        }
      } catch (error) {
        showToast('Failed to update profile picture', 'error')
      }
    }
  }

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    try {
      const response = await userService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )
      if (response.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        showToast('Password changed successfully', 'success')
      }
    } catch (error) {
      showToast('Failed to change password', 'error')
    }
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  // Format activity type
  const formatActivityType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  useEffect(() => {
    loadProfile()
    if (activeTab === 'saved') {
      loadSavedPosts()
    }
  }, [activeTab])

  // Listen for real-time profile updates
  useEffect(() => {
    const unsubscribe = onProfileUpdate((data) => {
      setProfile(prev => ({ ...prev, ...data.user }))
      showToast('Profile updated in real-time', 'info')
    })

    return unsubscribe
  }, [onProfileUpdate])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass rounded-xl p-6 text-center">
              <div className="relative mb-4">
                {profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full mx-auto object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
                    {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                )}
                <label className="absolute bottom-0 right-1/3 bg-purple-500 rounded-full p-2 cursor-pointer hover:bg-purple-600 transition-colors">
                  <FiCamera className="w-4 h-4 text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold">{profile?.name || 'User'}</h2>
                {onlineStatus?.isOnline ? (
                  <FiWifi className="w-5 h-5 text-green-400" />
                ) : (
                  <FiWifiOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <p className="text-gray-400 mb-4">
                {profile?.role === 'student' 
                  ? `${profile?.year || ''} ${profile?.branch || ''} Student`
                  : profile?.clubName || 'Club'
                }
              </p>
              
              {profile?.description && (
                <p className="text-gray-300 text-sm mb-4">{profile.description}</p>
              )}
              
              <button 
                onClick={() => setEditMode(!editMode)}
                className="btn-gradient px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 mx-auto"
              >
                <FiEdit className="w-4 h-4" />
                <span>{editMode ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>

            {/* Contact Info */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Info</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FiMail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 text-sm">{profile?.email || 'No email'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiCalendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 text-sm">
                    Joined {formatDate(profile?.createdAt)}
                  </span>
                </div>
                {profile?.studentId && (
                  <div className="flex items-center space-x-3">
                    <FiUser className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300 text-sm">ID: {profile.studentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reputation */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Reputation</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-2">
                  {profile?.socialStats?.reputation || 0}
                </div>
                <p className="text-sm text-gray-400">Community Points</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Form */}
            {editMode && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-6">Edit Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white h-20"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {profile?.role === 'student' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                          <select
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                          >
                            <option value="">Select Year</option>
                            <option value="FE">FE</option>
                            <option value="SE">SE</option>
                            <option value="TE">TE</option>
                            <option value="BE">BE</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
                          <select
                            value={formData.branch}
                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                          >
                            <option value="">Select Branch</option>
                            <option value="COMPS">Computer Engineering</option>
                            <option value="IT">Information Technology</option>
                            <option value="E&TC">Electronics & Telecommunication</option>
                            <option value="MECH">Mechanical Engineering</option>
                            <option value="CIVIL">Civil Engineering</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {profile?.role === 'club' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Club Name</label>
                      <input
                        type="text"
                        value={formData.clubName}
                        onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button type="submit" className="btn-gradient px-6 py-2 rounded-lg font-semibold">
                      Save Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditMode(false)}
                      className="px-6 py-2 border border-white/20 rounded-lg font-semibold hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabs */}
            <div className="glass rounded-xl p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { id: 'overview', label: 'Overview', icon: FiActivity },
                  { id: 'analytics', label: 'Analytics', icon: FiBarChart },
                  ...(profile?.role === 'club' ? [
                    { id: 'event-analytics', label: 'Event Analytics', icon: FiTrendingUp }
                  ] : []),
                  { id: 'saved', label: 'Saved Posts', icon: FiBookmark },
                  { id: 'settings', label: 'Settings', icon: FiSettings }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Club Quick Actions */}
                  {profile?.role === 'club' && (
                    <div className="glass rounded-xl p-6 border-2 border-purple-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-purple-300">Event Management</h4>
                        <FiCalendar className="w-6 h-6 text-purple-400" />
                      </div>
                      <p className="text-gray-300 mb-4">
                        Create new events, view RSVPs, and manage all your events directly from the Events page.
                      </p>
                      <Link 
                        to="/events" 
                        className="btn-gradient px-6 py-3 rounded-lg font-semibold inline-flex items-center space-x-2"
                      >
                        <FiCalendar className="w-4 h-4" />
                        <span>Go to Events Page</span>
                      </Link>
                    </div>
                  )}

                  {/* Stats */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Activity Stats</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <FiEdit className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">{stats?.postCount || 0}</div>
                        <div className="text-sm text-gray-400">Posts</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <FiMessageCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">{stats?.commentCount || 0}</div>
                        <div className="text-sm text-gray-400">Comments</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <FiTrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">{stats?.totalUpvotes || 0}</div>
                        <div className="text-sm text-gray-400">Upvotes</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <FiBookmark className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <div className="text-xl font-bold">{stats?.savedPostsCount || 0}</div>
                        <div className="text-sm text-gray-400">Saved</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Recent Activity</h4>
                    <div className="space-y-3">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <span className="font-medium">{formatActivityType(activity._id)}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{activity.count}</div>
                              <div className="text-xs text-gray-400">this week</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <UserAnalytics />
              )}

              {activeTab === 'event-analytics' && profile?.role === 'club' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Event Analytics Dashboard</h4>
                  <div className="glass rounded-xl p-6">
                    <p className="text-gray-400 text-center py-8">Event Analytics Coming Soon</p>
                  </div>
                </div>
              )}

              {activeTab === 'saved' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Saved Posts</h4>
                  <div className="space-y-4">
                    {savedPosts.length > 0 ? (
                      savedPosts.map((post) => (
                        <div key={post._id} className="p-4 bg-white/5 rounded-lg">
                          <h5 className="font-semibold mb-2">{post.title}</h5>
                          <p className="text-sm text-gray-400">
                            by {post.author?.name} • {formatDate(post.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-8">No saved posts yet</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Change Password</h4>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ 
                          ...passwordData, 
                          currentPassword: e.target.value 
                        })}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ 
                          ...passwordData, 
                          newPassword: e.target.value 
                        })}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        required
                        minLength="6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ 
                          ...passwordData, 
                          confirmPassword: e.target.value 
                        })}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        required
                        minLength="6"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="flex items-center space-x-2 btn-gradient px-6 py-2 rounded-lg font-semibold"
                    >
                      <FiLock className="w-4 h-4" />
                      <span>Update Password</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile