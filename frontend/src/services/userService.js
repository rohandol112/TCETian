import apiService from './api.js'

export const userService = {
  // Get current user profile
  async getProfile() {
    return await apiService.get('/users/profile')
  },

  // Update user profile
  async updateProfile(profileData) {
    return await apiService.put('/users/profile', profileData)
  },

  // Upload profile picture
  async updateProfilePicture(imageFile) {
    const formData = new FormData()
    formData.append('profilePicture', imageFile)
    return await apiService.post('/users/profile/picture', formData)
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    return await apiService.put('/users/profile/password', {
      currentPassword,
      newPassword
    })
  },

  // Get user by ID (public profile)
  async getUserById(userId) {
    return await apiService.get(`/users/${userId}`)
  },

  // Get user's posts
  async getUserPosts(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/users/${userId}/posts?${queryString}` : `/users/${userId}/posts`
    return await apiService.get(endpoint)
  },

  // Save/unsave post
  async toggleSavePost(postId) {
    return await apiService.post(`/users/posts/${postId}/save`)
  },

  // Get saved posts
  async getSavedPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/users/profile/saved-posts?${queryString}` : `/users/profile/saved-posts`
    return await apiService.get(endpoint)
  },

  // Get all clubs
  async getClubs() {
    return await apiService.get('/users/clubs')
  },

  // Get user activity analytics
  async getUserActivity(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/analytics/activity?${queryString}` : `/analytics/activity`
    return await apiService.get(endpoint)
  },

  // Get detailed user activity
  async getDetailedUserActivity(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/analytics/activity/detailed?${queryString}` : `/analytics/activity/detailed`
    return await apiService.get(endpoint)
  },

  // Get online statistics
  async getOnlineStats() {
    return await apiService.get('/analytics/online-stats')
  },

  // Get user analytics (comprehensive)
  async getUserAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/analytics/user-analytics?${queryString}` : `/analytics/user-analytics`
    return await apiService.get(endpoint)
  }
}

export default userService