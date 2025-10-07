import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { 
  FiUser, FiMail, FiCalendar, FiEdit, FiCamera, FiLock, 
  FiBookmark, FiActivity, FiSettings
} from 'react-icons/fi'

const Profile = () => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)

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
        <div className="glass rounded-xl p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Profile</h2>
          <p className="text-gray-400 mb-4">Welcome {currentUser?.name || 'User'}</p>
          
          {currentUser?.role === 'club' && (
            <div className="glass rounded-xl p-6 border-2 border-purple-500/30 mb-6">
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
          
          <div className="text-center">
            <p className="text-gray-400">Profile functionality is being restored...</p>
            <button 
              onClick={() => showToast('Profile updated!', 'success')}
              className="btn-gradient px-6 py-2 rounded-lg font-semibold mt-4"
            >
              Test Toast
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile