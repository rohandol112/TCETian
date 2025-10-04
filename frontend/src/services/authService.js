import apiService from './api.js'

export const authService = {
  // Register new user
  async register(userData) {
    const response = await apiService.post('/auth/register', userData)
    if (response.data?.token) {
      apiService.setAuthToken(response.data.token)
    }
    return response
  },

  // Login user
  async login(credentials) {
    const response = await apiService.post('/auth/login', credentials)
    if (response.data?.token) {
      apiService.setAuthToken(response.data.token)
    }
    return response
  },

  // Logout user
  logout() {
    apiService.removeAuthToken()
  },

  // Get current user profile
  async getProfile() {
    return await apiService.get('/auth/me')
  },

  // Update user profile
  async updateProfile(profileData) {
    return await apiService.put('/auth/profile', profileData)
  },

  // Change password
  async changePassword(passwordData) {
    return await apiService.put('/auth/change-password', passwordData)
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!apiService.getAuthToken()
  }
}