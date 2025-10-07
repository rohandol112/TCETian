import { FiX, FiCalendar, FiClock, FiMapPin, FiUsers, FiTag, FiMail, FiPhone, FiWifi, FiWifiOff } from 'react-icons/fi'
import useEventCreation from '../../hooks/useEventCreation'

const CreateEventModal = ({ isOpen, onClose, onEventCreated, event = null }) => {
  const {
    formData,
    loading,
    errors,
    categories,
    isConnected,
    createEvent,
    updateField,
    resetForm
  } = useEventCreation(onEventCreated, event)

  const isEditing = Boolean(event)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    updateField(name, type === 'number' ? Number(value) : value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const success = await createEvent()
    if (success) {
      onClose()
    }
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Get local date to avoid timezone issues
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getMaxRegistrationDate = () => {
    // Registration deadline can't be after the event date
    if (formData.eventDate) {
      return formData.eventDate
    }
    // If no event date selected, allow up to 1 year from now
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    const year = maxDate.getFullYear()
    const month = String(maxDate.getMonth() + 1).padStart(2, '0')
    const day = String(maxDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const registrationTimeMax =
    formData.registrationDeadline &&
    formData.eventDate &&
    formData.registrationDeadline === formData.eventDate
      ? formData.eventTime || undefined
      : undefined

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative glass rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gradient">
                {event ? 'Edit Event' : 'Create New Event'}
              </h2>
              {isConnected && (
                <p className="text-sm text-green-400 mt-1">
                  🟢 Real-time broadcasting enabled
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none ${
                    errors.title ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                  }`}
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none ${
                    errors.description ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                  }`}
                  placeholder="Describe your event in detail..."
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className={`form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none ${
                    errors.category ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                  }`}
                >
                  <option value="" className="bg-gray-900">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-gray-900">
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Date & Time</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-gray-300 mb-2">
                    Event Date *
                  </label>
                  <input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    required
                    min={isEditing ? undefined : getTodayDate()}
                    value={formData.eventDate}
                    onChange={handleChange}
                    className={`form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none ${
                      errors.eventDate ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                    }`}
                  />
                  {errors.eventDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.eventDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="eventTime" className="block text-sm font-medium text-gray-300 mb-2">
                    Event Time *
                  </label>
                  <input
                    id="eventTime"
                    name="eventTime"
                    type="time"
                    required
                    value={formData.eventTime}
                    onChange={handleChange}
                    className={`form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none ${
                      errors.eventTime ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                    }`}
                  />
                  {errors.eventTime && (
                    <p className="text-red-400 text-sm mt-1">{errors.eventTime}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (hours) *
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  required
                  value={formData.duration}
                  onChange={handleChange}
                  className={`form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none ${
                    errors.duration ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                  }`}
                  placeholder="e.g., 2.5 for 2 hours 30 minutes"
                />
                {errors.duration && (
                  <p className="text-red-400 text-sm mt-1">{errors.duration}</p>
                )}
              </div>

              <div>
                <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-300 mb-2">
                  Registration Deadline *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    id="registrationDeadline"
                    name="registrationDeadline"
                    type="date"
                    required
                    min={isEditing ? undefined : getTodayDate()}
                    max={getMaxRegistrationDate()}
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                  />
                  <div>
                    <label htmlFor="registrationDeadlineTime" className="block text-sm font-medium text-gray-300 mb-2">
                      Time *
                    </label>
                    <input
                      id="registrationDeadlineTime"
                      name="registrationDeadlineTime"
                      type="time"
                      required
                      value={formData.registrationDeadlineTime}
                      onChange={handleChange}
                      min="00:00"
                      max={registrationTimeMax}
                      className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                </div>
                {errors.registrationDeadline && (
                  <p className="text-red-400 text-sm mt-1">{errors.registrationDeadline}</p>
                )}
                {errors.registrationDeadlineTime && (
                  <p className="text-red-400 text-sm mt-1">{errors.registrationDeadlineTime}</p>
                )}
              </div>
            </div>

            {/* Location & Capacity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Location & Capacity</h3>
              
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-300 mb-2">
                  Venue *
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  required
                  value={formData.venue}
                  onChange={handleChange}
                  className={`form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none ${
                    errors.venue ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                  }`}
                  placeholder="e.g., Seminar Hall 1, Engineering Block"
                />
                {errors.venue && (
                  <p className="text-red-400 text-sm mt-1">{errors.venue}</p>
                )}
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-300 mb-2">
                  Capacity *
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="5000"
                  required
                  value={formData.capacity}
                  onChange={handleChange}
                  className={`form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none ${
                    errors.capacity ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                  }`}
                  placeholder="Maximum number of attendees"
                />
                {errors.capacity && (
                  <p className="text-red-400 text-sm mt-1">{errors.capacity}</p>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Additional Information</h3>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleChange}
                  className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  placeholder="e.g., programming, workshop, networking"
                />
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-300 mb-2">
                  Requirements (comma-separated)
                </label>
                <input
                  id="requirements"
                  name="requirements"
                  type="text"
                  value={formData.requirements}
                  onChange={handleChange}
                  className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  placeholder="e.g., Laptop required, Prior knowledge of Python"
                />
              </div>


            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Email
                  </label>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className={`form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none ${
                      errors.contactEmail ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                    }`}
                    placeholder="event@club.com"
                  />
                  {errors.contactEmail && (
                    <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={`form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none ${
                      errors.contactPhone ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-purple-500'
                    }`}
                    placeholder="9876543210"
                  />
                  {errors.contactPhone && (
                    <p className="text-red-400 text-sm mt-1">{errors.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>{event ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <FiCalendar className="w-5 h-5" />
                    <span>{event ? 'Update Event' : 'Create Event'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateEventModal