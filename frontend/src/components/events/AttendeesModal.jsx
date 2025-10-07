import { useState, useEffect } from 'react'
import { FiX, FiUsers, FiUserCheck, FiClock, FiMail, FiUser } from 'react-icons/fi'
import { HiAcademicCap } from 'react-icons/hi'
import { eventService } from '../../services/eventService'
import { useToast } from '../../context/ToastContext'

const AttendeesModal = ({ eventId, eventTitle, isOpen, onClose }) => {
  const { showToast } = useToast()
  const [attendees, setAttendees] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('confirmed')

  useEffect(() => {
    if (isOpen && eventId) {
      fetchAttendees()
    }
  }, [isOpen, eventId])

  const fetchAttendees = async () => {
    try {
      setLoading(true)
      const response = await eventService.getEventAttendees(eventId)
      setAttendees(response.data)
    } catch (error) {
      showToast('Failed to fetch attendees', 'error')
      console.error('Fetch attendees error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-xl font-semibold text-white">Event Attendees</h2>
            <p className="text-gray-400 text-sm">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-300">Loading attendees...</span>
          </div>
        ) : attendees ? (
          <>
            {/* Stats Summary */}
            <div className="p-6 border-b border-white/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-500/20 p-4 rounded-lg border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiUserCheck className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300">Confirmed</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {attendees.stats.totalConfirmed}
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiClock className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-300">Waitlist</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {attendees.stats.totalWaitlist}
                  </div>
                </div>
                <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiUsers className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-300">Available</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {attendees.stats.availableSpots}
                  </div>
                </div>
                <div className="bg-gray-500/20 p-4 rounded-lg border border-gray-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiUser className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Capacity</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-300">
                    {attendees.stats.capacity}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/20">
              <button
                onClick={() => setActiveTab('confirmed')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'confirmed'
                    ? 'text-green-400 border-b-2 border-green-400 bg-green-500/10'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Confirmed ({attendees.stats.totalConfirmed})
              </button>
              <button
                onClick={() => setActiveTab('waitlist')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'waitlist'
                    ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-500/10'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Waitlist ({attendees.stats.totalWaitlist})
              </button>
            </div>

            {/* Attendees List */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'confirmed' ? (
                <div className="space-y-3">
                  {attendees.confirmed.length > 0 ? (
                    attendees.confirmed.map((attendee) => (
                      <div key={attendee._id} className="glass p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {attendee.name[0]}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{attendee.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <FiMail className="w-3 h-3" />
                                  <span>{attendee.studentId}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <HiAcademicCap className="w-3 h-3" />
                                  <span>{attendee.year} {attendee.branch}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-green-400 font-medium">Confirmed</div>
                            <div className="text-xs text-gray-400">
                              {formatDate(attendee.rsvpDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FiUserCheck className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <p>No confirmed attendees yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {attendees.waitlist.length > 0 ? (
                    attendees.waitlist.map((attendee) => (
                      <div key={attendee._id} className="glass p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {attendee.name[0]}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{attendee.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <FiMail className="w-3 h-3" />
                                  <span>{attendee.studentId}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <HiAcademicCap className="w-3 h-3" />
                                  <span>{attendee.year} {attendee.branch}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-yellow-400 font-medium">Waitlisted</div>
                            <div className="text-xs text-gray-400">
                              {formatDate(attendee.rsvpDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FiClock className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <p>No waitlisted attendees</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p>Failed to load attendees</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttendeesModal