import mongoose from 'mongoose'
import Event from './src/models/Event.js'
import User from './src/models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const testEvents = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Check existing events
    console.log('\n📋 Checking existing events...')
    const existingEvents = await Event.find({}).populate('organizer', 'name clubName email')
    console.log(`Found ${existingEvents.length} existing events:`)
    existingEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (${event.status}) - ${event.organizer?.clubName || event.organizer?.name}`)
    })

    // Check users (clubs) that can create events
    console.log('\n👥 Checking club users...')
    const clubs = await User.find({ role: 'club' }).select('name clubName email verified')
    console.log(`Found ${clubs.length} club users:`)
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.clubName || club.name} (${club.email}) - Verified: ${club.verified}`)
    })

    // Create a test event if no events exist and there's at least one club
    if (existingEvents.length === 0 && clubs.length > 0) {
      console.log('\n🎯 Creating a test event...')
      const testClub = clubs[0]
      
      const testEvent = new Event({
        title: 'Test Technical Workshop',
        description: 'This is a test event to verify the event system is working correctly.',
        organizer: testClub._id,
        category: 'Technical',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        eventTime: '14:00',
        duration: 2,
        venue: 'Auditorium A1',
        capacity: 100,
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        tags: ['workshop', 'technology', 'learning'],
        status: 'published',
        contactInfo: {
          email: testClub.email
        }
      })

      await testEvent.save()
      console.log('✅ Test event created successfully!')
      
      // Populate and display the created event
      const createdEvent = await Event.findById(testEvent._id).populate('organizer', 'name clubName email')
      console.log('📅 Created event details:')
      console.log(`- Title: ${createdEvent.title}`)
      console.log(`- Organizer: ${createdEvent.organizer.clubName || createdEvent.organizer.name}`)
      console.log(`- Date: ${createdEvent.eventDate}`)
      console.log(`- Status: ${createdEvent.status}`)
    }

    // Test the getEvents query directly
    console.log('\n🔍 Testing events query (like API does)...')
    const filter = { status: 'published' }
    const apiEvents = await Event.find(filter)
      .populate('organizer', 'name clubName email verified')
      .populate('rsvpUsers.user', 'name studentId year branch')
      .sort({ eventDate: 1, createdAt: -1 })
      .limit(10)

    console.log(`API query returned ${apiEvents.length} events:`)
    apiEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.organizer?.clubName || event.organizer?.name} (${event.status})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

testEvents()