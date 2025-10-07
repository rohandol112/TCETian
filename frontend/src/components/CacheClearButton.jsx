import { useState } from 'react'
import { FiTrash2, FiRefreshCw } from 'react-icons/fi'
import apiService from '../services/api'
import { useToast } from '../context/ToastContext'

const CacheClearButton = ({ className = '' }) => {
  const [clearing, setClearing] = useState(false)
  const { showToast } = useToast()

  const clearAllCaches = async () => {
    if (clearing) return

    setClearing(true)
    try {
      // Clear API service caches
      apiService.clearCache()
      
      // Clear browser caches if supported
      if ('caches' in window) {
        const cacheNames = await window.caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => window.caches.delete(cacheName))
        )
        console.log('🧹 Cleared browser caches:', cacheNames)
      }

      // Force reload to ensure fresh data
      setTimeout(() => {
        window.location.reload()
      }, 500)

      showToast('Cache cleared successfully! Refreshing...', 'success')
    } catch (error) {
      console.error('❌ Error clearing cache:', error)
      showToast('Error clearing cache', 'error')
    } finally {
      setClearing(false)
    }
  }

  return (
    <button
      onClick={clearAllCaches}
      disabled={clearing}
      className={`flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 
        text-red-400 rounded-lg transition-all duration-200 disabled:opacity-50 
        disabled:cursor-not-allowed ${className}`}
      title="Clear all caches and refresh"
    >
      {clearing ? (
        <FiRefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <FiTrash2 className="w-4 h-4" />
      )}
      <span className="text-sm">
        {clearing ? 'Clearing...' : 'Clear Cache'}
      </span>
    </button>
  )
}

export default CacheClearButton