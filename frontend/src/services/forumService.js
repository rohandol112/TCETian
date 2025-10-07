import apiService from './api.js'

export const forumService = {
  // Get all forums with filtering
  async getForums(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/forums?${queryString}` : '/forums'
    return await apiService.get(endpoint)
  },

  // Get single forum by name
  async getForum(forumName) {
    return await apiService.get(`/forums/${forumName}`)
  },

  // Create new forum
  async createForum(forumData) {
    return await apiService.post('/forums', forumData)
  },

  // Join forum
  async joinForum(forumName) {
    return await apiService.post(`/forums/${forumName}/join`)
  },

  // Leave forum
  async leaveForum(forumName) {
    return await apiService.post(`/forums/${forumName}/leave`)
  },

  // Get forum categories
  async getCategories() {
    return await apiService.get('/forums/categories')
  },

  // Get posts from specific forum
  async getForumPosts(forumId, params = {}) {
    const queryString = new URLSearchParams({ ...params, forum: forumId }).toString()
    return await apiService.get(`/posts?${queryString}`)
  }
}