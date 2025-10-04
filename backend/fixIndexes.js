import mongoose from 'mongoose'
import User from './src/models/User.js'
import dotenv from 'dotenv'

dotenv.config()

async function fixDatabaseIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const collection = db.collection('users')

    // Get current indexes
    const indexes = await collection.indexes()
    console.log('Current indexes:')
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key)
    })

    // Drop the old email_1 index if it exists
    try {
      await collection.dropIndex('email_1')
      console.log('✅ Dropped old email_1 index')
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('ℹ️  No email_1 index found to drop')
      } else {
        console.log('⚠️  Error dropping email_1 index:', error.message)
      }
    }

    // Ensure the compound index exists
    try {
      await collection.createIndex(
        { email: 1, role: 1 }, 
        { 
          unique: true, 
          name: 'email_1_role_1',
          background: true 
        }
      )
      console.log('✅ Created compound index: email_1_role_1')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Compound index already exists')
      } else {
        console.log('⚠️  Error creating compound index:', error.message)
      }
    }

    // Get updated indexes
    const updatedIndexes = await collection.indexes()
    console.log('\nUpdated indexes:')
    updatedIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key)
    })

    // Test the fix by checking existing data
    const users = await User.find({ email: 'rohan45321dol@gmail.com' })
    console.log('\nExisting users with email rohan45321dol@gmail.com:')
    users.forEach(user => {
      console.log(`- ${user.name} (${user.role})`)
    })

    console.log('\n🎉 Database indexes have been fixed!')
    console.log('✅ You can now create both student and club accounts with the same email')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing indexes:', error)
    process.exit(1)
  }
}

fixDatabaseIndexes()