// Test script to verify club registration
import mongoose from 'mongoose'
import User from './src/models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const testClubRegistration = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Test club data
    const clubData = {
      name: 'Test Tech Club',
      email: 'testclub@tcet.ac.in',
      password: 'testpass123',
      role: 'club',
      clubName: 'Test Tech Club',
      description: 'A test club for development'
    }

    console.log('Creating club user with data:', clubData)
    
    const user = new User(clubData)
    await user.save()
    
    console.log('Club user created successfully:', user._id)
    
    // Clean up
    await User.findByIdAndDelete(user._id)
    console.log('Test user deleted')
    
  } catch (error) {
    console.error('Test failed:', {
      message: error.message,
      name: error.name,
      errors: error.errors
    })
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

testClubRegistration()