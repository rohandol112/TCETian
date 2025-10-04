// Quick Manual Database Index Fix
// Run this script once: node manualIndexFix.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

async function quickIndexFix() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    console.log('\n🔍 Checking current indexes...')
    const indexes = await usersCollection.indexes()
    console.log('Current indexes:')
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`)
    })

    // Drop the problematic email_1 index
    console.log('\n🔧 Fixing indexes...')
    try {
      await usersCollection.dropIndex('email_1')
      console.log('✅ Dropped old email_1 index')
    } catch (error) {
      console.log('ℹ️  email_1 index not found (already removed or never existed)')
    }

    // Create the compound index
    try {
      await usersCollection.createIndex(
        { email: 1, role: 1 }, 
        { unique: true, name: 'email_role_compound' }
      )
      console.log('✅ Created compound index: email_role_compound')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Compound index already exists')
      } else {
        throw error
      }
    }

    console.log('\n✅ Database indexes fixed!')
    console.log('🎉 You can now register club accounts with emails that have student accounts')

    // Test query to verify
    const testUsers = await usersCollection.find({ email: 'rohan45321dol@gmail.com' }).toArray()
    if (testUsers.length > 0) {
      console.log('\n📊 Test query results:')
      testUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.role})`)
      })
    }

    await mongoose.connection.close()
    console.log('\n✅ Database connection closed')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

quickIndexFix()