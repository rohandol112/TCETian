import { useState, useEffect } from 'react'
import { 
  FiCalendar, 
  FiPlus, 
  FiClock, 
  FiMapPin, 
  FiUsers, 
  FiSearch, 
  FiFilter,
  FiEdit,
  FiEye,
  FiUserCheck
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useSocket } from '../context/SocketContext'
import { eventService } from '../services/ev                  ) : null}
                </div>
              </div>e.js'
import CreateEventModal from '../components/events/CreateEventModal'
import EventDetailsModal from '../components/events/EventDetailsModal'
import AttendeesModal from '../components/events/AttendeesModal'
import CacheClearButton from '../components/CacheClearButton'

const Events = () => {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const { isConnected, socket } = useSocket()
  
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAttendeesModal, setShowAttendeesModal] = useState(false)
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState(null)
  const [attendees, setAttendees] = useState({})
  const [editingEvent, setEditingEvent] = useState(null)

  const categories = [
    'all', 'Technical', 'Cultural', 'Sports', 'Workshop', 
    'Seminar', 'Competition', 'Social', 'Academic', 'Other'
  ]

  useEffect(() => {
    fetchEvents()
  }, [selectedCategory, searchTerm, showPastEvents])

  const fetchEvents = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      const params = {
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
        upcoming: showPastEvents ? 'false' : 'true',
        limit: 12,
        ...(forceRefresh && { _t: Date.now() })
      }
      
      const response = await eventService.getEvents(params)
      
      if (response?.success && response?.data?.events) {
        setEvents(response.data.events)
      } else {
        setEvents([])
      }
    } catch (error) {
      showToast('Failed to fetch events', 'error')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async (eventId) => {
    if (!isAuthenticated) {
      showToast('Please login to RSVP', 'error')
      return
    }

    try {
      await eventService.rsvpEvent(eventId)
      showToast('RSVP successful!', 'success')
      fetchEvents()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleCancelRSVP = async (eventId) => {
    try {
      await eventService.cancelRSVP(eventId)
      showToast('RSVP cancelled', 'info')
      fetchEvents()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUserRSVPStatus = (event) => {
    return event.userRsvpStatus || null
  }

  const handleEventClick = (eventId) => {
    setSelectedEventId(eventId)
    setShowDetailsModal(true)
  }

  const handleManageEvent = async (event) => {
    try {
      const response = await eventService.getEvent(event._id)
      
      if (response.success && response.data.event) {
        setEditingEvent(response.data.event)
        setShowCreateModal(true)
      } else {
        showToast('Failed to load event details', 'error')
      }
    } catch (error) {
      showToast('Failed to load event details', 'error')
    }
  }

  const handleEventCreated = (newEvent) => {
    showToast(editingEvent ? 'Event updated successfully!' : 'Event created successfully!', 'success')
    setShowCreateModal(false)
    setEditingEvent(null)
    fetchEvents(true)
  }

  const handleViewAttendees = (event) => {
    setSelectedEventForAttendees(event)
    setShowAttendeesModal(true)
  }

  // Check if user is the organizer of the event
  const isEventOrganizer = (event) => {
    if (!user || !event.organizer) return false
    
    // Debug log to see what we're comparing
    console.log('🔍 Checking organizer:', {
      userId: user.id || user._id,
      organizerId: event.organizer._id || event.organizer.id,
      userRole: user.role
    })
    
    return user.id === event.organizer._id || 
           user.id === event.organizer.id || 
           user._id === event.organizer._id || 
           user._id === event.organizer.id
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Campus Events
              {isAuthenticated && user?.role === 'club' && (
                <span className="text-2xl text-purple-400 ml-4">& Management</span>
              )}
            </h1>
            <p className="text-xl text-gray-300">
              {isAuthenticated && user?.role === 'club' 
                ? "Create, manage, and track your events. View RSVPs and analytics in real-time."
                : "Discover and join amazing events happening at TCET"
              }
            </p>
          </div>
          
          {/* Show Create Event button only for clubs */}
          {isAuthenticated && user?.role === 'club' && (
            <div className="flex items-center space-x-3 mt-6 md:mt-0">
              <CacheClearButton />
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>Create Event</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none min-w-[150px]"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-gray-900">
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPastEvents(!showPastEvents)}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                showPastEvents 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
              }`}
            >
              <FiClock className="w-4 h-4" />
              <span>{showPastEvents ? 'Past Events' : 'Upcoming Only'}</span>
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-4"></div>
                <div className="h-6 bg-white/20 rounded mb-3"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-white/20 rounded"></div>
                  <div className="h-3 bg-white/20 rounded"></div>
                </div>
                <div className="h-10 bg-white/20 rounded"></div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event._id} className="glass card-hover rounded-xl p-6 relative">
                
                {/* Event Content */}
                <div className="flex items-start justify-between mb-4">
                  <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {event.category}
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <FiEye className="w-4 h-4" />
                    <span>{event.viewCount || 0}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{event.description}</p>
                
                <div className="space-y-2 text-gray-300 text-sm mb-6">
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="w-4 h-4" />
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiClock className="w-4 h-4" />
                    <span>{event.eventTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiMapPin className="w-4 h-4" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiUsers className="w-4 h-4" />
                    <span>{event.currentRSVP || 0}/{event.capacity} attending</span>
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="flex items-center space-x-2 mb-4 p-2 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold">
                    {event.organizer?.clubName?.[0] || event.organizer?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {event.organizer?.clubName || event.organizer?.name || 'Unknown'}
                    </p>
                    {event.organizer?.verified && (
                      <span className="text-xs text-green-400">✓ Verified</span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* View Details Button - Always visible */}
                  <button 
                    onClick={() => {
                      setSelectedEventId(event._id)
                      setShowDetailsModal(true)
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-all duration-200 border border-white/20 flex items-center justify-center space-x-2 font-medium"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>View Details & Share</span>
                  </button>

                  {/* Role-specific buttons */}
                  {isAuthenticated && user?.role === 'student' ? (
                    (() => {
                      const rsvpStatus = getUserRSVPStatus(event)
                      
                      if (rsvpStatus === 'confirmed') {
                        return (
                          <div className="space-y-2">
                            <div className="w-full bg-blue-500/20 text-blue-400 py-2 px-4 rounded-lg border border-blue-500/30 flex items-center justify-center space-x-2">
                              <span className="font-semibold">Already RSVPd ✓</span>
                            </div>
                            <button 
                              onClick={() => handleCancelRSVP(event._id)}
                              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-4 rounded-lg transition-all duration-200 border border-red-500/30 text-sm"
                            >
                              Cancel RSVP
                            </button>
                          </div>
                        )
                      } else if (rsvpStatus === 'waitlist') {
                        return (
                          <div className="space-y-2">
                            <div className="w-full bg-yellow-500/20 text-yellow-400 py-2 px-4 rounded-lg border border-yellow-500/30 flex items-center justify-center space-x-2">
                              <FiClock className="w-4 h-4" />
                              <span className="font-semibold">On Waitlist</span>
                            </div>
                            <button 
                              onClick={() => handleCancelRSVP(event._id)}
                              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-4 rounded-lg transition-all duration-200 border border-red-500/30 text-sm"
                            >
                              Leave Waitlist
                            </button>
                          </div>
                        )
                      } else {
                        return (
                          <button 
                            onClick={() => handleRSVP(event._id)}
                            className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 px-4 rounded-lg transition-all duration-200 border border-green-500/30 flex items-center justify-center space-x-2"
                          >
                            <FiUsers className="w-4 h-4" />
                            <span>RSVP Now</span>
                          </button>
                        )
                      }
                    })()
                  ) : isAuthenticated && user?.role === 'club' && isEventOrganizer(event) ? (
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleViewAttendees(event)}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 px-4 rounded-lg transition-all duration-200 border border-blue-500/30 flex items-center justify-center space-x-2 font-medium"
                    >
                      <FiUserCheck className="w-5 h-5" />
                      <span>
                        View RSVPs ({(event.currentRSVP || 0) + (event.waitlistCount || 0)})
                      </span>
                    </button>
                    <button 
                      onClick={() => handleManageEvent(event)}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 px-4 rounded-lg transition-all duration-200 border border-purple-500/30 flex items-center justify-center space-x-2 font-medium"
                    >
                      <FiEdit className="w-5 h-5" />
                      <span>Manage Event</span>
                    </button>
                  </div>
                ) : isAuthenticated && user?.role === 'club' ? (
                  // Show for all club users temporarily for debugging
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 mb-2">
                      Debug: User {user.id || user._id} vs Organizer {event.organizer?._id || event.organizer?.id}
                    </div>
                    <button 
                      onClick={() => handleViewAttendees(event)}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 px-4 rounded-lg transition-all duration-200 border border-blue-500/30 flex items-center justify-center space-x-2 font-medium"
                    >
                      <FiUserCheck className="w-5 h-5" />
                      <span>
                        View RSVPs ({(event.currentRSVP || 0) + (event.waitlistCount || 0)})
                      </span>
                    </button>
                    <button 
                      onClick={() => handleManageEvent(event)}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 px-4 rounded-lg transition-all duration-200 border border-purple-500/30 flex items-center justify-center space-x-2 font-medium"
                    >
                      <FiEdit className="w-5 h-5" />
                      <span>Manage Event</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleEventClick(event._id)}
                    className="w-full bg-white/10 hover:bg-white/20 py-2 px-4 rounded-lg transition-all duration-200"
                  >
                    View Details
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No events found</h3>
            <p className="text-gray-400">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Check back later for upcoming events'
              }
            </p>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateEventModal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setEditingEvent(null)
            }}
            onEventCreated={handleEventCreated}
            event={editingEvent}
          />
        )}

        <EventDetailsModal
          eventId={selectedEventId}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedEventId(null)
          }}
          onEventUpdated={fetchEvents}
        />

        <AttendeesModal
          eventId={selectedEventForAttendees?._id}
          eventTitle={selectedEventForAttendees?.title}
          isOpen={showAttendeesModal}
          onClose={() => {
            setShowAttendeesModal(false)
            setSelectedEventForAttendees(null)
          }}
        />
      </div>
    </div>
  )
}

export default Events