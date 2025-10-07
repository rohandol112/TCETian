import mongoose from 'mongoose'
import Event from './src/models/Event.js'
import User from './src/models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const createFutureEvent = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Get the first club user
    const club = await User.findOne({ role: 'club' })
    if (!club) {
      console.log('❌ No club user found!')
      return
    }

    console.log(`📝 Found club: ${club.clubName || club.name}`)

    // Update the existing event to be in the future
    const existingEvent = await Event.findOne({ title: 'Hacktoberfest 2025' })
    if (existingEvent) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 15) // 15 days from now
      
      const registrationDeadline = new Date()
      registrationDeadline.setDate(registrationDeadline.getDate() + 10) // 10 days from now

      existingEvent.eventDate = futureDate
      existingEvent.registrationDeadline = registrationDeadline
      await existingEvent.save()
      
      console.log(`✅ Updated existing event to future date: ${futureDate}`)
    }

    // Create a few more test events for different categories
    const testEvents = [
      {
        title: 'React Workshop 2025',
        description: 'Learn the latest features of React including hooks, context, and server components.',
        category: 'Workshop',
        eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        eventTime: '10:00',
        duration: 4,
        venue: 'Computer Lab 1',
        capacity: 50
      },
      {
        title: 'Annual Cultural Fest',
        description: 'Celebrate diversity and talent at our annual cultural festival.',
        category: 'Cultural',
        eventDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
        eventTime: '17:00',
        duration: 6,
        venue: 'Main Auditorium',
        capacity: 500
      },
      {
        title: 'AI/ML Seminar Series',
        description: 'Industry experts share insights on the future of artificial intelligence.',
        category: 'Seminar',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        eventTime: '14:00',
        duration: 3,
        venue: 'Seminar Hall A',
        capacity: 100
      },
      {
        title: 'Inter-College Cricket Tournament',
        description: 'Compete with other colleges in our annual cricket championship.',
        category: 'Sports',
        eventDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
        eventTime: '09:00',
        duration: 8,
        venue: 'Cricket Ground',
        capacity: 200
      }
    ]

    for (let eventData of testEvents) {
      // Check if event already exists
      const exists = await Event.findOne({ title: eventData.title })
      if (exists) {
        console.log(`⏭️  Event "${eventData.title}" already exists, skipping...`)
        continue
      }

      const registrationDeadline = new Date(eventData.eventDate)
      registrationDeadline.setDate(registrationDeadline.getDate() - 2) // 2 days before event

      const event = new Event({
        ...eventData,
        organizer: club._id,
        registrationDeadline,
        tags: [eventData.category.toLowerCase(), 'tcet', 'student'],
        status: 'published',
        contactInfo: {
          email: club.email
        }
      })

      await event.save()
      console.log(`✅ Created event: "${event.title}" on ${event.eventDate}`)
    }

    // Verify the events
    console.log('\n🔍 Verifying created events...')
    const now = new Date()
    const upcomingEvents = await Event.find({ 
      status: 'published',
      eventDate: { $gte: now }
    }).populate('organizer', 'name clubName').sort({ eventDate: 1 })
    
    console.log(`\n📅 Found ${upcomingEvents.length} upcoming events:`)
    upcomingEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`)
      console.log(`   Date: ${event.eventDate.toDateString()}`)
      console.log(`   Category: ${event.category}`)
      console.log(`   Organizer: ${event.organizer?.clubName || event.organizer?.name}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

createFutureEvent()