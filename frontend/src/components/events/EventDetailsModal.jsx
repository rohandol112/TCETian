import { useState, useEffect } from 'react'
import { 
  FiX, FiCalendar, FiClock, FiMapPin, FiUsers, FiMail, FiPhone, 
  FiTag, FiCheckCircle, FiXCircle, FiEdit, FiTrash2, FiShare2 
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useSocket } from '../../context/SocketContext'
import { eventService } from '../../services/eventService'
import CreateEventModal from './CreateEventModal'


const EventDetailsModal = ({ eventId, isOpen, onClose, onEventUpdated }) => {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const { isConnected, socket } = useSocket()
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [attendees, setAttendees] = useState({
    confirmed: [],
    waitlist: [],
    stats: null
  })
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (isOpen && eventId) {
      loadEventDetails()
      
      // Join event room for real-time updates
      if (isConnected && socket) {
        socket.emit('join_event', eventId)
      }
    }

    return () => {
      // Leave event room when modal closes
      if (isConnected && socket && eventId) {
        socket.emit('leave_event', eventId)
      }
    }
  }, [isOpen, eventId, isConnected, socket])

  // Listen for real-time share updates
  useEffect(() => {
    if (!isConnected || !socket || !eventId) return

    const handleShareUpdate = (data) => {
      if (data.eventId === eventId) {
        setEvent(prevEvent => ({
          ...prevEvent,
          analytics: {
            ...prevEvent.analytics,
            shareCount: data.shareCount
          }
        }))
      }
    }

    const handleStatsUpdate = (data) => {
      if (data.eventId === eventId && data.type === 'share') {
        setEvent(prevEvent => ({
          ...prevEvent,
          analytics: {
            ...prevEvent.analytics,
            shareCount: data.shareCount
          }
        }))
      }
    }

    socket.on('event_share_update', handleShareUpdate)
    socket.on('event_stats_update', handleStatsUpdate)

    return () => {
      socket.off('event_share_update', handleShareUpdate)
      socket.off('event_stats_update', handleStatsUpdate)
    }
  }, [isConnected, socket, eventId])

  const loadEventDetails = async () => {
    setLoading(true)
    try {
      const response = await eventService.getEvent(eventId)
      if (response.success) {
        setEvent(response.data.event)
        
        // Load attendees if user is the organizer
        if (user?.id === response.data.event.organizer._id) {
          loadAttendees()
        }
      }
    } catch (error) {
      console.error('Error loading event details:', error)
      showToast('Failed to load event details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAttendees = async () => {
    try {
      setAttendeesLoading(true)
      const response = await eventService.getEventAttendees(eventId)
      if (response.success && response.data) {
        const { confirmed = [], waitlist = [], stats = null } = response.data
        setAttendees({ confirmed, waitlist, stats })
      } else {
        setAttendees({ confirmed: [], waitlist: [], stats: null })
      }
    } catch (error) {
      console.error('Error loading attendees:', error)
      setAttendees({ confirmed: [], waitlist: [], stats: null })
    }
    setAttendeesLoading(false)
  }

  const handleRSVP = async () => {
    if (!isAuthenticated) {
      showToast('Please login to RSVP', 'error')
      return
    }

    if (user?.role !== 'student') {
      showToast('Only students can RSVP to events', 'error')
      return
    }

    setRsvpLoading(true)
    try {
      await eventService.rsvpEvent(eventId)
      showToast('RSVP successful!', 'success')
      
      // Reload event details to update RSVP status
      loadEventDetails()
      
      // Emit WebSocket event for real-time updates
      if (isConnected && socket) {
        socket.emit('event_rsvp', {
          eventId,
          userId: user.id,
          userName: user.name,
          eventTitle: event.title
        })
      }
      
      if (onEventUpdated) onEventUpdated()
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleCancelRSVP = async () => {
    setRsvpLoading(true)
    try {
      await eventService.cancelRSVP(eventId)
      showToast('RSVP cancelled', 'info')
      
      // Reload event details
      loadEventDetails()
      
      // Emit WebSocket event
      if (isConnected && socket) {
        socket.emit('event_rsvp_cancelled', {
          eventId,
          userId: user.id,
          userName: user.name,
          eventTitle: event.title
        })
      }
      
      if (onEventUpdated) onEventUpdated()
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      await eventService.deleteEvent(eventId)
      showToast('Event deleted successfully', 'success')
      onClose()
      if (onEventUpdated) onEventUpdated()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleShareEvent = async () => {
    try {
      const response = await eventService.shareEvent(eventId)
      
      if (response.success) {
        const shareUrl = response.data.shareUrl
        
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        showToast('Event link copied to clipboard!', 'success')
        
        // Update share count locally
        if (event) {
          setEvent({
            ...event,
            shareCount: response.data.shareCount
          })
        }
        
        // Emit socket event
        if (isConnected && socket) {
          socket.emit('event_shared', {
            eventId,
            shareCount: response.data.shareCount
          })
        }
      }
    } catch (error) {
      showToast('Failed to share event', 'error')
    }
  }

  const handleEditEvent = () => {
    setShowEditModal(true)
  }

  const handleEventUpdated = async () => {
    await loadEventDetails()
    if (onEventUpdated) {
      onEventUpdated()
    }
    setShowEditModal(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const isUserRSVPd = () => {
    return event?.rsvpUsers?.some(rsvp => 
      (rsvp.user._id || rsvp.user) === user?.id && rsvp.status === 'confirmed'
    )
  }

  const getUserRSVPStatus = () => {
    // Use the backend-provided userRsvpStatus instead of parsing rsvpUsers
    return event?.userRsvpStatus || null
  }

  const isOrganizer = () => {
    return user?.id === event?.organizer._id
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative glass rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : event ? (
            <>
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {event.category}
                      </span>
                      {isConnected && (
                        <span className="flex items-center text-xs text-green-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                          Live
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{event.title}</h2>
                    <p className="text-gray-300">{event.description}</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Event Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="glass rounded-xl p-6">
                      <h3 className="text-xl font-semibold mb-4">Event Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <FiCalendar className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="font-medium">{formatDate(event.eventDate)}</p>
                            <p className="text-sm text-gray-400">Date</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FiClock className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="font-medium">{formatTime(event.eventDate)}</p>
                            <p className="text-sm text-gray-400">Time ({event.duration}h duration)</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FiMapPin className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="font-medium">{event.venue}</p>
                            <p className="text-sm text-gray-400">Venue</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FiUsers className="w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="font-medium">{event.currentRSVP || 0}/{event.capacity}</p>
                            <p className="text-sm text-gray-400">Registered</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Requirements & Tags */}
                    {(event.requirements?.length > 0 || event.tags?.length > 0) && (
                      <div className="glass rounded-xl p-6">
                        {event.requirements?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">Requirements</h4>
                            <ul className="space-y-1">
                              {event.requirements.map((req, index) => (
                                <li key={index} className="text-gray-300 text-sm flex items-start">
                                  <span className="text-purple-400 mr-2">•</span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {event.tags?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {event.tags.map((tag, index) => (
                                <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                                  <FiTag className="w-3 h-3 inline mr-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="glass rounded-xl p-6">
                      <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                      <div className="space-y-3">
                        {event.contactInfo?.email && (
                          <div className="flex items-center space-x-3">
                            <FiMail className="w-5 h-5 text-blue-400" />
                            <a href={`mailto:${event.contactInfo.email}`} className="text-blue-400 hover:underline">
                              {event.contactInfo.email}
                            </a>
                          </div>
                        )}
                        {event.contactInfo?.phone && (
                          <div className="flex items-center space-x-3">
                            <FiPhone className="w-5 h-5 text-green-400" />
                            <a href={`tel:${event.contactInfo.phone}`} className="text-green-400 hover:underline">
                              {event.contactInfo.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Organizer Info */}
                    <div className="glass rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Organized by</h3>
                      <div className="flex items-center space-x-3">
                        {event.organizer.profilePicture ? (
                          <img 
                            src={event.organizer.profilePicture} 
                            alt={event.organizer.clubName || event.organizer.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {(event.organizer.clubName || event.organizer.name)[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{event.organizer.clubName || event.organizer.name}</p>
                          {event.organizer.verified && (
                            <p className="text-sm text-green-400">✓ Verified Club</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {isAuthenticated ? (
                        isOrganizer() ? (
                          <>
                            <button 
                              onClick={handleEditEvent}
                              className="w-full btn-gradient py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                            >
                              <FiEdit className="w-5 h-5" />
                              <span>Edit Event</span>
                            </button>
                            <button 
                              onClick={handleDeleteEvent}
                              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 border border-red-500/30 transition-colors"
                            >
                              <FiTrash2 className="w-5 h-5" />
                              <span>Delete Event</span>
                            </button>
                          </>
                        ) : user?.role === 'student' ? (
                          getUserRSVPStatus() === 'confirmed' ? (
                            <div className="space-y-3">
                              <div className="w-full bg-blue-500/20 text-blue-400 py-3 rounded-xl border border-blue-500/30 flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold">You're Already RSVPd! ✓</span>
                              </div>
                              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                                <p className="text-blue-400 text-sm mb-2">🎉 You've successfully registered for this event!</p>
                                <p className="text-xs text-gray-400">Check your email for event updates and details.</p>
                              </div>
                              <button 
                                onClick={handleCancelRSVP}
                                disabled={rsvpLoading}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 border border-red-500/30 transition-colors disabled:opacity-50"
                              >
                                <FiXCircle className="w-5 h-5" />
                                <span>{rsvpLoading ? 'Cancelling...' : 'Cancel RSVP'}</span>
                              </button>
                            </div>
                          ) : getUserRSVPStatus() === 'waitlist' ? (
                            <div className="space-y-3">
                              <div className="w-full bg-yellow-500/20 text-yellow-400 py-3 rounded-xl border border-yellow-500/30 flex items-center justify-center space-x-2">
                                <FiClock className="w-5 h-5" />
                                <span className="font-semibold">You're on the Waitlist</span>
                              </div>
                              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                                <p className="text-yellow-400 text-sm mb-2">⏳ You'll be notified if a spot opens up!</p>
                                <p className="text-xs text-gray-400">Stay tuned for updates via email.</p>
                              </div>
                              <button 
                                onClick={handleCancelRSVP}
                                disabled={rsvpLoading}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 border border-red-500/30 transition-colors disabled:opacity-50"
                              >
                                <FiXCircle className="w-5 h-5" />
                                <span>{rsvpLoading ? 'Leaving...' : 'Leave Waitlist'}</span>
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={handleRSVP}
                              disabled={rsvpLoading}
                              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 border border-green-500/30 transition-colors disabled:opacity-50"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                              <span>
                                {rsvpLoading ? 'Processing...' : event.isFull ? 'Join Waitlist' : 'RSVP Now'}
                              </span>
                            </button>
                          )
                        ) : (
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                            <p className="text-yellow-400 text-sm">Only students can RSVP to events</p>
                          </div>
                        )
                      ) : (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                          <p className="text-blue-400 text-sm">Please login to RSVP</p>
                        </div>
                      )}

                      <button 
                        onClick={handleShareEvent}
                        className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors"
                      >
                        <FiShare2 className="w-5 h-5" />
                        <span>Share Event</span>
                      </button>
                    </div>

                    {/* Registration Deadline */}
                    {event.registrationDeadline && (
                      <div className="glass rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-1">Registration Deadline</p>
                        <p className="font-medium">
                          {formatDate(event.registrationDeadline)}
                          <span className="text-sm text-gray-400 ml-2">
                            {formatTime(event.registrationDeadline)}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Attendees (if organizer) */}
                    {isOrganizer() && (
                      <div className="glass rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Attendees</h3>
                          {attendees.stats && (
                            <span className="text-sm text-gray-400">
                              {attendees.stats.totalConfirmed} confirmed
                              {attendees.stats.totalWaitlist > 0 && ` · ${attendees.stats.totalWaitlist} waitlist`}
                            </span>
                          )}
                        </div>

                        {attendeesLoading ? (
                          <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                            Loading attendees...
                          </div>
                        ) : (
                          <>
                            {attendees.confirmed.length === 0 && attendees.waitlist.length === 0 ? (
                              <p className="text-sm text-gray-400">No attendees yet.</p>
                            ) : (
                              <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                                {attendees.confirmed.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center space-x-2">
                                      <FiCheckCircle className="w-4 h-4" />
                                      <span>Confirmed ({attendees.confirmed.length})</span>
                                    </h4>
                                    <div className="space-y-2">
                                      {attendees.confirmed.map((attendee, index) => (
                                        <div key={`confirmed-${index}`} className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                            {attendee.name?.charAt(0) || '?'}
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">{attendee.name}</p>
                                            <p className="text-xs text-gray-400">{attendee.email}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {attendees.waitlist.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center space-x-2">
                                      <FiClock className="w-4 h-4" />
                                      <span>Waitlist ({attendees.waitlist.length})</span>
                                    </h4>
                                    <div className="space-y-2">
                                      {attendees.waitlist.map((attendee, index) => (
                                        <div key={`waitlist-${index}`} className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                            {attendee.name?.charAt(0) || '?'}
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">{attendee.name}</p>
                                            <p className="text-xs text-gray-400">{attendee.email}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-400">Event not found</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Modal */}
      {event && (
        <CreateEventModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onEventCreated={handleEventUpdated}
          event={event}
        />
      )}
    </div>
  )
}

export default EventDetailsModal