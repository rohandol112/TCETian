import apiService from './api.js'

export const commentService = {
  // Get comments for a post
  async getComments(postId, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/comments/${postId}?${queryString}` : `/comments/${postId}`
    return await apiService.get(endpoint)
  },

  // Create new comment
  async createComment(commentData) {
    return await apiService.post('/comments', commentData)
  },

  // Update comment
  async updateComment(commentId, content) {
    return await apiService.put(`/comments/${commentId}`, { content })
  },

  // Delete comment
  async deleteComment(commentId) {
    return await apiService.delete(`/comments/${commentId}`)
  },

  // Vote on comment
  async voteComment(commentId, voteType) {
    return await apiService.post(`/comments/${commentId}/vote`, { voteType })
  }
}

export default commentService