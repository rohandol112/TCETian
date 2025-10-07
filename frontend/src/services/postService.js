import apiService from './api.js'

// Cache management for posts
class PostCache {
  constructor() {
    this.cache = new Map()
    this.maxCacheSize = 1000 // Maximum posts to cache
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  getCacheKey(params) {
    return JSON.stringify(params)
  }

  get(key) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  set(key, data) {
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  invalidate(pattern) {
    // Invalidate cache entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }
}

const postCache = new PostCache()

export const postService = {
  // Get all posts with caching and pagination
  async getPosts(params = {}) {
    const cacheKey = postCache.getCacheKey(params)
    
    // Try to get from cache first (except for page 1 to ensure fresh data)
    if (params.page > 1) {
      const cached = postCache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/posts?${queryString}` : '/posts'
    
    const response = await apiService.get(endpoint)
    
    // Cache the response (except for real-time sensitive queries)
    if (!params.sort || params.sort !== 'new') {
      postCache.set(cacheKey, response)
    }
    
    return response
  },

  // Get posts with infinite scroll support
  async getPostsInfinite(params = {}, existingPosts = []) {
    try {
      const response = await this.getPosts(params)
      const { posts, pagination } = response.data
      
      // Merge with existing posts and remove duplicates
      const existingIds = new Set(existingPosts.map(p => p._id))
      const newPosts = posts.filter(post => !existingIds.has(post._id))
      const allPosts = params.page === 1 ? posts : [...existingPosts, ...newPosts]
      
      return {
        ...response,
        data: {
          posts: allPosts,
          pagination,
          hasMore: pagination.hasNextPage,
          isFirstPage: params.page === 1
        }
      }
    } catch (error) {
      throw error
    }
  },

  // Get single post by ID with caching
  async getPost(postId) {
    const cacheKey = `post:${postId}`
    const cached = postCache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const response = await apiService.get(`/posts/${postId}`)
    postCache.set(cacheKey, response)
    return response
  },

  // Get trending posts with short cache
  async getTrendingPosts(limit = 5) {
    const cacheKey = `trending:${limit}`
    const cached = postCache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const response = await apiService.get(`/posts/trending?limit=${limit}`)
    
    // Cache trending for 2 minutes only
    postCache.set(cacheKey, response)
    setTimeout(() => postCache.invalidate('trending'), 2 * 60 * 1000)
    
    return response
  },

  // Create new post and invalidate cache
  async createPost(postData) {
    const response = await apiService.post('/posts', postData)
    
    // Invalidate relevant caches
    postCache.invalidate('posts')
    postCache.invalidate('trending')
    
    return response
  },

  // Update post and invalidate cache
  async updatePost(postId, postData) {
    const response = await apiService.put(`/posts/${postId}`, postData)
    
    // Invalidate specific post and lists cache
    postCache.invalidate(postId)
    postCache.invalidate('posts')
    
    return response
  },

  // Delete post and invalidate cache
  async deletePost(postId) {
    const response = await apiService.delete(`/posts/${postId}`)
    
    // Invalidate caches
    postCache.invalidate(postId)
    postCache.invalidate('posts')
    postCache.invalidate('trending')
    
    return response
  },

  // Vote on post (optimistic update)
  async votePost(postId, voteType) {
    const response = await apiService.post(`/posts/${postId}/vote`, { voteType })
    
    // Update cached post if it exists
    const cacheKey = `post:${postId}`
    const cached = postCache.get(cacheKey)
    if (cached && cached.data.post) {
      cached.data.post.voteCount = response.data.voteCount
      cached.data.post.userVote = response.data.userVote
      postCache.set(cacheKey, cached)
    }
    
    return response
  },

  // Save/bookmark post
  async savePost(postId) {
    return await apiService.post(`/posts/${postId}/save`)
  },

  // Unsave/unbookmark post
  async unsavePost(postId) {
    return await apiService.delete(`/posts/${postId}/save`)
  },

  // Batch operations for performance
  async batchVotePost(votes) {
    return await apiService.post('/posts/batch/vote', { votes })
  },

  // Search posts with debouncing support
  async searchPosts(query, filters = {}) {
    const params = {
      search: query,
      ...filters,
      limit: 20
    }
    
    return await this.getPosts(params)
  },

  // Clear cache (useful for logout or manual refresh)
  clearCache() {
    postCache.clear()
  },

  // Get cache statistics (for debugging)
  getCacheStats() {
    return {
      size: postCache.cache.size,
      maxSize: postCache.maxCacheSize,
      keys: Array.from(postCache.cache.keys())
    }
  }
}

export default postService