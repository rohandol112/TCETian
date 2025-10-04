import { useState } from 'react'
import { FiX, FiImage, FiTag, FiType, FiLoader } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { postService } from '../../services/postService.js'

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [tags, setTags] = useState('')
  const [postType, setPostType] = useState('text')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user } = useAuth()
  const { showToast } = useToast()

  const categories = [
    'Academic', 'Events', 'Study Group', 'General', 
    'Placement', 'Sports', 'Culture', 'Tech'
  ]

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image size should be less than 5MB', 'error')
        return
      }
      
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      showToast('Post content is required', 'error')
      return
    }

    if (postType === 'image' && !image) {
      showToast('Please select an image', 'error')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      
      if (title.trim()) {
        formData.append('title', title.trim())
      }
      
      formData.append('content', content.trim())
      formData.append('category', category)
      formData.append('postType', postType)
      
      if (tags.trim()) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        formData.append('tags', JSON.stringify(tagArray))
      }
      
      if (image) {
        formData.append('image', image)
      }

      await postService.createPost(formData)
      
      showToast('Post created successfully!', 'success')
      onPostCreated()
      handleClose()
      
    } catch (error) {
      console.error('Create post error:', error)
      showToast(error.message || 'Failed to create post', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setCategory('General')
    setTags('')
    setPostType('text')
    setImage(null)
    setImagePreview('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-gradient">Create Post</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Post Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPostType('text')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                  postType === 'text'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <FiType className="w-5 h-5" />
                <span>Text Post</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('image')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                  postType === 'image'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <FiImage className="w-5 h-5" />
                <span>Image Post</span>
              </button>
            </div>
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a catchy title..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              maxLength={100}
            />
            <div className="text-xs text-gray-400 mt-1">
              {title.length}/100 characters
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your thoughts with the TCET community..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 resize-none"
              rows={6}
              maxLength={2000}
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              {content.length}/2000 characters
            </div>
          </div>

          {/* Image Upload */}
          {postType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image *
              </label>
              
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Drop an image here or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="btn-gradient px-6 py-3 rounded-lg font-semibold cursor-pointer inline-block"
                  >
                    Choose Image
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum file size: 5MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Category and Tags Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (Optional)
              </label>
              <div className="relative">
                <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Separate tags with commas
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">Posting Guidelines</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Be respectful and constructive</li>
              <li>• Keep content relevant to TCET community</li>
              <li>• No spam, hate speech, or inappropriate content</li>
              <li>• Use appropriate categories and tags</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-white/20 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gradient px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 min-w-[120px] justify-center"
              disabled={loading || !content.trim()}
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <span>Create Post</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal