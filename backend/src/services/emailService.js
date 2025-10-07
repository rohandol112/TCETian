import nodemailer from 'nodemailer'

class EmailService {
  constructor() {
    this.transporter = null
    this.initialized = false
  }

  // Initialize transporter on first use
  _initializeTransporter() {
    if (this.initialized) return

    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured. Email features will be disabled.')
      this.transporter = null
      this.initialized = true
      return
    }
    
    console.log('📧 Initializing email service for:', process.env.EMAIL_USER)

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })
    
    this.initialized = true
  }

  // Test email configuration
  async testConnection() {
    this._initializeTransporter()
    
    if (!this.transporter) {
      console.warn('⚠️ Email service not configured - skipping connection test')
      return false
    }
    
    try {
      await this.transporter.verify()
      console.log('📧 Email service connected successfully')
      return true
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message)
      console.log('💡 Gmail setup required:')
      console.log('   1. Enable 2-factor authentication on your Gmail account')
      console.log('   2. Generate an "App Password" for this application')
      console.log('   3. Use the app password in EMAIL_PASS environment variable')
      return false
    }
  }

  // Check if email service is available
  isEmailEnabled() {
    this._initializeTransporter()
    return this.transporter !== null
  }

  // Send RSVP confirmation email
  async sendRSVPConfirmation(userEmail, userName, eventDetails, rsvpStatus) {
    if (!this.isEmailEnabled()) {
      console.log('📧 Email service disabled - skipping RSVP confirmation email')
      return { success: false, reason: 'Email service not configured' }
    }
    const subject = `RSVP Confirmation: ${eventDetails.title}`
    
    let statusMessage, statusColor, actionText
    if (rsvpStatus === 'confirmed') {
      statusMessage = 'Your RSVP has been confirmed!'
      statusColor = '#10B981'
      actionText = 'You\'re all set to attend'
    } else if (rsvpStatus === 'waitlist') {
      statusMessage = 'You\'ve been added to the waitlist'
      statusColor = '#F59E0B'
      actionText = 'We\'ll notify you if a spot opens up'
    }

    const html = this.generateRSVPEmailTemplate({
      userName,
      eventDetails,
      statusMessage,
      statusColor,
      actionText,
      rsvpStatus
    })

    try {
      await this.transporter.sendMail({
        from: `"TCETian Events" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject,
        html
      })
      console.log(`📧 RSVP confirmation sent to ${userEmail}`)
    } catch (error) {
      console.error('❌ Failed to send RSVP confirmation:', error)
      throw error
    }
  }

  // Send event reminder email (1 day before)
  async sendEventReminder(userEmail, userName, eventDetails) {
    if (!this.isEmailEnabled()) {
      console.log('📧 Email service disabled - skipping event reminder email')
      return { success: false, reason: 'Email service not configured' }
    }

    const subject = `Reminder: ${eventDetails.title} is tomorrow!`
    
    const html = this.generateReminderEmailTemplate({
      userName,
      eventDetails
    })

    try {
      await this.transporter.sendMail({
        from: `"TCETian Events" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject,
        html
      })
      console.log(`📧 Event reminder sent to ${userEmail}`)
    } catch (error) {
      console.error('❌ Failed to send event reminder:', error)
      throw error
    }
  }

  // Send reply notification email (like Reddit)
  async sendReplyNotification(userEmail, userName, postDetails, replyDetails) {
    if (!this.isEmailEnabled()) {
      console.log('📧 Email service disabled - skipping reply notification email')
      return { success: false, reason: 'Email service not configured' }
    }

    const subject = `New reply to your post: "${postDetails.title}"`
    
    const html = this.generateReplyEmailTemplate({
      userName,
      postDetails,
      replyDetails
    })

    try {
      await this.transporter.sendMail({
        from: `"TCETian Social" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject,
        html
      })
      console.log(`📧 Reply notification sent to ${userEmail}`)
    } catch (error) {
      console.error('❌ Failed to send reply notification:', error)
      throw error
    }
  }

  // Send comment notification email
  async sendCommentNotification(userEmail, userName, postDetails, commentDetails) {
    if (!this.isEmailEnabled()) {
      console.log('📧 Email service disabled - skipping comment notification email')
      return { success: false, reason: 'Email service not configured' }
    }

    const subject = `New comment on your post: "${postDetails.title}"`
    
    const html = this.generateCommentEmailTemplate({
      userName,
      postDetails,
      commentDetails
    })

    try {
      await this.transporter.sendMail({
        from: `"TCETian Social" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject,
        html
      })
      console.log(`📧 Comment notification sent to ${userEmail}`)
    } catch (error) {
      console.error('❌ Failed to send comment notification:', error)
      throw error
    }
  }

  // Send RSVP cancellation email
  async sendRSVPCancellation(userEmail, userName, eventDetails) {
    if (!this.isEmailEnabled()) {
      console.log('📧 Email service disabled - skipping RSVP cancellation email')
      return { success: false, reason: 'Email service not configured' }
    }

    const subject = `RSVP Cancelled: ${eventDetails.title}`
    
    const html = this.generateCancellationEmailTemplate({
      userName,
      eventDetails
    })

    try {
      await this.transporter.sendMail({
        from: `"TCETian Events" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject,
        html
      })
      console.log(`📧 RSVP cancellation sent to ${userEmail}`)
    } catch (error) {
      console.error('❌ Failed to send RSVP cancellation:', error)
      throw error
    }
  }

  // Generate RSVP confirmation email template
  generateRSVPEmailTemplate({ userName, eventDetails, statusMessage, statusColor, actionText, rsvpStatus }) {
    const eventDate = new Date(eventDetails.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RSVP Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; overflow: hidden; margin-top: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">TCETian</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Campus Events Platform</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: ${statusColor}20; border: 2px solid ${statusColor}; border-radius: 50px; display: inline-block; padding: 12px 24px;">
                <span style="color: ${statusColor}; font-weight: bold; font-size: 16px;">${statusMessage}</span>
              </div>
            </div>

            <!-- Greeting -->
            <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}!</h2>
            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${actionText} for the following event:</p>

            <!-- Event Card -->
            <div style="background-color: #2d3748; border-radius: 12px; padding: 24px; margin-bottom: 30px; border-left: 4px solid ${statusColor};">
              <h3 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px; font-weight: bold;">${eventDetails.title}</h3>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 14px;">📅 Date: </span>
                <span style="color: #e2e8f0; font-size: 14px;">${eventDate} at ${eventDetails.eventTime}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 14px;">📍 Venue: </span>
                <span style="color: #e2e8f0; font-size: 14px;">${eventDetails.venue}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 14px;">🏷️ Category: </span>
                <span style="color: #e2e8f0; font-size: 14px;">${eventDetails.category}</span>
              </div>

              ${eventDetails.description ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #4a5568;">
                  <p style="color: #cbd5e0; font-size: 14px; line-height: 1.5; margin: 0;">${eventDetails.description}</p>
                </div>
              ` : ''}
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.FRONTEND_URL}/events" 
                 style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Event Details
              </a>
            </div>

            <!-- Additional Info -->
            ${rsvpStatus === 'confirmed' ? `
              <div style="background-color: #065f46; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #a7f3d0; margin: 0; font-size: 14px; text-align: center;">
                  ✅ You'll receive a reminder email 24 hours before the event
                </p>
              </div>
            ` : `
              <div style="background-color: #92400e; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #fcd34d; margin: 0; font-size: 14px; text-align: center;">
                  ⏳ You're on the waitlist. We'll email you immediately if a spot opens up!
                </p>
              </div>
            `}
          </div>

          <!-- Footer -->
          <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              This email was sent from TCETian Events Platform<br>
              If you have any questions, contact us at ${process.env.EMAIL_USER}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate event reminder email template
  generateReminderEmailTemplate({ userName, eventDetails }) {
    const eventDate = new Date(eventDetails.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; overflow: hidden; margin-top: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">⏰ Event Reminder</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Don't forget about tomorrow!</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}!</h2>
            <p style="color: #94a3b8; font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
              🎉 Your event is happening <strong style="color: #fbbf24;">tomorrow</strong>!
            </p>

            <!-- Event Card -->
            <div style="background-color: #2d3748; border-radius: 12px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
              <h3 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px; font-weight: bold;">${eventDetails.title}</h3>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #fbbf24; font-size: 16px; font-weight: bold;">📅 Tomorrow: ${eventDate}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #fbbf24; font-size: 16px; font-weight: bold;">🕐 Time: ${eventDetails.eventTime}</span>
              </div>
              
              <div style="margin-bottom: 12px;">
                <span style="color: #fbbf24; font-size: 16px; font-weight: bold;">📍 Venue: ${eventDetails.venue}</span>
              </div>
            </div>

            <!-- Action Button -->
            <a href="${process.env.FRONTEND_URL}/events" 
               style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 20px;">
              View Event Details
            </a>

            <p style="color: #94a3b8; font-size: 14px;">See you there! 🎊</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate reply notification email template (Reddit-style)
  generateReplyEmailTemplate({ userName, postDetails, replyDetails }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Reply</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; overflow: hidden; margin-top: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">💬 New Reply</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Someone replied to your post</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}!</h2>
            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Someone replied to your post in the TCETian community:
            </p>

            <!-- Original Post -->
            <div style="background-color: #2d3748; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #6366f1;">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; font-weight: bold;">Your Post</p>
              <h3 style="color: #f1f5f9; margin: 0 0 12px 0; font-size: 18px;">${postDetails.title}</h3>
              ${postDetails.content ? `
                <p style="color: #cbd5e0; font-size: 14px; line-height: 1.5; margin: 0;">${postDetails.content.substring(0, 200)}${postDetails.content.length > 200 ? '...' : ''}</p>
              ` : ''}
            </div>

            <!-- Reply -->
            <div style="background-color: #065f46; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #10b981;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="color: white; font-weight: bold; font-size: 14px;">${replyDetails.authorName[0]}</span>
                </div>
                <div>
                  <p style="color: #a7f3d0; margin: 0; font-weight: bold; font-size: 14px;">${replyDetails.authorName}</p>
                  <p style="color: #6ee7b7; margin: 0; font-size: 12px;">${new Date(replyDetails.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p style="color: #d1fae5; font-size: 14px; line-height: 1.5; margin: 0;">${replyDetails.content}</p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/social?post=${postDetails._id}" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                View & Reply
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              This notification was sent from TCETian Social Platform<br>
              <a href="${process.env.FRONTEND_URL}/profile/notifications" style="color: #6366f1; text-decoration: none;">Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate comment notification email template
  generateCommentEmailTemplate({ userName, postDetails, commentDetails }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Comment</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; overflow: hidden; margin-top: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">💭 New Comment</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Someone commented on your post</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}!</h2>
            
            <!-- Original Post -->
            <div style="background-color: #2d3748; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #f1f5f9; margin: 0 0 12px 0; font-size: 18px;">${postDetails.title}</h3>
            </div>

            <!-- Comment -->
            <div style="background-color: #1e3a8a; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="color: white; font-weight: bold; font-size: 14px;">${commentDetails.authorName[0]}</span>
                </div>
                <div>
                  <p style="color: #93c5fd; margin: 0; font-weight: bold; font-size: 14px;">${commentDetails.authorName}</p>
                </div>
              </div>
              <p style="color: #dbeafe; font-size: 14px; line-height: 1.5; margin: 0;">${commentDetails.content}</p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/social?post=${postDetails._id}" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Comments
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate cancellation email template
  generateCancellationEmailTemplate({ userName, eventDetails }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RSVP Cancelled</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; overflow: hidden; margin-top: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">RSVP Cancelled</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}!</h2>
            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your RSVP for the following event has been cancelled:
            </p>

            <!-- Event Card -->
            <div style="background-color: #2d3748; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 20px;">${eventDetails.title}</h3>
              <p style="color: #94a3b8; margin: 0;">You can always RSVP again if you change your mind!</p>
            </div>

            <a href="${process.env.FRONTEND_URL}/events" 
               style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              Browse Other Events
            </a>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

export default EmailService