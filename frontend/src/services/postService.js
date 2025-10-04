import apiService from './api.js'

export const postService = {
  // Get all posts with filtering
  async getPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/posts?${queryString}` : '/posts'
    return await apiService.get(endpoint)
  },

  // Get single post by ID
  async getPost(postId) {
    return await apiService.get(`/posts/${postId}`)
  },

  // Get trending posts
  async getTrendingPosts(limit = 5) {
    return await apiService.get(`/posts/trending?limit=${limit}`)
  },

  // Create new post
  async createPost(postData) {
    return await apiService.post('/posts', postData)
  },

  // Update post
  async updatePost(postId, postData) {
    return await apiService.put(`/posts/${postId}`, postData)
  },

  // Delete post
  async deletePost(postId) {
    return await apiService.delete(`/posts/${postId}`)
  },

  // Vote on post
  async votePost(postId, voteType) {
    return await apiService.post(`/posts/${postId}/vote`, { voteType })
  },

  // Save/bookmark post
  async savePost(postId) {
    return await apiService.post(`/posts/${postId}/save`)
  },

  // Unsave/unbookmark post
  async unsavePost(postId) {
    return await apiService.delete(`/posts/${postId}/save`)
  }
}

export default postService