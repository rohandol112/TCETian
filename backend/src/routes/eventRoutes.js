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
  getDashboardStats,
  shareEvent,
  getEventShareInfo
} from '../controllers/eventController.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Club-only routes (MUST come before /:id to avoid conflicts)
router.get('/dashboard/stats', authenticate, authorize('club'), getDashboardStats)

// Public routes
router.get('/', optionalAuth, getEvents)
router.get('/:id', optionalAuth, getEvent)
router.post('/:id/share', shareEvent)
router.get('/:id/share-info', getEventShareInfo)

// Club-only routes (continued)
router.post('/', authenticate, authorize('club'), createEvent)
router.put('/:id', authenticate, authorize('club'), updateEvent)
router.delete('/:id', authenticate, authorize('club'), deleteEvent)
router.get('/:id/attendees', authenticate, authorize('club'), getEventAttendees)

// Student-only routes
router.post('/:id/rsvp', authenticate, authorize('student'), rsvpEvent)
router.delete('/:id/rsvp', authenticate, authorize('student'), cancelRSVP)

export default router