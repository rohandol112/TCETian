import cluster from 'cluster'
import os from 'os'

const numCPUs = os.cpus().length

export function startCluster() {
  if (cluster.isPrimary) {
    console.log(`🚀 Master ${process.pid} is running`)
    console.log(`💻 Starting ${numCPUs} worker processes...`)
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork()
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`💀 Worker ${worker.process.pid} died`)
      console.log('🔄 Starting a new worker...')
      cluster.fork()
    })
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📴 Master received SIGTERM, shutting down workers...')
      for (const id in cluster.workers) {
        cluster.workers[id].kill()
      }
    })
    
    return false // Don't start the app in master process
  } else {
    console.log(`👷 Worker ${process.pid} started`)
    return true // Start the app in worker process
  }
}

// Load balancing configuration for production
export const productionConfig = {
  // Enable clustering in production
  enableClustering: process.env.NODE_ENV === 'production',
  
  // Worker process settings
  workerSettings: {
    maxMemory: '512M', // Restart worker if memory exceeds 512MB
    maxRequests: 10000 // Restart worker after 10k requests (prevents memory leaks)
  },
  
  // PM2 ecosystem file configuration (for production deployment)
  pm2Config: {
    name: 'tcetian-backend',
    script: 'src/app.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '512M',
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }
}