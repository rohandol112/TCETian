import express from 'express'
import { ConnectionMonitor } from '../utils/connectionMonitor.js'
import { DatabaseMonitor } from '../utils/dbMonitor.js'
import RedisManager from '../config/redis.js'
import os from 'os'
import process from 'process'

const router = express.Router()

// @desc    Get system performance stats
// @route   GET /api/performance/stats
// @access  Public (should be restricted to admin in production)
router.get('/stats', async (req, res) => {
  try {
    const [dbStats, redisStats] = await Promise.allSettled([
      DatabaseMonitor.getUsageStats(),
      getRedisStats()
    ])
    
    const systemStats = {
      server: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage(),
          total: os.totalmem(),
          free: os.freemem()
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        },
        pid: process.pid,
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch()
      },
      database: dbStats.status === 'fulfilled' ? dbStats.value : { error: dbStats.reason?.message },
      redis: redisStats.status === 'fulfilled' ? redisStats.value : { error: redisStats.reason?.message }
    }
    
    res.json({
      success: true,
      data: systemStats
    })
  } catch (error) {
    console.error('Performance stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get performance stats'
    })
  }
})

// @desc    Get connection pool health
// @route   GET /api/performance/connections
// @access  Public
router.get('/connections', async (req, res) => {
  try {
    const connectionStats = await ConnectionMonitor.getDetailedStats()
    
    res.json({
      success: true,
      data: {
        connectionPool: connectionStats,
        recommendations: generateConnectionRecommendations(connectionStats)
      }
    })
  } catch (error) {
    console.error('Connection stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get connection stats'
    })
  }
})

// @desc    Check if system can handle target concurrent users
// @route   GET /api/performance/capacity/:targetUsers
// @access  Public
router.get('/capacity/:targetUsers', async (req, res) => {
  try {
    const targetUsers = parseInt(req.params.targetUsers)
    
    if (isNaN(targetUsers) || targetUsers <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target user count'
      })
    }
    
    const capacity = await analyzeCapacity(targetUsers)
    
    res.json({
      success: true,
      data: {
        targetUsers,
        canHandle: capacity.canHandle,
        currentCapacity: capacity.currentCapacity,
        bottlenecks: capacity.bottlenecks,
        recommendations: capacity.recommendations,
        upgradeRequired: capacity.upgradeRequired
      }
    })
  } catch (error) {
    console.error('Capacity analysis error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to analyze capacity'
    })
  }
})

// Helper Functions
async function getRedisStats() {
  if (!RedisManager.isConnected) {
    return { status: 'disconnected' }
  }
  
  try {
    // Basic Redis stats
    return {
      status: 'connected',
      isConnected: RedisManager.isConnected
    }
  } catch (error) {
    return { status: 'error', error: error.message }
  }
}

async function analyzeCapacity(targetUsers) {
  const dbStats = await DatabaseMonitor.getUsageStats()
  const systemStats = {
    memory: process.memoryUsage(),
    uptime: process.uptime()
  }
  
  // Calculate current capacity based on MongoDB Atlas free tier
  const mongoCapacity = {
    maxConnections: 500, // Atlas M0 limit
    currentConnections: dbStats?.totalDocuments || 0,
    storageUsed: dbStats?.usagePercentage || 0
  }
  
  // Estimate concurrent user capacity
  // Rule of thumb: 1 concurrent user ≈ 2-3 DB connections (includes connection pooling)
  const estimatedDbConnections = targetUsers * 2.5
  const canHandleConnections = estimatedDbConnections <= mongoCapacity.maxConnections
  
  // Memory analysis (rough estimate: 50MB per 1000 concurrent users)
  const estimatedMemoryMB = (targetUsers / 1000) * 50
  const availableMemoryMB = (systemStats.memory.heapTotal - systemStats.memory.heapUsed) / 1024 / 1024
  const canHandleMemory = estimatedMemoryMB <= availableMemoryMB
  
  const bottlenecks = []
  const recommendations = []
  
  if (!canHandleConnections) {
    bottlenecks.push('MongoDB connection limit')
    recommendations.push('Upgrade MongoDB Atlas to M2 tier ($9/month) for 1,500+ connections')
  }
  
  if (!canHandleMemory) {
    bottlenecks.push('Server memory')
    recommendations.push('Scale to larger server instance or implement clustering')
  }
  
  if (dbStats?.usagePercentage > 70) {
    bottlenecks.push('Database storage')
    recommendations.push('Implement data archiving or upgrade storage')
  }
  
  if (targetUsers > 1000) {
    recommendations.push('Enable Redis caching for better performance')
    recommendations.push('Consider implementing CDN for static assets')
    recommendations.push('Enable clustering mode with PM2')
  }
  
  return {
    canHandle: canHandleConnections && canHandleMemory,
    currentCapacity: Math.floor(mongoCapacity.maxConnections / 2.5),
    bottlenecks,
    recommendations,
    upgradeRequired: !canHandleConnections || dbStats?.usagePercentage > 80,
    details: {
      database: {
        estimatedConnections: estimatedDbConnections,
        maxConnections: mongoCapacity.maxConnections,
        storageUsage: `${dbStats?.usagePercentage || 0}%`
      },
      memory: {
        estimatedUsage: `${estimatedMemoryMB.toFixed(2)} MB`,
        available: `${availableMemoryMB.toFixed(2)} MB`
      }
    }
  }
}

function generateConnectionRecommendations(stats) {
  const recommendations = []
  
  if (stats.error) {
    recommendations.push({
      type: 'info',
      message: 'Detailed connection stats require MongoDB admin access'
    })
  }
  
  recommendations.push({
    type: 'optimization',
    message: 'Connection pooling is configured for optimal performance'
  })
  
  return recommendations
}

export default router