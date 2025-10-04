const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

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
    const headers = {}
    
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
    const url = `${this.baseURL}${endpoint}`
    const isFormData = options.body instanceof FormData
    
    const config = {
      headers: this.getAuthHeaders(isFormData),
      ...options
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
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
}

export default new ApiService()