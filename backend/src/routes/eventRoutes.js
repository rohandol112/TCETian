import express from 'express'
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRSVP,
  getEventAttendees,
  getDashboardStats
} from '../controllers/eventController.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'
import { upload } from '../utils/imageHandler.js'

const router = express.Router()

// Public routes
router.get('/', optionalAuth, getEvents)
router.get('/:id', optionalAuth, getEvent)

// Club-only routes
router.post('/', authenticate, authorize('club'), upload.single('poster'), createEvent)
router.put('/:id', authenticate, authorize('club'), upload.single('poster'), updateEvent)
router.delete('/:id', authenticate, authorize('club'), deleteEvent)
router.get('/:id/attendees', authenticate, authorize('club'), getEventAttendees)
router.get('/dashboard/stats', authenticate, authorize('club'), getDashboardStats)

// Student-only routes
router.post('/:id/rsvp', authenticate, authorize('student'), rsvpEvent)
router.delete('/:id/rsvp', authenticate, authorize('student'), cancelRSVP)

export default router