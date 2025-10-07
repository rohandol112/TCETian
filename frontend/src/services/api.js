// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Aggressively block ANY server-side execution
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('🚨 SERVER-SIDE DETECTED - All API calls blocked to prevent Vercel DNS errors')
    return 'BLOCKED_SSR'
  }

  // Check for explicit VITE_API_URL first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Check for VITE_API_BASE_URL (alternative naming)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Production fallback - using your actual Render URL
  if (import.meta.env.PROD) {
    return 'https://tcetian.onrender.com/api'
  }
  
  // Development fallback
  return 'http://localhost:5000/api'
}

// Initialize API_BASE_URL only on client-side
let API_BASE_URL = null
if (typeof window !== 'undefined') {
  API_BASE_URL = getApiBaseUrl()
  console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    API_BASE_URL,
    mode: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
    environment: import.meta.env.VITE_ENVIRONMENT
  })
} else {
  console.log('🚨 Server-side detected - API service disabled')
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token')
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('token', token)
  }

  // Remove auth token
  removeAuthToken() {
    localStorage.removeItem('token')
  }

  // Get auth headers
  getAuthHeaders(isFormData = false) {
    const token = this.getAuthToken()
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    // Aggressively block server-side API calls to prevent Vercel DNS errors
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('🚨 API call blocked on server-side:', endpoint)
      return { 
        success: false, 
        message: 'Server-side API calls are disabled to prevent Vercel DNS errors',
        data: null,
        error: 'SSR_BLOCKED'
      }
    }

    // Check if baseURL is blocked (server-side detected)
    if (this.baseURL === 'BLOCKED_SSR') {
      console.warn('🚨 API baseURL blocked for server-side rendering')
      return { 
        success: false, 
        message: 'API not available during server-side rendering',
        data: null,
        error: 'SSR_BLOCKED'
      }
    }

    // Check if baseURL is available
    if (!this.baseURL) {
      console.warn('🚨 API baseURL not available')
      return { 
        success: false, 
        message: 'API not available',
        data: null,
        error: 'NO_API_URL'
      }
    }

    const url = `${this.baseURL}${endpoint}`
    const isFormData = options.body instanceof FormData
    
    const config = {
      headers: this.getAuthHeaders(isFormData),
      ...options
    }

    console.log('🌐 API Request:', {
      method: options.method || 'GET',
      url,
      headers: config.headers,
      hasBody: !!options.body,
      isFormData
    })

    try {
      const response = await fetch(url, config)
      
      console.log('📡 API Response Status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      })

      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.warn('⚠️ Non-JSON response:', text)
        data = { success: false, message: 'Invalid response format', raw: text }
      }

      if (!response.ok) {
        console.error('❌ API Error Response:', data)
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log('✅ API Success Response:', data)
      return data
    } catch (error) {
      console.error('❌ API Network Error:', {
        message: error.message,
        name: error.name,
        url,
        endpoint
      })
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.')
      }
      
      throw error
    }
  }

  // GET request
  async get(endpoint) {
    return this.apiCall(endpoint, { method: 'GET' })
  }

  // POST request
  async post(endpoint, body) {
    return this.apiCall(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    })
  }

  // PUT request
  async put(endpoint, body) {
    return this.apiCall(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.apiCall(endpoint, { method: 'DELETE' })
  }

  // Clear all caches and force refresh
  clearCache() {
    console.log('🧹 Clearing all caches...')
    
    // Clear localStorage cache items
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes('cache') || key.includes('events') || key.includes('api')
    )
    cacheKeys.forEach(key => {
      localStorage.removeItem(key)
      console.log('🗑️ Removed cache key:', key)
    })

    // Clear sessionStorage cache items
    const sessionCacheKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('cache') || key.includes('events') || key.includes('api')
    )
    sessionCacheKeys.forEach(key => {
      sessionStorage.removeItem(key)
      console.log('🗑️ Removed session cache key:', key)
    })

    console.log('✅ Cache cleared successfully')
  }
}

export default new ApiService()