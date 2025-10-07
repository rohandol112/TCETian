// Simplified and reliable event creation utility
export const createEventUtils = {
  // Create proper date-time combination
  combineDateTime: (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null
    
    try {
      // Parse date components
      const [year, month, day] = dateStr.split('-').map(Number)
      const [hours, minutes] = timeStr.split(':').map(Number)
      
      // Create date in local timezone
      const combined = new Date(year, month - 1, day, hours, minutes)
      
      return Number.isNaN(combined.getTime()) ? null : combined
    } catch (error) {
      console.error('Date combination error:', error)
      return null
    }
  },

  // Validate event data
  validateEventData: (formData, isEditing = false) => {
    const errors = {}
    const now = new Date()

    // Basic validation
    if (!formData.title?.trim()) errors.title = 'Event title is required'
    if (!formData.description?.trim()) errors.description = 'Event description is required'
    if (!formData.category) errors.category = 'Event category is required'
    if (!formData.eventDate) errors.eventDate = 'Event date is required'
    if (!formData.eventTime) errors.eventTime = 'Event time is required'
    if (!formData.venue?.trim()) errors.venue = 'Event venue is required'
    if (!formData.capacity || formData.capacity < 1) errors.capacity = 'Capacity must be at least 1'
    if (!formData.registrationDeadline) errors.registrationDeadline = 'Registration deadline is required'
    if (!formData.registrationDeadlineTime) errors.registrationDeadlineTime = 'Registration deadline time is required'

    // Date validation
    if (formData.eventDate && formData.eventTime) {
      const eventDateTime = createEventUtils.combineDateTime(formData.eventDate, formData.eventTime)
      
      if (!eventDateTime) {
        errors.eventDate = 'Invalid event date/time'
      } else if (!isEditing && eventDateTime <= now) {
        errors.eventDate = 'Event must be in the future'
      }

      // Registration deadline validation
      if (formData.registrationDeadline && formData.registrationDeadlineTime) {
        const regDateTime = createEventUtils.combineDateTime(formData.registrationDeadline, formData.registrationDeadlineTime)
        
        if (!regDateTime) {
          errors.registrationDeadline = 'Invalid registration deadline'
        } else if (eventDateTime && regDateTime >= eventDateTime) {
          errors.registrationDeadline = 'Registration deadline must be before event time'
        }
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors }
  },

  // Prepare data for API submission
  prepareSubmissionData: (formData, userId) => {
    const eventDateTime = createEventUtils.combineDateTime(formData.eventDate, formData.eventTime)
    const regDateTime = createEventUtils.combineDateTime(formData.registrationDeadline, formData.registrationDeadlineTime)

    const tags = typeof formData.tags === 'string' 
      ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : []
    
    const requirements = typeof formData.requirements === 'string'
      ? formData.requirements.split(',').map(req => req.trim()).filter(Boolean)
      : []

    return {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      eventDate: eventDateTime ? eventDateTime.toISOString() : null,
      eventTime: formData.eventTime,
      duration: Number(formData.duration),
      venue: formData.venue.trim(),
      capacity: Number(formData.capacity),
      registrationDeadline: regDateTime ? regDateTime.toISOString() : null,
      contactEmail: formData.contactEmail || '',
      contactPhone: formData.contactPhone || '',
      tags,
      requirements
    }
  }
}

export default createEventUtils