import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`)

    // Fix indexes after connection
    await fixUserIndexes()

    return conn
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

const fixUserIndexes = async () => {
  try {
    const User = mongoose.model('User')
    
    // Drop the collection indexes and recreate them
    await User.collection.dropIndexes()
    console.log('🔧 Dropped all existing indexes')
    
    // Recreate indexes properly
    await User.createIndexes()
    console.log('✅ Created proper indexes with compound email+role constraint')
    
  } catch (error) {
    console.log('⚠️  Index fix warning:', error.message)
    // Continue anyway - the app should still work
  }
}

export default connectDB