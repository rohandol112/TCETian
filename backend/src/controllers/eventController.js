import Event from '../models/Event.js'
import User from '../models/User.js'

// @desc    Get all events (with filtering and pagination)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
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

    // Get total count for pagination
    const total = await Event.countDocuments(filter)
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit))
    const hasNextPage = parseInt(page) < totalPages
    const hasPrevPage = parseInt(page) > 1

    res.json({
      success: true,
      data: {
        events,
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
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name clubName email description verified profilePicture')
      .populate('rsvpUsers.user', 'name studentId year branch')

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    // Increment view count
    event.viewCount += 1
    await event.save()

    res.json({
      success: true,
      data: { event }
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
    console.log('Creating event:', { ...req.body, organizer: req.user.id })
    
    // Import image handler
    const { imageHandler } = await import('../utils/imageHandler.js')
    
    let imageUrl = null
    
    // Handle image - either uploaded file or URL
    if (req.file) {
      // Process uploaded image
      imageUrl = imageHandler.processUploadedImage(req.file)
      console.log('Processed uploaded image:', imageUrl)
    } else if (req.body.imageUrl && imageHandler.validateImageUrl(req.body.imageUrl)) {
      // Use provided URL
      imageUrl = req.body.imageUrl
      console.log('Using provided image URL:', imageUrl)
    }
    
    const eventData = {
      ...req.body,
      organizer: req.user.id,
      imageUrl
    }

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
      venue: event.venue,
      imageUrl: event.imageUrl
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

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('organizer', 'name clubName email verified')

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent }
    })
  } catch (error) {
    console.error('Update event error:', error)
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
    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration'
      })
    }

    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      })
    }

    // Check if user already RSVP'd
    if (event.hasUserRSVP(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already RSVP\'d to this event'
      })
    }

    // Add RSVP
    const rsvp = event.addRSVP(req.user.id)
    await event.save()

    // Add to user's RSVP events
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { rsvpEvents: event._id } }
    )

    res.json({
      success: true,
      message: rsvp.status === 'waitlist' 
        ? 'Added to waitlist - you will be notified if a spot opens up'
        : 'RSVP successful',
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

    // Check if user has RSVP'd
    if (!event.hasUserRSVP(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have not RSVP\'d to this event'
      })
    }

    // Cancel RSVP
    const cancelledRsvp = event.cancelRSVP(req.user.id)
    await event.save()

    // Remove from user's RSVP events
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { rsvpEvents: event._id } }
    )

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
      totalRSVPs += event.rsvpUsers.filter(rsvp => rsvp.status === 'confirmed').length
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