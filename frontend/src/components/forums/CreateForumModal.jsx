import { useState } from 'react'
import { FiX, FiImage, FiGlobe, FiLock, FiInfo } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { forumService } from '../../services/forumService.js'

const CreateForumModal = ({ isOpen, onClose, onForumCreated }) => {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'General',
    tags: '',
    isPublic: true,
    allowPosts: true,
    requireApproval: false,
    allowImages: true,
    allowPolls: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  if (!isOpen) return null
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Auto-generate forum name from display name
    if (name === 'displayName') {
      const generatedName = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      
      setFormData(prev => ({
        ...prev,
        name: generatedName
      }))
    }
  }
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Forum name must be at least 3 characters'
    }
    
    if (!formData.displayName || formData.displayName.length < 3) {
      newErrors.displayName = 'Display name must be at least 3 characters'
    }
    
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setLoading(true)
      
      const forumData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        settings: {
          isPublic: formData.isPublic,
          allowPosts: formData.allowPosts,
          requireApproval: formData.requireApproval,
          allowImages: formData.allowImages,
          allowPolls: formData.allowPolls
        }
      }
      
      const response = await forumService.createForum(forumData)
      
      if (response.success) {
        onForumCreated(response.data.forum)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating forum:', error)
      if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error')
      } else {
        showToast('Failed to create forum', 'error')
      }
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      category: 'General',
      tags: '',
      isPublic: true,
      allowPosts: true,
      requireApproval: false,
      allowImages: true,
      allowPolls: true
    })
    setErrors({})
  }
  
  const handleClose = () => {
    resetForm()
    onClose()
  }
  
  const categories = [
    'Academic',
    'Technology', 
    'Sports',
    'Arts',
    'General',
    'Events',
    'Career',
    'Entertainment'
  ]
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-gradient">Create New Forum</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Forum Display Name *
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="e.g., Computer Science Hub"
              className={`form-input w-full ${errors.displayName ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.displayName && (
              <p className="text-red-400 text-sm mt-1">{errors.displayName}</p>
            )}
          </div>
          
          {/* Forum Name (URL) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Forum Name (URL) *
            </label>
            <div className="flex items-center">
              <span className="text-gray-400 mr-1">r/</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="computer-science-hub"
                className={`form-input flex-1 ${errors.name ? 'border-red-500' : ''}`}
                maxLength={50}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This will be your forum's URL: /forums/{formData.name}
            </p>
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this forum is about..."
              rows={4}
              className={`form-input w-full resize-none ${errors.description ? 'border-red-500' : ''}`}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-red-400 text-sm">{errors.description}</p>
              ) : (
                <p className="text-xs text-gray-400">
                  Explain the purpose and rules of your forum
                </p>
              )}
              <span className="text-xs text-gray-400">
                {formData.description.length}/500
              </span>
            </div>
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input w-full"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (Optional)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="programming, javascript, web-dev"
              className="form-input w-full"
            />
            <p className="text-xs text-gray-400 mt-1">
              Separate tags with commas. These help users discover your forum.
            </p>
          </div>
          
          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiInfo className="w-4 h-4" />
              Forum Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Privacy */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.isPublic}
                    onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex items-center gap-2">
                    <FiGlobe className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white">Public</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!formData.isPublic}
                    onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex items-center gap-2">
                    <FiLock className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-white">Private</span>
                  </div>
                </label>
              </div>
              
              {/* Features */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowPosts"
                    checked={formData.allowPosts}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-white">Allow Posts</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowImages"
                    checked={formData.allowImages}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-white">Allow Images</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireApproval"
                    checked={formData.requireApproval}
                    onChange={handleChange}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-white">Require Post Approval</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-gradient px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Forum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateForumModal