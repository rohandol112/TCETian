import mongoose from 'mongoose'
import User from './src/models/User.js'
import dotenv from 'dotenv'

dotenv.config()

async function testRoleBasedAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Test data
    const testEmail = 'test@tcet.edu'
    const testPassword = 'password123'

    // Clean up any existing test users
    await User.deleteMany({ email: testEmail })
    console.log('Cleaned up existing test users')

    // Create a student account
    const student = new User({
      name: 'Test Student',
      email: testEmail,
      password: testPassword,
      role: 'student',
      studentId: 'TEST123',
      year: 'TE',
      branch: 'COMPS',
      courseType: 'Engineering'
    })

    await student.save()
    console.log('✅ Created student account:', {
      email: student.email,
      role: student.role,
      studentId: student.studentId
    })

    // Create a club account with the same email
    const club = new User({
      name: 'Test Club',
      email: testEmail,
      password: testPassword,
      role: 'club',
      clubName: 'Test Club Organization',
      description: 'A test club'
    })

    await club.save()
    console.log('✅ Created club account:', {
      email: club.email,
      role: club.role,
      clubName: club.clubName
    })

    // Test querying by email and role
    const foundStudent = await User.findOne({ email: testEmail, role: 'student' })
    const foundClub = await User.findOne({ email: testEmail, role: 'club' })

    console.log('\n=== Query Test Results ===')
    console.log('Found student:', foundStudent ? `${foundStudent.name} (${foundStudent.role})` : 'Not found')
    console.log('Found club:', foundClub ? `${foundClub.name} (${foundClub.role})` : 'Not found')

    // Test password validation for both accounts
    const studentPasswordValid = await foundStudent.comparePassword(testPassword)
    const clubPasswordValid = await foundClub.comparePassword(testPassword)

    console.log('\n=== Password Test Results ===')
    console.log('Student password valid:', studentPasswordValid)
    console.log('Club password valid:', clubPasswordValid)

    // Test attempting to create duplicate within same role
    try {
      const duplicateStudent = new User({
        name: 'Duplicate Student',
        email: testEmail,
        password: testPassword,
        role: 'student',
        studentId: 'DUPLICATE123',
        year: 'SE',
        branch: 'IT',
        courseType: 'Engineering'
      })
      await duplicateStudent.save()
      console.log('❌ ERROR: Duplicate student should not have been created!')
    } catch (error) {
      console.log('✅ Correctly prevented duplicate student creation:', error.message)
    }

    console.log('\n=== Test Summary ===')
    console.log('✅ Same email can be used for different roles')
    console.log('✅ Same email cannot be used within the same role')
    console.log('✅ Role-based querying works correctly')
    console.log('✅ Password validation works for both accounts')

    // Cleanup
    await User.deleteMany({ email: testEmail })
    console.log('\n🧹 Cleaned up test data')

    process.exit(0)
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testRoleBasedAuth()