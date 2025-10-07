import cron from 'node-cron'
import Event from '../models/Event.js'
import User from '../models/User.js'
import EmailService from './emailService.js'

const emailService = new EmailService()

class ReminderService {
  constructor() {
    this.isRunning = false
  }

  // Start the reminder service
  start() {
    if (this.isRunning) {
      console.log('📅 Reminder service is already running')
      return
    }

    // Run every day at 9:00 AM to send reminders for events happening tomorrow
    cron.schedule('0 9 * * *', async () => {
      console.log('📅 Running daily event reminder check...')
      await this.sendEventReminders()
    })

    // Run every hour to send waitlist promotion notifications
    cron.schedule('0 * * * *', async () => {
      console.log('📅 Checking for waitlist promotions...')
      await this.checkWaitlistPromotions()
    })

    this.isRunning = true
    console.log('📅 Reminder service started successfully')
    console.log('   • Daily reminders: 9:00 AM')
    console.log('   • Waitlist checks: Every hour')
  }

  // Send event reminders for events happening tomorrow
  async sendEventReminders() {
    try {
      // Calculate tomorrow's date range
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      // Find events happening tomorrow
      const events = await Event.find({
        eventDate: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        },
        status: 'published'
      }).populate('rsvpUsers.user', 'email name')

      console.log(`📅 Found ${events.length} events happening tomorrow`)

      for (const event of events) {
        // Send reminder to all confirmed attendees
        const confirmedAttendees = event.rsvpUsers.filter(rsvp => rsvp.status === 'confirmed')
        
        console.log(`📅 Sending reminders for "${event.title}" to ${confirmedAttendees.length} attendees`)

        for (const rsvp of confirmedAttendees) {
          try {
            await emailService.sendEventReminder(
              rsvp.user.email,
              rsvp.user.name,
              {
                title: event.title,
                description: event.description,
                eventDate: event.eventDate,
                eventTime: event.eventTime,
                venue: event.venue,
                category: event.category
              }
            )
            
            // Add a small delay to avoid overwhelming the email service
            await new Promise(resolve => setTimeout(resolve, 100))
            
          } catch (error) {
            console.error(`❌ Failed to send reminder to ${rsvp.user.email}:`, error.message)
          }
        }
      }

      console.log('📅 Event reminder batch completed')
    } catch (error) {
      console.error('❌ Error in sendEventReminders:', error)
    }
  }

  // Check for waitlist promotions (when someone cancels and waitlist users get promoted)
  async checkWaitlistPromotions() {
    try {
      // Find events with waitlisted users
      const events = await Event.find({
        'rsvpUsers.status': 'waitlist',
        status: 'published',
        eventDate: { $gte: new Date() } // Only future events
      }).populate('rsvpUsers.user', 'email name')

      for (const event of events) {
        const confirmedCount = event.rsvpUsers.filter(rsvp => rsvp.status === 'confirmed').length
        const availableSpots = event.maxRSVP - confirmedCount
        
        if (availableSpots > 0) {
          // Promote waitlisted users to confirmed
          const waitlistUsers = event.rsvpUsers.filter(rsvp => rsvp.status === 'waitlist')
          const usersToPromote = waitlistUsers.slice(0, availableSpots)
          
          if (usersToPromote.length > 0) {
            console.log(`📅 Promoting ${usersToPromote.length} users from waitlist for event: ${event.title}`)
            
            // Update their status
            for (const rsvp of usersToPromote) {
              rsvp.status = 'confirmed'
              
              // Send promotion notification
              try {
                await emailService.sendRSVPConfirmation(
                  rsvp.user.email,
                  rsvp.user.name,
                  {
                    title: event.title,
                    description: event.description,
                    eventDate: event.eventDate,
                    eventTime: event.eventTime,
                    venue: event.venue,
                    category: event.category
                  },
                  'confirmed'
                )
                
                console.log(`📧 Waitlist promotion notification sent to ${rsvp.user.email}`)
              } catch (error) {
                console.error(`❌ Failed to send promotion notification to ${rsvp.user.email}:`, error.message)
              }
            }
            
            // Save the updated event
            await event.save()
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in checkWaitlistPromotions:', error)
    }
  }

  // Manual trigger for testing
  async triggerEventReminders() {
    console.log('📅 Manually triggering event reminders...')
    await this.sendEventReminders()
  }

  // Manual trigger for waitlist check
  async triggerWaitlistCheck() {
    console.log('📅 Manually triggering waitlist check...')
    await this.checkWaitlistPromotions()
  }

  // Stop the service
  stop() {
    this.isRunning = false
    console.log('📅 Reminder service stopped')
  }
}

export default new ReminderService()