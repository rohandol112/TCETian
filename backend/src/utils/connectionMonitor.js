import mongoose from 'mongoose'

export class ConnectionMonitor {
  static startMonitoring() {
    const connection = mongoose.connection
    
    // Log connection pool stats every 30 seconds
    setInterval(() => {
      this.logConnectionStats()
    }, 30000)
    
    // Monitor connection events
    connection.on('connectionPoolCreated', (event) => {
      console.log('🏊 Connection Pool Created:', {
        address: event.address,
        options: {
          maxPoolSize: event.options?.maxPoolSize,
          minPoolSize: event.options?.minPoolSize
        }
      })
    })
    
    connection.on('connectionCreated', (event) => {
      console.log('➕ Connection Created:', event.connectionId)
    })
    
    connection.on('connectionClosed', (event) => {
      console.log('➖ Connection Closed:', event.connectionId)
    })
    
    connection.on('connectionPoolCleared', (event) => {
      console.warn('🚨 Connection Pool Cleared:', event.address)
    })
  }
  
  static logConnectionStats() {
    const db = mongoose.connection
    
    if (db.readyState === 1) { // Connected
      console.log('📊 Connection Pool Status:', {
        readyState: this.getReadyStateText(db.readyState),
        host: db.host,
        name: db.name,
        // Note: Detailed pool stats not directly available in Mongoose
        // This would require MongoDB driver access
      })
    }
  }
  
  static getReadyStateText(state) {
    const states = {
      0: 'Disconnected',
      1: 'Connected', 
      2: 'Connecting',
      3: 'Disconnecting'
    }
    return states[state] || 'Unknown'
  }
  
  static async getDetailedStats() {
    try {
      // Get server status (requires admin privileges on some deployments)
      const admin = mongoose.connection.db.admin()
      const serverStatus = await admin.serverStatus()
      
      return {
        connections: {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available,
          totalCreated: serverStatus.connections.totalCreated
        },
        network: {
          bytesIn: serverStatus.network.bytesIn,
          bytesOut: serverStatus.network.bytesOut,
          numRequests: serverStatus.network.numRequests
        },
        memory: {
          resident: serverStatus.mem.resident,
          virtual: serverStatus.mem.virtual
        }
      }
    } catch (error) {
      // Fallback for restricted access (Atlas free tier)
      return {
        error: 'Detailed stats unavailable (requires admin access)',
        basicInfo: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name
        }
      }
    }
  }
}

// Middleware to track active requests
export const trackConcurrentRequests = () => {
  let activeRequests = 0
  let maxConcurrent = 0
  let totalRequests = 0
  
  return (req, res, next) => {
    activeRequests++
    totalRequests++
    maxConcurrent = Math.max(maxConcurrent, activeRequests)
    
    req.startTime = Date.now()
    
    // Log every 100th request
    if (totalRequests % 100 === 0) {
      console.log('📈 Request Stats:', {
        active: activeRequests,
        maxConcurrent,
        total: totalRequests,
        endpoint: req.path
      })
    }
    
    res.on('finish', () => {
      activeRequests--
      const duration = Date.now() - req.startTime
      
      // Log slow requests (> 1 second)
      if (duration > 1000) {
        console.warn('🐌 Slow Request:', {
          path: req.path,
          method: req.method,
          duration: `${duration}ms`,
          activeConnections: activeRequests
        })
      }
    })
    
    res.on('close', () => {
      activeRequests--
    })
    
    next()
  }
}