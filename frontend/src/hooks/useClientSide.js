import { useState, useEffect } from 'react'

/**
 * Hook to detect if we're running on the client-side
 * Prevents server-side rendering issues with API calls
 */
export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook to safely make API calls only on client-side
 */
export const useClientSideAPI = () => {
  const isClient = useIsClient()
  
  const safeApiCall = async (apiFunction, ...args) => {
    if (!isClient) {
      console.warn('🚨 API call skipped - server-side rendering detected')
      return { 
        success: false, 
        message: 'API calls disabled during SSR',
        data: null,
        error: 'SSR_SKIP'
      }
    }
    
    try {
      return await apiFunction(...args)
    } catch (error) {
      console.error('🚨 Client-side API call failed:', error)
      return { 
        success: false, 
        message: error.message || 'API call failed',
        data: null,
        error: 'CLIENT_ERROR'
      }
    }
  }

  return { isClient, safeApiCall }
}