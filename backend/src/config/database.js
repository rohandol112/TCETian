import mongoose from 'mongoose'

const connectDB = async (retries = 3) => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...')
    
    // Optimized connection settings with better timeout handling
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection Pool Settings
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 50,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS) || 30000,
      
      // Increased timeouts for better connectivity
      serverSelectionTimeoutMS: 30000, // Increased from 5s to 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Add explicit connection timeout
      
      // Buffering Settings
      bufferCommands: true, // Enable buffering for smoother startup
      
      // Retry Settings  
      retryWrites: true,
      
      // Performance Settings
      compressors: ['zlib'],
      zlibCompressionLevel: 6
    })
    
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`)
    console.log(`🔧 Pool Size: ${conn.connection.options?.maxPoolSize || 'Default'}`)
    
    // Monitor connection events
    mongoose.connection.on('disconnected', () => {
      console.warn('📦 MongoDB Disconnected')
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('📦 MongoDB Reconnected')
    })
    
    mongoose.connection.on('error', (err) => {
      console.error('📦 MongoDB Error:', err)
    })
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    
    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts remaining)`)
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      return connectDB(retries - 1)
    }
    
    console.error('🔧 Error details:', error)
    console.error('💡 Troubleshooting tips:')
    console.error('   1. Check your internet connection')
    console.error('   2. Verify MongoDB Atlas cluster is running')
    console.error('   3. Check IP whitelist in MongoDB Atlas')
    console.error('   4. Verify connection string is correct')
    
    throw error // Re-throw to be handled by the startup sequence
  }
}

export default connectDB