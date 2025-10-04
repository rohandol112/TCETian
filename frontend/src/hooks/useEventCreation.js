import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { eventService } from '../services/eventService'

export const useEventCreation = (onEventCreated) => {
  const { showToast } = useToast()
  const { user } = useAuth()
  const { isConnected, socket } = useSocket()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    eventDate: '',
    eventTime: '',
    duration: 2,
    venue: '',
    capacity: 50,
    registrationDeadline: '',
    tags: '',
    imageUrl: '',
    imageInputType: 'url',
    posterFile: null,
    requirements: '',
    contactEmail: user?.email || '',
    contactPhone: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const categories = [
    'Technical', 'Cultural', 'Sports', 'Workshop', 
    'Seminar', 'Competition', 'Social', 'Academic', 'Other'
  ]

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) newErrors.title = 'Event title is required'
    if (!formData.description.trim()) newErrors.description = 'Event description is required'
    if (!formData.category) newErrors.category = 'Event category is required'
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required'
    if (!formData.eventTime) newErrors.eventTime = 'Event time is required'
    if (!formData.venue.trim()) newErrors.venue = 'Event venue is required'
    if (formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1'
    
    // Check if event date is in the future
    const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime}`)
    if (eventDateTime <= new Date()) {
      newErrors.eventDate = 'Event must be scheduled for a future date and time'
    }
    
    // Check registration deadline
    if (formData.registrationDeadline) {
      const deadlineDate = new Date(formData.registrationDeadline)
      if (deadlineDate >= eventDateTime) {
        newErrors.registrationDeadline = 'Registration deadline must be before the event date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createEvent = async (additionalData = {}) => {
    if (!validateForm()) {
      showToast('Please fix the form errors', 'error')
      return false
    }

    if (user?.role !== 'club') {
      showToast('Only clubs can create events', 'error')
      return false
    }

    setLoading(true)
    
    try {
      // Create FormData for file upload support
      const submitData = new FormData()
      
      // Add all form fields
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('category', formData.category)
      submitData.append('eventDate', formData.eventDate)
      submitData.append('eventTime', formData.eventTime)
      submitData.append('duration', formData.duration)
      submitData.append('venue', formData.venue)
      submitData.append('capacity', formData.capacity)
      submitData.append('registrationDeadline', formData.registrationDeadline)
      submitData.append('contactEmail', formData.contactEmail || user.email)
      submitData.append('contactPhone', formData.contactPhone)
      
      // Handle tags and requirements
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      const requirements = formData.requirements.split(',').map(req => req.trim()).filter(req => req)
      submitData.append('tags', JSON.stringify(tags))
      submitData.append('requirements', JSON.stringify(requirements))
      
      // Handle image
      if (formData.imageInputType === 'upload' && formData.posterFile) {
        submitData.append('poster', formData.posterFile)
      } else if (formData.imageInputType === 'url' && formData.imageUrl) {
        submitData.append('imageUrl', formData.imageUrl)
      }

      // Add additional data
      Object.keys(additionalData).forEach(key => {
        submitData.append(key, additionalData[key])
      })

      console.log('Creating event with WebSocket connection:', isConnected)

      // Create event via API
      const response = await eventService.createEvent(submitData)
      
      if (response.success) {
        const newEvent = response.data.event

        // Real-time WebSocket broadcasting
        if (isConnected && socket) {
          console.log('Broadcasting new event via WebSocket:', newEvent._id)
          
          // Broadcast to all users in events feed
          socket.emit('broadcast_new_event', {
            eventId: newEvent._id,
            title: newEvent.title,
            category: newEvent.category,
            organizer: {
              name: user.clubName || user.name,
              id: user.id
            },
            eventDate: newEvent.eventDate,
            venue: newEvent.venue,
            capacity: newEvent.capacity,
            imageUrl: newEvent.imageUrl,
            timestamp: new Date().toISOString()
          })

          // Join the new event room for real-time updates
          socket.emit('join_event', newEvent._id)
          
          // Update analytics in real-time
          socket.emit('update_analytics', {
            type: 'event_created',
            eventId: newEvent._id,
            clubId: user.id
          })
        }

        showToast('Event created successfully! 🎉', 'success')
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          eventDate: '',
          eventTime: '',
          duration: 2,
          venue: '',
          capacity: 50,
          registrationDeadline: '',
          tags: '',
          imageUrl: '',
          requirements: '',
          contactEmail: user?.email || '',
          contactPhone: ''
        })
        setErrors({})
        
        // Call callback if provided
        if (onEventCreated) {
          onEventCreated(newEvent)
        }
        
        return true
      } else {
        throw new Error(response.message || 'Failed to create event')
      }
    } catch (error) {
      console.error('Event creation error:', error)
      showToast(error.message || 'Failed to create event', 'error')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      eventDate: '',
      eventTime: '',
      duration: 2,
      venue: '',
      capacity: 50,
      registrationDeadline: '',
      tags: '',
      imageUrl: '',
      requirements: '',
      contactEmail: user?.email || '',
      contactPhone: ''
    })
    setErrors({})
  }

  return {
    formData,
    loading,
    errors,
    categories,
    isConnected,
    createEvent,
    updateField,
    resetForm,
    setFormData
  }
}

export default useEventCreation