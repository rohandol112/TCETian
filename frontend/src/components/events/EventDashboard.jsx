import { useState, useEffect } from 'react'
import { 
  FiPlus,
  FiCalendar, 
  FiUsers, 
  FiTrendingUp, 
  FiClock,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { eventService } from '../../services/eventService'
import CreateEventModal from './CreateEventModal'

const EventDashboard = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    upcomingEvents: 0,
    totalRSVPs: 0
  })
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (user?.role === 'club') {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await eventService.getDashboardStats()
      setStats(response.data.stats)
      setRecentEvents(response.data.recentEvents)
    } catch (error) {
      showToast('Failed to fetch dashboard data', 'error')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(eventId)
        showToast('Event deleted successfully', 'success')
        fetchDashboardData() // Refresh data
      } catch (error) {
        showToast('Failed to delete event', 'error')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-500/20 text-green-400',
      draft: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-red-500/20 text-red-400',
      completed: 'bg-blue-500/20 text-blue-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  if (user?.role !== 'club') {
    return (
      <div className="min-h-screen pt-24 px-6 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">This dashboard is only available for club accounts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Event Dashboard
            </h1>
            <p className="text-xl text-gray-300">
              Manage your events and track engagement
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 mt-6 md:mt-0"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-white/20 rounded mb-2"></div>
                <div className="h-8 bg-white/20 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-medium">Total Events</h3>
                <FiCalendar className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalEvents}</p>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-medium">Published</h3>
                <FiTrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.publishedEvents}</p>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-medium">Upcoming</h3>
                <FiClock className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.upcomingEvents}</p>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 font-medium">Total RSVPs</h3>
                <FiUsers className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalRSVPs}</p>
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Events</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <div className="h-5 bg-white/20 rounded mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 w-20 bg-white/20 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{event.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{formatDate(event.eventDate)}</span>
                      <span>{event.currentRSVP || 0} RSVPs</span>
                      <span>{event.viewCount || 0} views</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No events yet</h3>
              <p className="text-gray-400 mb-6">Create your first event to get started</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-gradient px-6 py-3 rounded-xl font-semibold"
              >
                Create First Event
              </button>
            </div>
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <CreateEventModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onEventCreated={fetchDashboardData}
          />
        )}
      </div>
    </div>
  )
}

export default EventDashboard