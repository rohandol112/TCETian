import { useState, useEffect } from 'react'
import { useSocket } from '../../context/SocketContext'
import { 
  FiTrendingUp, 
  FiCalendar, 
  FiUsers, 
  FiEye, 
  FiHeart,
  FiMessageCircle,
  FiActivity
} from 'react-icons/fi'
import { eventService } from '../../services/eventService'

const EventAnalytics = () => {
  const { isConnected, socket } = useSocket()
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRSVPs: 0,
    activeUsers: 0,
    recentActivity: []
  })
  const [realTimeStats, setRealTimeStats] = useState({
    newEventsToday: 0,
    newRSVPsToday: 0,
    activeNow: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  useEffect(() => {
    if (isConnected) {
      // Join analytics room for real-time updates
      socket?.emit('join_analytics')

      // Listen for real-time analytics updates
      socket?.on('analytics_update', (data) => {
        console.log('Analytics update received:', data)
        setRealTimeStats(prev => ({
          ...prev,
          ...data
        }))
      })

      // Listen for new events to update stats
      socket?.on('new_event_created', (eventData) => {
        setRealTimeStats(prev => ({
          ...prev,
          newEventsToday: prev.newEventsToday + 1
        }))
        
        setAnalytics(prev => ({
          ...prev,
          totalEvents: prev.totalEvents + 1,
          upcomingEvents: prev.upcomingEvents + 1,
          recentActivity: [
            {
              type: 'event_created',
              title: `New ${eventData.category} event: ${eventData.title}`,
              time: new Date().toISOString(),
              user: eventData.organizer?.name
            },
            ...prev.recentActivity.slice(0, 4)
          ]
        }))
      })

      // Listen for RSVP updates
      socket?.on('rsvp_update', (rsvpData) => {
        setRealTimeStats(prev => ({
          ...prev,
          newRSVPsToday: prev.newRSVPsToday + 1
        }))
        
        setAnalytics(prev => ({
          ...prev,
          totalRSVPs: prev.totalRSVPs + 1,
          recentActivity: [
            {
              type: 'rsvp',
              title: `${rsvpData.userName} RSVPed to ${rsvpData.eventTitle}`,
              time: new Date().toISOString(),
              user: rsvpData.userName
            },
            ...prev.recentActivity.slice(0, 4)
          ]
        }))
      })

      // Listen for user activity
      socket?.on('user_activity_update', (activityData) => {
        setRealTimeStats(prev => ({
          ...prev,
          activeNow: activityData.activeUsers
        }))
      })

      return () => {
        socket?.emit('leave_analytics')
        socket?.off('analytics_update')
        socket?.off('new_event_created')
        socket?.off('rsvp_update')
        socket?.off('user_activity_update')
      }
    }
  }, [isConnected, socket])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Load basic analytics
      const [eventsResponse, analyticsResponse] = await Promise.all([
        eventService.getEvents({ limit: 100, page: 1 }),
        eventService.getAnalytics?.() || Promise.resolve({ success: false })
      ])
      
      if (eventsResponse.success) {
        const events = eventsResponse.data.events
        const now = new Date()
        const upcomingEvents = events.filter(event => new Date(event.eventDate) > now)
        const totalRSVPs = events.reduce((sum, event) => sum + (event.currentRSVP || 0), 0)
        
        setAnalytics(prev => ({
          ...prev,
          totalEvents: events.length,
          upcomingEvents: upcomingEvents.length,
          totalRSVPs: totalRSVPs,
          recentActivity: events
            .slice(0, 5)
            .map(event => ({
              type: 'event_created',
              title: `${event.category} event: ${event.title}`,
              time: event.createdAt,
              user: event.organizer?.clubName || event.organizer?.name
            }))
        }))
      }
      
      if (analyticsResponse?.success) {
        setAnalytics(prev => ({
          ...prev,
          ...analyticsResponse.data
        }))
      }
      
      // Load today's stats
      const today = new Date().toDateString()
      const todayEvents = eventsResponse.success ? 
        eventsResponse.data.events.filter(event => 
          new Date(event.createdAt).toDateString() === today
        ).length : 0
      
      setRealTimeStats({
        newEventsToday: todayEvents,
        newRSVPsToday: 0, // Would need separate API call
        activeNow: Math.floor(Math.random() * 50) + 10 // Placeholder
      })
      
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'event_created':
        return <FiCalendar className="w-4 h-4 text-green-400" />
      case 'rsvp':
        return <FiHeart className="w-4 h-4 text-red-400" />
      case 'comment':
        return <FiMessageCircle className="w-4 h-4 text-blue-400" />
      default:
        return <FiActivity className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiTrendingUp className="w-5 h-5 mr-2 text-green-400" />
          Event Analytics
        </h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/5 rounded-lg p-4 h-20"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-lg p-3 h-12"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <FiTrendingUp className="w-5 h-5 mr-2 text-green-400" />
          Event Analytics
          {isConnected && (
            <span className="ml-2 flex items-center text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
              Live
            </span>
          )}
        </h3>
        <button
          onClick={loadAnalytics}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Events</p>
              <p className="text-xl font-bold text-white">{analytics.totalEvents}</p>
            </div>
            <FiCalendar className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Upcoming</p>
              <p className="text-xl font-bold text-white">{analytics.upcomingEvents}</p>
            </div>
            <FiEye className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total RSVPs</p>
              <p className="text-xl font-bold text-white">{analytics.totalRSVPs}</p>
            </div>
            <FiHeart className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Active Now</p>
              <p className="text-xl font-bold text-white">{realTimeStats.activeNow}</p>
            </div>
            <FiUsers className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold mb-3 text-gray-300">Today's Activity</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{realTimeStats.newEventsToday}</p>
            <p className="text-xs text-gray-400">New Events</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{realTimeStats.newRSVPsToday}</p>
            <p className="text-xs text-gray-400">New RSVPs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{realTimeStats.activeNow}</p>
            <p className="text-xs text-gray-400">Users Online</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gray-300">Recent Activity</h4>
        <div className="space-y-3">
          {analytics.recentActivity.length > 0 ? (
            analytics.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.title}</p>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <span>{activity.user}</span>
                    <span className="mx-1">•</span>
                    <span>{formatTime(activity.time)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-400">
              <FiActivity className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Real-time analytics unavailable. Stats may not be current.
          </p>
        </div>
      )}
    </div>
  )
}

export default EventAnalytics