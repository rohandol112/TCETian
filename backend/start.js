#!/usr/bin/env node

/**
 * Production-ready startup script for TCETian Backend
 * This script ensures proper error handling and graceful shutdown
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception! Shutting down...', err)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection! Shutting down...', err)
  process.exit(1)
})

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`📡 Received ${signal}. Starting graceful shutdown...`)
  
  // Give the server time to finish existing requests
  setTimeout(() => {
    console.log('👋 Graceful shutdown completed')
    process.exit(0)
  }, 5000)
}

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start the main application
try {
  console.log('🚀 Starting TCETian Backend...')
  console.log('📊 Node.js version:', process.version)
  console.log('🏗️ Environment:', process.env.NODE_ENV || 'development')
  
  // Import and start the main app
  await import('./src/app.js')
  
} catch (error) {
  console.error('❌ Failed to start application:', error)
  process.exit(1)
}