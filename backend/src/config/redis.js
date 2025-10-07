// Redis configuration for high-concurrency scaling
import redis from 'redis'

class RedisManager {
  constructor() {
    this.client = null
    this.isConnected = false
  }
  
  async connect() {
    // Skip Redis connection if disabled
    if (process.env.ENABLE_REDIS !== 'true') {
      console.log('📡 Redis disabled in configuration')
      return
    }
    
    try {
      // Use Redis Cloud free tier or local Redis
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        },
        // Connection pool settings for high concurrency
        database: 0,
        retry_delay_on_failover: 100,
        enable_offline_queue: false
      })
      
      this.client.on('connect', () => {
        console.log('📡 Redis Client Connected')
      })
      
      this.client.on('ready', () => {
        console.log('📡 Redis Client Ready')
        this.isConnected = true
      })
      
      this.client.on('error', (err) => {
        console.error('📡 Redis Client Error:', err)
        this.isConnected = false
      })
      
      this.client.on('end', () => {
        console.log('📡 Redis Client Disconnected')
        this.isConnected = false
      })
      
      await this.client.connect()
      
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message)
      console.log('⚠️  Continuing without Redis cache...')
    }
  }
  
  async get(key) {
    if (!this.isConnected) return null
    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }
  
  async set(key, value, expireInSeconds = 3600) {
    if (!this.isConnected) return false
    try {
      await this.client.setEx(key, expireInSeconds, value)
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }
  
  async del(key) {
    if (!this.isConnected) return false
    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }
  
  async exists(key) {
    if (!this.isConnected) return false
    try {
      return await this.client.exists(key)
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }
  
  // Cache wrapper for database queries
  async cacheQuery(key, queryFunction, expireInSeconds = 300) {
    // Try to get from cache first
    const cached = await this.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    
    // Execute query if not in cache
    const result = await queryFunction()
    
    // Store in cache
    await this.set(key, JSON.stringify(result), expireInSeconds)
    
    return result
  }
  
  // Rate limiting helper
  async checkRateLimit(identifier, limit = 100, windowInSeconds = 3600) {
    if (!this.isConnected) return { allowed: true, remaining: limit }
    
    try {
      const key = `rate_limit:${identifier}`
      const current = await this.client.incr(key)
      
      if (current === 1) {
        await this.client.expire(key, windowInSeconds)
      }
      
      const remaining = Math.max(0, limit - current)
      const allowed = current <= limit
      
      return { allowed, remaining, current }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true, remaining: limit }
    }
  }
}

export default new RedisManager()

// Caching middleware for expensive routes
export const cacheMiddleware = (expireInSeconds = 300) => {
  return async (req, res, next) => {
    // Skip caching for authenticated requests or mutations
    if (req.method !== 'GET' || req.headers.authorization) {
      return next()
    }
    
    const cacheKey = `cache:${req.originalUrl}`
    
    try {
      const cached = await RedisManager.get(cacheKey)
      if (cached) {
        console.log(`📦 Cache HIT: ${req.originalUrl}`)
        return res.json(JSON.parse(cached))
      }
    } catch (error) {
      console.error('Cache middleware error:', error)
    }
    
    // Intercept response to cache it
    const originalSend = res.json
    res.json = function(data) {
      if (res.statusCode === 200 && data.success) {
        RedisManager.set(cacheKey, JSON.stringify(data), expireInSeconds)
          .catch(err => console.error('Cache save error:', err))
      }
      return originalSend.call(this, data)
    }
    
    next()
  }
}