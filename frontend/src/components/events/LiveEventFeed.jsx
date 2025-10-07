import { useState, useEffect } from 'react'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiHeart } from 'react-icons/fi'
import { eventService } from '../../services/eventService'

const LiveEventFeed = ({ onEventClick, maxEvents = 5 }) => {
  const { isConnected, onNewEvent, onEventUpdate, socket } = useSocket()
  const { showToast } = useToast()
  const [liveEvents, setLiveEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial recent events
    loadRecentEvents()
  }, [])

  useEffect(() => {
    if (isConnected) {
      // Join events feed for real-time updates
      socket?.emit('join_events_feed')
      
      // Listen for new events
      const unsubscribeNewEvent = onNewEvent((eventData) => {
        const normalizedEvent = {
          ...eventData
        }
        
        setLiveEvents(prev => {
          // Add new event to the top and limit to maxEvents
          const newEvents = [
            {
              ...normalizedEvent,
              isNew: true,
              createdAt: new Date().toISOString()
            },
            ...prev.filter(e => e.eventId !== normalizedEvent.eventId)
          ].slice(0, maxEvents)
          
          return newEvents
        })
        
        // Show toast notification
        showToast(`New ${normalizedEvent.category} event: ${normalizedEvent.title}`, 'info')
      })

      // Listen for event updates
      const unsubscribeEventUpdate = onEventUpdate((updateData) => {
        
        setLiveEvents(prev =>
          prev.map(event =>
            event.eventId === updateData.eventId
              ? { ...event, ...updateData, isUpdated: true }
              : event
          )
        )
      })

      return () => {
        socket?.emit('leave_events_feed')
        unsubscribeNewEvent()
        unsubscribeEventUpdate()
      }
    }
  }, [isConnected, socket, onNewEvent, onEventUpdate, maxEvents])

  const loadRecentEvents = async () => {
    try {
      setLoading(true)
      const response = await eventService.getEvents({
        upcoming: true,
        limit: maxEvents,
        page: 1
      })
      
      if (response.success) {
        const formattedEvents = response.data.events.map(event => ({
          eventId: event._id,
          title: event.title,
          category: event.category,
          eventDate: event.eventDate,
          venue: event.venue,
          capacity: event.capacity,
          currentRSVP: event.currentRSVP || 0,
          organizer: {
            name: event.organizer?.clubName || event.organizer?.name,
            id: event.organizer?._id
          },
          createdAt: event.createdAt
        }))
        
        setLiveEvents(formattedEvents)
      }
    } catch (error) {
      console.error('Error loading recent events:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays <= 7) return `${diffDays} days`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Technical': 'text-blue-400 bg-blue-500/20',
      'Cultural': 'text-purple-400 bg-purple-500/20',
      'Sports': 'text-green-400 bg-green-500/20',
      'Workshop': 'text-yellow-400 bg-yellow-500/20',
      'Seminar': 'text-cyan-400 bg-cyan-500/20',
      'Competition': 'text-red-400 bg-red-500/20',
      'Social': 'text-pink-400 bg-pink-500/20',
      'Academic': 'text-indigo-400 bg-indigo-500/20',
      'Other': 'text-gray-400 bg-gray-500/20'
    }
    return colors[category] || colors['Other']
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiCalendar className="w-5 h-5 mr-2 text-purple-400" />
          Live Event Feed
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white/5 rounded-lg p-4 h-20"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FiCalendar className="w-5 h-5 mr-2 text-purple-400" />
          Live Event Feed
          {isConnected && (
            <span className="ml-2 flex items-center text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
              Live
            </span>
          )}
        </h3>
        <button
          onClick={loadRecentEvents}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {liveEvents.length > 0 ? (
          liveEvents.map((event, index) => (
            <div
              key={`${event.eventId}-${index}`}
              onClick={() => onEventClick?.(event.eventId)}
              className={`p-4 rounded-lg border transition-all duration-500 cursor-pointer hover:border-purple-500/50 ${
                event.isNew 
                  ? 'border-green-500/50 bg-green-500/10 animate-pulse' 
                  : event.isUpdated
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <FiCalendar className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-white truncate text-sm">
                      {event.title}
                      {event.isNew && (
                        <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          NEW
                        </span>
                      )}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-400 mt-2 space-x-4">
                    <div className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      {formatEventDate(event.eventDate)} • {formatTime(event.eventDate)}
                    </div>
                    <div className="flex items-center">
                      <FiMapPin className="w-3 h-3 mr-1" />
                      {event.venue}
                    </div>
                    <div className="flex items-center">
                      <FiUsers className="w-3 h-3 mr-1" />
                      {event.currentRSVP}/{event.capacity}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      by {event.organizer?.name}
                    </p>
                    {event.isNew && (
                      <div className="flex items-center text-green-400 text-xs">
                        <FiHeart className="w-3 h-3 mr-1" />
                        Just created!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FiCalendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No recent events</p>
            <p className="text-sm">New events will appear here in real-time</p>
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Real-time updates unavailable. Events may not appear instantly.
          </p>
        </div>
      )}
    </div>
  )
}

export default LiveEventFeed