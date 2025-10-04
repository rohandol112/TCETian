import { useState, useEffect } from 'react'
import { 
  FiCalendar, 
  FiPlus, 
  FiClock, 
  FiMapPin, 
  FiUsers, 
  FiSearch, 
  FiFilter,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { eventService } from '../services/eventService.js'
import CreateEventModal from '../components/events/CreateEventModal'
import EventDetailsModal from '../components/events/EventDetailsModal'

const Events = () => {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const categories = [
    'all', 'Technical', 'Cultural', 'Sports', 'Workshop', 
    'Seminar', 'Competition', 'Social', 'Academic', 'Other'
  ]

  useEffect(() => {
    fetchEvents()
  }, [selectedCategory, searchTerm])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = {
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm }),
        upcoming: 'true',
        limit: 12
      }
      
      const response = await eventService.getEvents(params)
      setEvents(response.data.events)
    } catch (error) {
      showToast('Failed to fetch events', 'error')
      console.error('Fetch events error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async (eventId) => {
    if (!isAuthenticated) {
      showToast('Please login to RSVP', 'error')
      return
    }

    if (user?.role !== 'student') {
      showToast('Only students can RSVP to events', 'error')
      return
    }

    try {
      await eventService.rsvpEvent(eventId)
      showToast('RSVP successful!', 'success')
      fetchEvents() // Refresh events to update RSVP count
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleCancelRSVP = async (eventId) => {
    try {
      await eventService.cancelRSVP(eventId)
      showToast('RSVP cancelled', 'info')
      fetchEvents() // Refresh events
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

  const isUserRSVPd = (event) => {
    return event.rsvpUsers?.some(rsvp => 
      rsvp.user._id === user?.id && rsvp.status === 'confirmed'
    )
  }

  const handleEventClick = (eventId) => {
    setSelectedEventId(eventId)
    setShowDetailsModal(true)
  }

  const handleEventCreated = (newEvent) => {
    showToast('Event created successfully!', 'success')
    setShowCreateModal(false)
    fetchEvents() // Refresh events list
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Campus Events
            </h1>
            <p className="text-xl text-gray-300">
              Discover and join amazing events happening at TCET
            </p>
          </div>
          
          {/* Show Create Event button only for clubs */}
          {isAuthenticated && user?.role === 'club' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-gradient px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 mt-6 md:mt-0"
            >
              <FiPlus className="w-5 h-5" />
              <span>Create Event</span>
            </button>
          )}
        </div>



        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
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

          {/* Category Filter */}
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
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-4"></div>
                <div className="h-6 bg-white/20 rounded mb-3"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-white/20 rounded"></div>
                  <div className="h-3 bg-white/20 rounded"></div>
                  <div className="h-3 bg-white/20 rounded"></div>
                </div>
                <div className="h-10 bg-white/20 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Events Grid */}
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <div key={event._id} className="glass card-hover rounded-xl p-6 relative group">
                    {/* Club Actions (only for event organizer) */}
                    {isAuthenticated && user?.id === event.organizer._id && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                            <FiMoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {event.category}
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <FiEye className="w-4 h-4" />
                        <span>{event.viewCount}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>
                    
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
                        {event.organizer.clubName?.[0] || event.organizer.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.organizer.clubName || event.organizer.name}
                        </p>
                        {event.organizer.verified && (
                          <span className="text-xs text-green-400">✓ Verified</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    {isAuthenticated && user?.role === 'student' ? (
                      isUserRSVPd(event) ? (
                        <button 
                          onClick={() => handleCancelRSVP(event._id)}
                          className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-4 rounded-lg transition-all duration-200 border border-red-500/30"
                        >
                          Cancel RSVP
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRSVP(event._id)}
                          className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 px-4 rounded-lg transition-all duration-200 border border-green-500/30"
                          disabled={event.isFull}
                        >
                          {event.isFull ? 'Event Full' : 'RSVP Now'}
                        </button>
                      )
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
          </>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <CreateEventModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onEventCreated={handleEventCreated}
          />
        )}

        {/* Event Details Modal */}
        <EventDetailsModal
          eventId={selectedEventId}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedEventId(null)
          }}
          onEventUpdated={fetchEvents}
        />
      </div>
    </div>
  )
}

export default Events