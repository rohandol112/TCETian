import mongoose from 'mongoose'

export class DatabaseMonitor {
  static async getUsageStats() {
    try {
      const db = mongoose.connection.db
      
      // Get database stats
      const stats = await db.stats()
      
      // Get collection sizes
      const collections = await db.listCollections().toArray()
      const collectionStats = {}
      
      for (const collection of collections) {
        const collStats = await db.collection(collection.name).stats()
        collectionStats[collection.name] = {
          documents: collStats.count,
          avgObjSize: collStats.avgObjSize,
          totalSize: collStats.size,
          storageSize: collStats.storageSize
        }
      }
      
      return {
        totalSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexSize: stats.indexSize,
        collections: Object.keys(collectionStats).length,
        totalDocuments: stats.objects,
        avgObjSize: stats.avgObjSize,
        collectionDetails: collectionStats,
        freeSpaceRemaining: (512 * 1024 * 1024) - stats.storageSize, // 512MB - used
        usagePercentage: ((stats.storageSize / (512 * 1024 * 1024)) * 100).toFixed(2)
      }
    } catch (error) {
      console.error('Error getting DB stats:', error)
      return null
    }
  }
  
  static async logUsageAlert() {
    const stats = await this.getUsageStats()
    
    if (stats) {
      console.log(`📊 Database Usage: ${stats.usagePercentage}%`)
      console.log(`💾 Storage Used: ${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB / 512 MB`)
      console.log(`📄 Total Documents: ${stats.totalDocuments}`)
      
      if (stats.usagePercentage > 80) {
        console.warn('⚠️  WARNING: Database usage above 80%! Consider upgrading.')
      }
      
      if (stats.usagePercentage > 90) {
        console.error('🚨 CRITICAL: Database usage above 90%! Upgrade immediately!')
      }
    }
  }
  
  static startMonitoring() {
    // Check usage every hour
    setInterval(() => {
      this.logUsageAlert()
    }, 60 * 60 * 1000)
    
    // Initial check
    this.logUsageAlert()
  }
}

// Usage monitoring endpoint
export const getUsageStats = async (req, res) => {
  try {
    const stats = await DatabaseMonitor.getUsageStats()
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get database statistics'
      })
    }
    
    res.json({
      success: true,
      data: {
        usage: stats,
        recommendations: generateRecommendations(stats)
      }
    })
  } catch (error) {
    console.error('Usage stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

function generateRecommendations(stats) {
  const recommendations = []
  
  if (stats.usagePercentage > 70) {
    recommendations.push({
      type: 'warning',
      message: 'Consider implementing data archiving for old posts and logs'
    })
  }
  
  if (stats.usagePercentage > 80) {
    recommendations.push({
      type: 'urgent',
      message: 'Upgrade to paid tier recommended'
    })
  }
  
  if (stats.collectionDetails.useractivity?.documents > 10000) {
    recommendations.push({
      type: 'optimization',
      message: 'Implement TTL indexes for user activity logs'
    })
  }
  
  return recommendations
}