import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../context/ToastContext'
import { eventService } from '../services/eventService'
import { createEventUtils } from '../utils/eventUtils'

export const useEventCreation = (onEventCreated, initialEvent = null) => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    eventDate: '',
    eventTime: '',
    duration: 2,
    venue: '',
    capacity: 50,
    registrationDeadline: '',
    registrationDeadlineTime: '',
    tags: '',
    requirements: '',
    contactEmail: user?.email || '',
    contactPhone: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const categories = [
    'Technical', 'Cultural', 'Sports', 'Workshop', 
    'Seminar', 'Competition', 'Social', 'Academic', 'Other'
  ]

  // Cache-busting helper
  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(window.localStorage)
      keys.forEach(key => {
        if (key.includes('event') || key.includes('Event')) {
          window.localStorage.removeItem(key)
        }
      })
    }
    return new Promise(resolve => setTimeout(resolve, 100))
  }, [])

  // Form validation using utility
  const validateForm = useCallback((data = formData) => {
    console.log('🔍 Validating form data:', data)
    
    const result = createEventUtils.validateEventData(data, !!initialEvent)
    
    console.log('✅ Validation result:', result)
    return result
  }, [formData, initialEvent])

  // Handle form submission
  const createEvent = useCallback(async () => {
    if (loading) return false

    console.log('🚀 Starting form submission...', formData)
    
    // Clear cache before validation
    await clearCache()

    // Validate form
    const { isValid, errors: validationErrors } = validateForm()
    
    if (!isValid) {
      console.error('❌ Form validation failed:', validationErrors)
      setErrors(validationErrors)
      showToast('Please fix the form errors before submitting', 'error')
      return false
    }

    setLoading(true)
    setErrors({})

    try {
      // Prepare submission data using utility
      const submissionData = createEventUtils.prepareSubmissionData(formData, user?.id)

      console.log('📤 Submitting event data:', submissionData)

      let result
      if (initialEvent?._id) {
        // Update existing event
        result = await eventService.updateEvent(initialEvent._id, submissionData)
        showToast('Event updated successfully!', 'success')
      } else {
        // Create new event
        result = await eventService.createEvent(submissionData)
        showToast('Event created successfully!', 'success')
      }

      console.log('✅ Event submission successful:', result)

      // Emit socket event for real-time updates
      if (socket && result && result.success) {
        const eventData = result.data?.event || result.data
        const eventType = initialEvent?._id ? 'event_updated' : 'broadcast_new_event'
        socket.emit(eventType, eventData)
      }

      // Clear form on success
      if (!initialEvent) {
        setFormData({
          title: '',
          description: '',
          category: 'academic',
          eventDate: '',
          eventTime: '',
          duration: 2,
          venue: '',
          capacity: 50,
          registrationDeadline: '',
          registrationDeadlineTime: '',
          tags: '',
          requirements: '',
          contactEmail: user?.email || '',
          contactPhone: ''
        })
      }

      setErrors({})

      // Clear cache after successful submission
      await clearCache()

      if (onEventCreated) {
        onEventCreated(result.data?.event || result.data)
      }

      return true

    } catch (error) {
      console.error('❌ Event submission error:', error)
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save event'
      showToast(errorMessage, 'error')
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
      
      return false
    } finally {
      setLoading(false)
    }
  }, [
    formData, 
    initialEvent, 
    loading, 
    validateForm, 
    clearCache, 
    socket, 
    showToast,
    user,
    onEventCreated
  ])

  // Update field helper
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      category: 'academic',
      eventDate: '',
      eventTime: '',
      duration: 2,
      venue: '',
      capacity: 50,
      registrationDeadline: '',
      registrationDeadlineTime: '',
      tags: '',
      requirements: '',
      contactEmail: user?.email || '',
      contactPhone: ''
    })
    setErrors({})
  }, [user])

  // Load initial data for editing
  useEffect(() => {
    if (initialEvent) {
      console.log('📥 Loading initial event data:', initialEvent)
      console.log('🕐 Original eventDate from DB:', initialEvent.eventDate)
      
      // Format dates for form inputs (avoiding timezone issues)
      let eventDate = ''
      let eventTime = ''
      
      if (initialEvent.eventDate) {
        const date = new Date(initialEvent.eventDate)
        // Use local date components to avoid timezone shifts
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        eventDate = `${year}-${month}-${day}`
        eventTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        
        console.log('🕐 Formatted eventDate:', { 
          original: initialEvent.eventDate, 
          parsed: date.toISOString(), 
          formatted: eventDate, 
          time: eventTime 
        })
      }
      
      let regDate = ''
      let regTime = ''
      
      if (initialEvent.registrationDeadline) {
        const date = new Date(initialEvent.registrationDeadline)
        // Use local date components to avoid timezone shifts
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        regDate = `${year}-${month}-${day}`
        regTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      
      setFormData({
        title: initialEvent.title || '',
        description: initialEvent.description || '',
        category: initialEvent.category || 'academic',
        eventDate,
        eventTime,
        duration: initialEvent.duration || 2,
        venue: initialEvent.venue || '',
        capacity: initialEvent.capacity || 50,
        registrationDeadline: regDate,
        registrationDeadlineTime: regTime,
        contactEmail: initialEvent.contactEmail || user?.email || '',
        contactPhone: initialEvent.contactPhone || '',
        tags: Array.isArray(initialEvent.tags) ? initialEvent.tags.join(', ') : initialEvent.tags || '',
        requirements: Array.isArray(initialEvent.requirements) ? initialEvent.requirements.join(', ') : initialEvent.requirements || ''
      })
    } else {
      // Set default contact email for new events
      setFormData(prev => ({
        ...prev,
        contactEmail: user?.email || ''
      }))
    }
  }, [initialEvent, user])

  return {
    formData,
    errors,
    loading,
    categories,
    isConnected,
    createEvent,
    updateField,
    resetForm,
    setFormData
  }
}

export default useEventCreation