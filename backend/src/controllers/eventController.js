import Event from '../models/Event.js'
import User from '../models/User.js'
import EmailService from '../services/emailService.js'
const emailService = new EmailService()

const parseDateTimeInput = (dateValue, timeValue, defaultTime = '00:00') => {
  if (!dateValue) return null

  try {
    // If dateValue is already a full ISO string, just parse it
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      const parsed = new Date(dateValue)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    // Otherwise combine date and time as local time
    let datePart = dateValue
    if (typeof dateValue !== 'string') {
      datePart = new Date(dateValue).toISOString().split('T')[0]
    } else if (dateValue.includes('T')) {
      datePart = dateValue.split('T')[0]
    }

    const timePart = (timeValue && timeValue.trim()) || defaultTime
    
    // Parse as local timezone to avoid UTC conversion issues
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    
    const combined = new Date(year, month - 1, day, hours, minutes, 0, 0)
    
    console.log('📅 Date parsing:', {
      input: { dateValue, timeValue },
      parsed: { year, month: month - 1, day, hours, minutes },
      result: combined.toISOString(),
      local: combined.toLocaleString()
    })
    
    return Number.isNaN(combined.getTime()) ? null : combined
  } catch (error) {
    console.error('Date parsing error:', error, 'Input:', { dateValue, timeValue })
    return null
  }
}

// @desc    Get all events (with filtering and pagination)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    // Get events with optional authentication
    
    const {
      page = 1,
      limit = 10,
      category,
      search,
      upcoming = 'true',
      organizer,
      featured
    } = req.query

    // Build filter object
    const filter = {}
    
    // Only show published events for public access
    filter.status = 'published'
    
    if (category && category !== 'all') {
      filter.category = category
    }
    
    if (organizer) {
      filter.organizer = organizer
    }
    
    if (featured === 'true') {
      filter.featured = true
    }
    
    if (upcoming === 'true') {
      filter.eventDate = { $gte: new Date() }
    } else if (upcoming === 'false') {
      filter.eventDate = { $lt: new Date() }
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    // Get events with populate
    const events = await Event.find(filter)
      .populate('organizer', 'name clubName email verified')
      .populate('rsvpUsers.user', 'name studentId year branch')
      .sort({ eventDate: upcoming === 'true' ? 1 : -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    // Convert to plain objects and add user's RSVP status for authenticated users
    let eventsWithRsvpStatus = events.map(event => {
      const eventObj = event.toObject({ virtuals: true })
      
      // Ensure RSVP counts are properly calculated
      const confirmedRSVPs = event.rsvpUsers.filter(rsvp => rsvp.status === 'confirmed').length
      const waitlistRSVPs = event.rsvpUsers.filter(rsvp => rsvp.status === 'waitlist').length
      
      eventObj.currentRSVP = confirmedRSVPs
      eventObj.waitlistCount = waitlistRSVPs
      eventObj.totalRSVP = confirmedRSVPs + waitlistRSVPs
      eventObj.availableSpots = (event.maxRSVP || event.capacity) - confirmedRSVPs
      eventObj.isFull = confirmedRSVPs >= (event.maxRSVP || event.capacity)
      
      if (req.user) {
        const userId = req.user._id || req.user.id
        const userRsvpStatus = event.getUserRSVPStatus(userId)
        eventObj.userRsvpStatus = userRsvpStatus
      }
      
      return eventObj
    })

    // Get total count for pagination
    const total = await Event.countDocuments(filter)
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit))
    const hasNextPage = parseInt(page) < totalPages
    const hasPrevPage = parseInt(page) > 1

    res.json({
      success: true,
      data: {
        events: eventsWithRsvpStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching events'
    })
  }
}

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req, res) => {
  try {
    // Increment view count without triggering validation
    await Event.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { runValidators: false }
    )

    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name clubName email description verified profilePicture')
      .populate('rsvpUsers.user', 'name studentId year branch')

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Convert to plain object and add user's RSVP status
    const eventObj = event.toObject({ virtuals: true })
    
    // Ensure RSVP counts are properly calculated
    const confirmedRSVPs = event.rsvpUsers.filter(rsvp => rsvp.status === 'confirmed').length
    const waitlistRSVPs = event.rsvpUsers.filter(rsvp => rsvp.status === 'waitlist').length
    
    eventObj.currentRSVP = confirmedRSVPs
    eventObj.waitlistCount = waitlistRSVPs
    eventObj.totalRSVP = confirmedRSVPs + waitlistRSVPs
    eventObj.availableSpots = (event.maxRSVP || event.capacity) - confirmedRSVPs
    eventObj.isFull = confirmedRSVPs >= (event.maxRSVP || event.capacity)
    
    if (req.user) {
      const userId = req.user._id || req.user.id
      eventObj.userRsvpStatus = event.getUserRSVPStatus(userId)
    }

    res.json({
      success: true,
      data: { event: eventObj }
    })
  } catch (error) {
    console.error('Get event error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching event'
    })
  }
}

// @desc    Create new event (Club only)
// @route   POST /api/events
// @access  Private (Club)
export const createEvent = async (req, res) => {
  try {
    console.log('🎯 Creating event for user:', req.user.id, 'Role:', req.user.role, 'ClubName:', req.user.clubName)
    console.log('📝 Event data received:', { ...req.body, organizer: req.user.id })
    
    const eventData = {
      ...req.body,
      organizer: req.user.id
    }

    eventData.tags = sanitizeArrayField(eventData.tags, {
      maxLength: 50
    })

    eventData.requirements = sanitizeArrayField(eventData.requirements, {
      maxLength: 200
    })

    const eventDateTime = parseDateTimeInput(req.body.eventDate, req.body.eventTime)
    if (eventDateTime) {
      eventData.eventDate = eventDateTime
    }

    const registrationDeadline = parseDateTimeInput(
      req.body.registrationDeadline,
      req.body.registrationDeadlineTime,
      '23:59'
    )

    if (registrationDeadline) {
      eventData.registrationDeadline = registrationDeadline
    }

    delete eventData.registrationDeadlineTime

    const event = await Event.create(eventData)
    
    // Add to user's events created
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { eventsCreated: event._id } }
    )

    // Populate organizer info
    await event.populate('organizer', 'name clubName email verified profilePicture')

    // Real-time WebSocket notification
    const socketService = (await import('../services/socketService.js')).default
    
    // Broadcast new event to all connected users
    socketService.broadcastNewEvent({
      eventId: event._id,
      title: event.title,
      category: event.category,
      eventDate: event.eventDate,
      organizer: {
        name: event.organizer.clubName || event.organizer.name,
        id: event.organizer._id
      },
      venue: event.venue
    })

    // Send notification to users interested in this category
    socketService.sendEventNotification({
      type: 'new_event',
      eventId: event._id,
      title: event.title,
      category: event.category,
      organizer: event.organizer.clubName || event.organizer.name,
      message: `New ${event.category} event: ${event.title}`
    })

    // Log activity
    const UserActivity = (await import('../models/UserActivity.js')).default
    await UserActivity.logActivity(
      req.user.id,
      'event_created',
      event._id,
      { eventTitle: event.title, category: event.category }
    )

    res.status(201).json({
      success: true,
      message: 'Event created successfully and notifications sent!',
      data: { event }
    })
  } catch (error) {
    console.error('Create event error:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating event'
    })
  }
}

// @desc    Update event (Club only - own events)
// @route   PUT /api/events/:id
// @access  Private (Club)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      })
    }

    // Don't allow updates to completed events
    if (event.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed events'
      })
    }

    const updates = { ...req.body }

    const hasTagsField = Object.prototype.hasOwnProperty.call(updates, 'tags')
    if (hasTagsField) {
      updates.tags = sanitizeArrayField(updates.tags, {
        maxLength: 50
      })
    }

    const hasRequirementsField = Object.prototype.hasOwnProperty.call(updates, 'requirements')
    if (hasRequirementsField) {
      updates.requirements = sanitizeArrayField(updates.requirements, {
        maxLength: 200
      })
    }

    const eventDateTime = parseDateTimeInput(req.body.eventDate, req.body.eventTime)
    if (eventDateTime) {
      updates.eventDate = eventDateTime
    }

    const registrationDeadline = parseDateTimeInput(
      req.body.registrationDeadline,
      req.body.registrationDeadlineTime,
      '23:59'
    )

    if (registrationDeadline) {
      updates.registrationDeadline = registrationDeadline
    }

    delete updates.registrationDeadlineTime

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('organizer', 'name clubName email verified')

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent }
    })
  } catch (error) {
    console.error('Update event error:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating event'
    })
  }
}

// @desc    Delete event (Club only - own events)
// @route   DELETE /api/events/:id
// @access  Private (Club)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      })
    }

    // Clean up image file if it's a local upload
    if (event.imageUrl) {
      const { imageHandler } = await import('../utils/imageHandler.js')
      await imageHandler.deleteImageFile(event.imageUrl)
    }

    await Event.findByIdAndDelete(req.params.id)

    // Remove from user's events created and all user RSVPs
    await User.updateMany(
      {},
      { 
        $pull: { 
          eventsCreated: req.params.id,
          rsvpEvents: req.params.id
        }
      }
    )

    res.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error deleting event'
    })
  }
}

// @desc    RSVP to event (Student only)
// @route   POST /api/events/:id/rsvp
// @access  Private (Student)
export const rsvpEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Check if event is published and not past registration deadline
    console.log('📅 RSVP Validation:', {
      eventId: req.params.id,
      userId: req.user.id,
      eventStatus: event.status,
      registrationDeadline: event.registrationDeadline,
      currentTime: new Date(),
      hasUserRSVP: event.hasUserRSVP(req.user.id),
      userRSVPStatus: event.getUserRSVPStatus(req.user.id)
    })

    if (event.status !== 'published') {
      console.log('❌ RSVP Failed: Event not published')
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration'
      })
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      console.log('❌ RSVP Failed: Registration deadline passed')
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      })
    }

    const userId = req.user._id || req.user.id
    
    // Check if user already RSVP'd
    if (event.hasUserRSVP(userId)) {
      console.log('❌ RSVP Failed: User already RSVP\'d')
      return res.status(400).json({
        success: false,
        message: 'You have already RSVP\'d to this event'
      })
    }

    // Add RSVP
    const rsvp = event.addRSVP(userId)
    await event.save()

    // Add to user's RSVP events
    await User.findByIdAndUpdate(
      userId,
      { $push: { rsvpEvents: event._id } }
    )

    // Send RSVP confirmation email and real-time notification
    try {
      await emailService.sendRSVPConfirmation(
        req.user.email,
        req.user.name,
        {
          title: event.title,
          description: event.description,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          venue: event.venue,
          category: event.category
        },
        rsvp.status
      )
      
      console.log(`📧 RSVP confirmation email sent to ${req.user.email}`)
      
      // Send real-time notification to user
      const socketService = (await import('../services/socketService.js')).default
      socketService.sendNotificationToUser(req.user.id, {
        type: 'rsvp_confirmation',
        title: 'RSVP Confirmed!',
        message: `Your RSVP for "${event.title}" has been confirmed. Check your email for details.`,
        eventId: event._id,
        eventTitle: event.title,
        status: rsvp.status,
        timestamp: new Date()
      })
      
      // Broadcast RSVP activity to event organizer
      socketService.sendNotificationToUser(event.organizer.toString(), {
        type: 'new_rsvp',
        title: 'New RSVP',
        message: `${req.user.name} just RSVP'd to your event "${event.title}"`,
        eventId: event._id,
        eventTitle: event.title,
        userName: req.user.name,
        userYear: req.user.year,
        userBranch: req.user.branch,
        rsvpStatus: rsvp.status,
        currentRSVP: event.currentRSVP + 1,
        timestamp: new Date()
      })

      // Broadcast RSVP update to all users viewing this event
      socketService.broadcastRSVPUpdate(event._id, {
        userId: req.user.id,
        userName: req.user.name,
        action: 'rsvp',
        status: rsvp.status,
        currentRSVP: event.currentRSVP + 1,
        availableSpots: event.availableSpots - 1,
        eventTitle: event.title
      })
      
    } catch (emailError) {
      console.error('❌ Failed to send RSVP confirmation email:', emailError)
      // Don't fail the RSVP if email fails
    }

    res.json({
      success: true,
      message: rsvp.status === 'waitlist' 
        ? 'Added to waitlist - you will be notified if a spot opens up'
        : 'RSVP successful! Check your email for confirmation.',
      data: { 
        rsvp,
        currentRSVP: event.currentRSVP,
        availableSpots: event.availableSpots
      }
    })
  } catch (error) {
    console.error('RSVP event error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error processing RSVP'
    })
  }
}

// @desc    Cancel RSVP (Student only)
// @route   DELETE /api/events/:id/rsvp
// @access  Private (Student)
export const cancelRSVP = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    const userId = req.user._id || req.user.id
    
    // Check if user has RSVP'd
    if (!event.hasUserRSVP(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have not RSVP\'d to this event'
      })
    }

    // Cancel RSVP
    const cancelledRsvp = event.cancelRSVP(userId)
    await event.save()

    // Remove from user's RSVP events
    await User.findByIdAndUpdate(
      userId,
      { $pull: { rsvpEvents: event._id } }
    )

    // Send RSVP cancellation email
    try {
      await emailService.sendRSVPCancellation(
        req.user.email,
        req.user.name,
        {
          title: event.title,
          description: event.description,
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          venue: event.venue,
          category: event.category
        }
      )
      console.log(`📧 RSVP cancellation email sent to ${req.user.email}`)
    } catch (emailError) {
      console.error('❌ Failed to send RSVP cancellation email:', emailError)
      // Don't fail the cancellation if email fails
    }

    // Broadcast RSVP cancellation to all users viewing this event
    const socketService = (await import('../services/socketService.js')).default
    socketService.broadcastRSVPUpdate(event._id, {
      userId: req.user.id,
      userName: req.user.name,
      action: 'cancel',
      status: 'cancelled',
      currentRSVP: event.currentRSVP,
      availableSpots: event.availableSpots,
      eventTitle: event.title
    })

    res.json({
      success: true,
      message: 'RSVP cancelled successfully',
      data: { 
        cancelledRsvp,
        currentRSVP: event.currentRSVP,
        availableSpots: event.availableSpots
      }
    })
  } catch (error) {
    console.error('Cancel RSVP error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error cancelling RSVP'
    })
  }
}

// @desc    Get event attendees (Club only - own events)
// @route   GET /api/events/:id/attendees
// @access  Private (Club)
export const getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('rsvpUsers.user', 'name studentId year branch email')
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view attendees'
      })
    }

    // Separate confirmed and waitlist attendees
    const confirmedAttendees = event.rsvpUsers
      .filter(rsvp => rsvp.status === 'confirmed')
      .map(rsvp => ({
        ...rsvp.user.toObject(),
        rsvpDate: rsvp.rsvpDate,
        status: rsvp.status
      }))

    const waitlistAttendees = event.rsvpUsers
      .filter(rsvp => rsvp.status === 'waitlist')
      .map(rsvp => ({
        ...rsvp.user.toObject(),
        rsvpDate: rsvp.rsvpDate,
        status: rsvp.status
      }))

    res.json({
      success: true,
      data: {
        confirmed: confirmedAttendees,
        waitlist: waitlistAttendees,
        stats: {
          totalConfirmed: confirmedAttendees.length,
          totalWaitlist: waitlistAttendees.length,
          capacity: event.capacity,
          availableSpots: event.availableSpots
        }
      }
    })
  } catch (error) {
    console.error('Get attendees error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendees'
    })
  }
}

// @desc    Get events dashboard stats (Club only)
// @route   GET /api/events/dashboard/stats
// @access  Private (Club)
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id
    
    // Get events created by this club
    const totalEvents = await Event.countDocuments({ organizer: userId })
    const publishedEvents = await Event.countDocuments({ 
      organizer: userId, 
      status: 'published' 
    })
    const upcomingEvents = await Event.countDocuments({ 
      organizer: userId, 
      status: 'published',
      eventDate: { $gte: new Date() }
    })
    
    // Get total RSVPs across all events
    const eventsWithRSVPs = await Event.find({ organizer: userId })
      .select('rsvpUsers title')
    
    let totalRSVPs = 0
    eventsWithRSVPs.forEach(event => {
      if (event.rsvpUsers && Array.isArray(event.rsvpUsers)) {
        totalRSVPs += event.rsvpUsers.filter(rsvp => rsvp && rsvp.status === 'confirmed').length
      }
    })

    // Get recent events
    const recentEvents = await Event.find({ organizer: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title eventDate status currentRSVP viewCount')

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          publishedEvents,
          upcomingEvents,
          totalRSVPs
        },
        recentEvents
      }
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats'
    })
  }
}

// @desc    Share event (track share count)
// @route   POST /api/events/:id/share
// @access  Public
export const shareEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Increment share count
    event.shareCount = (event.shareCount || 0) + 1
    await event.save()

    // Emit socket event for real-time update
    const io = req.app.get('io')
    if (io) {
      io.emit('event:shared', {
        eventId: event._id,
        shareCount: event.shareCount
      })
    }

    res.json({
      success: true,
      data: {
        shareCount: event.shareCount,
        shareUrl: `${process.env.FRONTEND_URL}/events/${event._id}`
      }
    })
  } catch (error) {
    console.error('Share event error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error sharing event'
    })
  }
}

// @desc    Get event share info
// @route   GET /api/events/:id/share-info
// @access  Public
export const getEventShareInfo = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .select('title description poster eventDate venue shareCount')
      .populate('organizer', 'name profilePicture')

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    res.json({
      success: true,
      data: {
        title: event.title,
        description: event.description,
        poster: event.poster,
        eventDate: event.eventDate,
        venue: event.venue,
        organizer: event.organizer?.name || 'TCETian',
        shareCount: event.shareCount || 0,
        shareUrl: `${process.env.FRONTEND_URL}/events/${event._id}`,
        imageUrl: event.poster ? `${process.env.BACKEND_URL}${event.poster}` : null
      }
    })
  } catch (error) {
    console.error('Get share info error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

const sanitizeArrayField = (rawValue, {
  fallbackSplitter = ',',
  maxLength = Infinity,
  trim = true
} = {}) => {
  if (!rawValue) return []

  const attemptParse = (value) => {
    if (typeof value !== 'string') return value
    let current = value
    try {
      let parsed = JSON.parse(current)
      while (typeof parsed === 'string' && parsed.startsWith('[')) {
        current = parsed
        parsed = JSON.parse(parsed)
      }
      return parsed
    } catch {
      return current
    }
  }

  const ensureArray = (value) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      return value
        .split(fallbackSplitter)
        .map(part => part.trim())
        .filter(Boolean)
    }
    return []
  }

  const normalized = ensureArray(attemptParse(rawValue))

  return normalized
    .filter(item => typeof item === 'string')
    .map(item => {
      const trimmed = trim ? item.trim() : item
      return maxLength < Infinity ? trimmed.slice(0, maxLength) : trimmed
    })
    .filter(item => item.length > 0)
}