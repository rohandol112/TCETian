import { FiX, FiCalendar, FiClock, FiMapPin, FiUsers, FiTag, FiImage, FiMail, FiPhone, FiWifi, FiWifiOff } from 'react-icons/fi'
import useEventCreation from '../../hooks/useEventCreation'

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
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
    return tomorrow.toISOString().split('T')[0]
  }

  const getMinRegistrationDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative glass rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gradient">Create New Event</h2>
              {isConnected && (
                <p className="text-sm text-green-400 mt-1">
                  🟢 Real-time broadcasting enabled
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-white/20 pb-2">Basic Information</h3>
              
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
                  className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none"
                  placeholder="Describe your event..."
                />
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
                  className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                >
                  <option value="" className="bg-gray-900">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-gray-900">
                      {category}
                    </option>
                  ))}
                </select>
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
                    min={getTomorrowDate()}
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                  />
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
                    className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                  />
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
                  className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-300 mb-2">
                  Registration Deadline *
                </label>
                <input
                  id="registrationDeadline"
                  name="registrationDeadline"
                  type="date"
                  required
                  min={getMinRegistrationDate()}
                  max={formData.eventDate}
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                />
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
                  className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  placeholder="Enter event venue"
                />
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
                  className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                />
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Event Poster
                </label>
                
                {/* Image Upload/URL Toggle */}
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => updateField('imageInputType', 'upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.imageInputType === 'upload'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <FiImage className="w-4 h-4 inline mr-2" />
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('imageInputType', 'url')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.imageInputType === 'url'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    🔗 Image URL
                  </button>
                </div>

                {/* Upload Input */}
                {formData.imageInputType === 'upload' && (
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateField('posterFile', e.target.files[0])}
                      className="hidden"
                      id="posterUpload"
                    />
                    <label htmlFor="posterUpload" className="cursor-pointer">
                      <FiImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        {formData.posterFile ? formData.posterFile.name : 'Click to upload poster (Max 5MB)'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 5MB</p>
                    </label>
                  </div>
                )}

                {/* URL Input */}
                {formData.imageInputType === 'url' && (
                  <input
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                    placeholder="https://example.com/poster.jpg"
                  />
                )}

                {/* Image Preview */}
                {(formData.imageUrl || formData.posterFile) && (
                  <div className="mt-3">
                    <img
                      src={formData.posterFile ? URL.createObjectURL(formData.posterFile) : formData.imageUrl}
                      alt="Event poster preview"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {errors.image && (
                  <p className="text-red-400 text-sm mt-2">{errors.image}</p>
                )}
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
                    className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                    placeholder="event@club.com"
                  />
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
                    className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                    placeholder="1234567890"
                  />
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
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FiCalendar className="w-5 h-5" />
                    <span>Create Event</span>
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