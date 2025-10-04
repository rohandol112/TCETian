import mongoose from 'mongoose'
import User from './src/models/User.js'
import dotenv from 'dotenv'

dotenv.config()

async function clearTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Remove any test users that might be causing conflicts
    const testEmails = [
      'testclub@tcet.edu',
      'testclub2@tcet.edu',
      'club@test.com',
      'testuser@tcet.edu'
    ]

    for (const email of testEmails) {
      const deleted = await User.findOneAndDelete({ email })
      if (deleted) {
        console.log(`Deleted test user: ${email} (${deleted.role})`)
      }
    }

    console.log('Test cleanup completed')
    process.exit(0)
  } catch (error) {
    console.error('Error clearing test users:', error)
    process.exit(1)
  }
}

clearTestUsers()