import mongoose from 'mongoose'
import User from './src/models/User.js'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

dotenv.config()

const testImageUpload = async () => {
  try {
    console.log('🔍 Testing image upload functionality...')
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find a club user for authentication
    const club = await User.findOne({ role: 'club' })
    if (!club) {
      console.log('❌ No club user found for testing')
      return
    }

    console.log('👤 Using club:', club.clubName || club.name)

    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])

    // Test the upload endpoint directly
    console.log('\n🧪 Testing file upload...')
    const form = new FormData()
    
    // Add all required event fields
    form.append('title', 'Test Event with Image Upload')
    form.append('description', 'Testing image upload functionality')
    form.append('category', 'Technical')
    form.append('eventDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    form.append('eventTime', '14:00')
    form.append('duration', '2')
    form.append('venue', 'Test Venue')
    form.append('capacity', '100')
    form.append('registrationDeadline', new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString())
    form.append('contactEmail', club.email)
    form.append('tags', JSON.stringify(['test', 'upload']))
    form.append('requirements', JSON.stringify(['testing']))
    
    // Add the image file
    form.append('poster', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    })

    // Make the request
    const response = await fetch('http://localhost:5000/api/events', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${generateTestToken(club._id)}`,
        ...form.getHeaders()
      }
    })

    const result = await response.json()
    console.log('\n📡 Upload Response Status:', response.status)
    console.log('📋 Upload Response:', result)

    if (response.ok) {
      console.log('✅ Image upload test successful!')
      console.log('🖼️ Image URL:', result.data.event.imageUrl)
    } else {
      console.log('❌ Image upload test failed')
    }

  } catch (error) {
    console.error('❌ Test error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Simple JWT token generator for testing
import jwt from 'jsonwebtoken'

const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

testImageUpload()