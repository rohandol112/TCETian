// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import http from 'http'

import connectDB from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import postRoutes from './routes/postRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import forumRoutes from './routes/forumRoutes.js'


import { errorHandler, notFound } from './middleware/errorHandler.js'
import socketService from './services/socketService.js'
import { ConnectionMonitor, trackConcurrentRequests } from './utils/connectionMonitor.js'
import { startCluster } from './config/cluster.js'
import RedisManager from './config/redis.js'
import performanceRoutes from './routes/performanceRoutes.js'
import { upload } from './utils/imageHandler.js'

// Enable clustering for production
if (process.env.ENABLE_CLUSTERING === 'true') {
  if (!startCluster()) {
    process.exit(0) // Exit if this is the master process
  }
}

const app = express()

// High-concurrency server configuration
const server = http.createServer(app)
server.keepAliveTimeout = 65000  // Keep connections alive longer
server.headersTimeout = 66000    // Prevent header timeout issues
server.maxHeadersCount = 2000    // Increase max headers
server.timeout = 120000          // 2 minute timeout for requests

const PORT = process.env.PORT || 5000

// Initialize WebSocket service
socketService.initialize(server)

// Trust proxy
app.set('trust proxy', 1)

// Start connection monitoring
ConnectionMonitor.startMonitoring()

// Track concurrent requests
app.use(trackConcurrentRequests())

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
})
app.use(limiter)

// CORS - Enhanced for production deployment
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://tcetian.vercel.app', // Production frontend
      'http://localhost:5173', // Development
      'http://127.0.0.1:5173', // Alternative localhost
      'http://localhost:3000', // Alternative dev port
    ]
    
    // Allow all Vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(undefined)) {
      callback(null, true)
    } else {
      console.log('❌ CORS would block origin:', origin, 'but allowing for debugging')
      callback(null, true) // Allow for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files (uploads) with proper CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
}, express.static('uploads'))

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TCETian Backend API is running!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      events: '/api/events',
      users: '/api/users',
      posts: '/api/posts'
    },
    timestamp: new Date().toISOString()
  })
})

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'TCETian API is running!',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV,
    uploadsDir: 'uploads/',
    staticFileServing: 'enabled'
  })
})

// Test image upload endpoint (for debugging)
app.post('/test-upload', upload.single('poster'), async (req, res) => {
  console.log('🧪 Test upload received:', {
    file: req.file,
    body: req.body,
    contentType: req.headers['content-type']
  })
  
  if (req.file) {
    try {
      const { imageHandler } = await import('./utils/imageHandler.js')
      const imageUrl = imageHandler.processUploadedImage ? imageHandler.processUploadedImage(req.file) : `/uploads/events/${req.file.filename}`
      
      res.json({
        success: true,
        message: 'Test upload successful',
        file: {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
          url: imageUrl
        }
      })
    } catch (error) {
      console.error('Test upload error:', error)
      res.status(500).json({
        success: false,
        message: 'Error processing uploaded file: ' + error.message
      })
    }
  } else {
    res.status(400).json({
      success: false,
      message: 'No file received - expected field name: poster'
    })
  }
})

// Test tag processing endpoint
app.post('/test-tags', (req, res) => {
  console.log('🏷️ Test tags received:', {
    body: req.body,
    tags: req.body.tags,
    tagsType: typeof req.body.tags
  })
  
  let processedTags = []
  
  if (req.body.tags && typeof req.body.tags === 'string') {
    try {
      processedTags = JSON.parse(req.body.tags)
      console.log('🏷️ Parsed tags:', processedTags)
    } catch (err) {
      console.error('❌ Error parsing tags:', err)
      processedTags = []
    }
  }
  
  res.json({
    success: true,
    received: {
      raw: req.body.tags,
      type: typeof req.body.tags,
      processed: processedTags
    }
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/forums', forumRoutes)
app.use('/api/analytics', analyticsRoutes)

// Simple test endpoint for CORS verification
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CORS is working! Frontend can connect to backend.',
    timestamp: new Date().toISOString(),
    headers: req.headers.origin
  })
})


// Performance monitoring routes
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
  app.use('/api/performance', performanceRoutes)
}

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Startup sequence - ensure database connection before starting server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log('📦 Connecting to MongoDB...')
    await connectDB()
    
    // Initialize Redis connection
    console.log('📡 Connecting to Redis...')
    await RedisManager.connect()
    
    // Test email service connection
    console.log('📧 Testing email service...')
    const { default: EmailService } = await import('./services/emailService.js')
    const emailService = new EmailService()
    await emailService.testConnection()
    
    // Start reminder service for automated emails
    console.log('📅 Starting reminder service...')
    const { default: reminderService } = await import('./services/reminderService.js')
    reminderService.start()
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 TCETian Backend running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV}`)
      console.log(`🌐 Health check: http://localhost:${PORT}/health`)
      console.log(`🔌 WebSocket server initialized`)
      console.log(`👷 Worker PID: ${process.pid}`)
      console.log(`🎯 Ready for high concurrency!`)
    })
    
  } catch (error) {
    console.error('❌ Server startup failed:', error.message)
    process.exit(1)
  }
}

// Start the application
startServer()