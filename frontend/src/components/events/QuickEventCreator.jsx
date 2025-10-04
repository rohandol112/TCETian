import { useState } from 'react'
import { FiPlus, FiCalendar, FiUsers, FiClock, FiMapPin, FiWifi, FiWifiOff } from 'react-icons/fi'
import useEventCreation from '../../hooks/useEventCreation'

const QuickEventCreator = ({ onEventCreated }) => {
  const [showFullForm, setShowFullForm] = useState(false)
  const {
    formData,
    loading,
    errors,
    categories,
    isConnected,
    createEvent,
    updateField,
    resetForm
  } = useEventCreation(onEventCreated)

  const handleQuickCreate = async (e) => {
    e.preventDefault()
    
    // Set default values for quick creation
    if (!formData.eventDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      updateField('eventDate', tomorrow.toISOString().split('T')[0])
    }
    
    if (!formData.eventTime) {
      updateField('eventTime', '14:00')
    }
    
    const success = await createEvent()
    if (success) {
      setShowFullForm(false)
      resetForm()
    }
  }

  if (showFullForm) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gradient">Quick Event Creation</h3>
            <div className="flex items-center mt-2">
              {isConnected ? (
                <div className="flex items-center text-green-400 text-sm">
                  <FiWifi className="w-4 h-4 mr-2" />
                  Real-time sync enabled
                </div>
              ) : (
                <div className="flex items-center text-yellow-400 text-sm">
                  <FiWifiOff className="w-4 h-4 mr-2" />
                  Offline mode
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setShowFullForm(false)
              resetForm()
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleQuickCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.title ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="Enter event title"
              required
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-white/20'
              }`}
              rows="3"
              placeholder="Describe your event..."
              required
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={`w-full p-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.category ? 'border-red-500' : 'border-white/20'
                }`}
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Venue *</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => updateField('venue', e.target.value)}
                className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.venue ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="Event venue"
                required
              />
              {errors.venue && <p className="text-red-400 text-sm mt-1">{errors.venue}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => updateField('eventDate', e.target.value)}
                className={`w-full p-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.eventDate ? 'border-red-500' : 'border-white/20'
                }`}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {errors.eventDate && <p className="text-red-400 text-sm mt-1">{errors.eventDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time *</label>
              <input
                type="time"
                value={formData.eventTime}
                onChange={(e) => updateField('eventTime', e.target.value)}
                className={`w-full p-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.eventTime ? 'border-red-500' : 'border-white/20'
                }`}
                required
              />
              {errors.eventTime && <p className="text-red-400 text-sm mt-1">{errors.eventTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Capacity *</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => updateField('capacity', parseInt(e.target.value))}
                className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.capacity ? 'border-red-500' : 'border-white/20'
                }`}
                min="1"
                max="1000"
                placeholder="50"
                required
              />
              {errors.capacity && <p className="text-red-400 text-sm mt-1">{errors.capacity}</p>}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FiPlus className="w-4 h-4" />
                  <span>Create Event</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setShowFullForm(false)
                resetForm()
              }}
              className="px-6 py-3 border border-white/20 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCalendar className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">Create New Event</h3>
        <p className="text-gray-400 mb-6">
          Create and broadcast events in real-time to the entire campus
        </p>

        <div className="flex items-center justify-center mb-6">
          {isConnected ? (
            <div className="flex items-center text-green-400 text-sm">
              <FiWifi className="w-4 h-4 mr-2" />
              Connected - Real-time sync enabled
            </div>
          ) : (
            <div className="flex items-center text-yellow-400 text-sm">
              <FiWifiOff className="w-4 h-4 mr-2" />
              Offline - Events will sync when connected
            </div>
          )}
        </div>

        <button
          onClick={() => setShowFullForm(true)}
          className="btn-gradient px-8 py-3 rounded-xl font-semibold flex items-center space-x-2 mx-auto"
        >
          <FiPlus className="w-5 h-5" />
          <span>Create Event</span>
        </button>

        <div className="grid grid-cols-3 gap-4 mt-6 text-sm text-gray-400">
          <div className="flex flex-col items-center">
            <FiUsers className="w-5 h-5 mb-1 text-purple-400" />
            <span>Real-time RSVPs</span>
          </div>
          <div className="flex flex-col items-center">
            <FiClock className="w-5 h-5 mb-1 text-blue-400" />
            <span>Live Updates</span>
          </div>
          <div className="flex flex-col items-center">
            <FiMapPin className="w-5 h-5 mb-1 text-green-400" />
            <span>Campus Wide</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickEventCreator