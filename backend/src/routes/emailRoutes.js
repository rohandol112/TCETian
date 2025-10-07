import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import reminderService from '../services/reminderService.js'
import emailService from '../services/emailService.js'

const router = express.Router()

// Test email functionality (Admin only)
router.post('/test-email', authenticate, authorize('admin', 'club'), async (req, res) => {
  try {
    const { type, email } = req.body
    
    const testEmail = email || req.user.email
    
    switch (type) {
      case 'rsvp':
        await emailService.sendRSVPConfirmation(
          testEmail,
          req.user.name,
          {
            title: 'Test Event',
            description: 'This is a test event for email functionality',
            eventDate: new Date(),
            eventTime: '18:00',
            venue: 'Test Venue',
            category: 'Technical'
          },
          'confirmed'
        )
        break
        
      case 'reminder':
        await emailService.sendEventReminder(
          testEmail,
          req.user.name,
          {
            title: 'Test Event Reminder',
            description: 'This is a test reminder',
            eventDate: new Date(),
            eventTime: '18:00',
            venue: 'Test Venue',
            category: 'Technical'
          }
        )
        break
        
      case 'comment':
        await emailService.sendCommentNotification(
          testEmail,
          req.user.name,
          {
            _id: '507f1f77bcf86cd799439011',
            title: 'Test Post',
            content: 'This is a test post'
          },
          {
            authorName: 'Test User',
            content: 'This is a test comment',
            createdAt: new Date()
          }
        )
        break
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Use: rsvp, reminder, or comment'
        })
    }
    
    res.json({
      success: true,
      message: `Test ${type} email sent successfully to ${testEmail}`
    })
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send test email'
    })
  }
})

// Manually trigger event reminders (Admin only)
router.post('/trigger-reminders', authenticate, authorize('admin'), async (req, res) => {
  try {
    await reminderService.triggerEventReminders()
    res.json({
      success: true,
      message: 'Event reminders triggered successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger reminders'
    })
  }
})

// Manually trigger waitlist check (Admin only)
router.post('/trigger-waitlist-check', authenticate, authorize('admin'), async (req, res) => {
  try {
    await reminderService.triggerWaitlistCheck()
    res.json({
      success: true,
      message: 'Waitlist check triggered successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger waitlist check'
    })
  }
})

export default router