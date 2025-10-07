import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket?.connected) {
      return this.socket
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts
    })

    this.setupEventListeners()
    return this.socket
  }

  // Setup event listeners for connection management
  setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Connected to server')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached')
        this.disconnect()
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`)
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after maximum attempts')
      this.isConnected = false
    })
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Join social feed for real-time updates
  joinSocialFeed() {
    if (this.socket?.connected) {
      this.socket.emit('join_social_feed')
    }
  }

  // Leave social feed
  leaveSocialFeed() {
    if (this.socket?.connected) {
      this.socket.emit('leave_social_feed')
    }
  }

  // Join a specific post room for comments
  joinPost(postId) {
    if (this.socket?.connected && postId) {
      this.socket.emit('join_post', postId)
    }
  }

  // Leave a specific post room
  leavePost(postId) {
    if (this.socket?.connected && postId) {
      this.socket.emit('leave_post', postId)
    }
  }

  // Send typing indicator for comments
  sendTypingComment(postId, isTyping) {
    if (this.socket?.connected && postId) {
      this.socket.emit('typing_comment', { postId, isTyping })
    }
  }

  // Update user status
  updateUserStatus(status) {
    if (this.socket?.connected) {
      this.socket.emit('user_status', status)
    }
  }

  // Listen for new posts
  onNewPost(callback) {
    if (this.socket) {
      this.socket.on('new_post', callback)
    }
  }

  // Listen for post updates (votes, etc.)
  onPostUpdate(callback) {
    if (this.socket) {
      this.socket.on('post_updated', callback)
    }
  }

  // Listen for new comments
  onNewComment(callback) {
    if (this.socket) {
      this.socket.on('new_comment', callback)
    }
  }

  // Listen for comment updates
  onCommentUpdate(callback) {
    if (this.socket) {
      this.socket.on('comment_updated', callback)
    }
  }

  // Listen for notifications
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback)
    }
  }

  // Listen for user status updates
  onUserStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('user_status_update', callback)
    }
  }

  // Listen for typing indicators
  onUserTypingComment(callback) {
    if (this.socket) {
      this.socket.on('user_typing_comment', callback)
    }
  }

  // Listen for profile updates
  onProfileUpdate(callback) {
    if (this.socket) {
      this.socket.on('profile_updated', callback)
    }
  }

  // Listen for user stats updates
  onUserStatsUpdate(callback) {
    if (this.socket) {
      this.socket.on('user_stats_updated', callback)
    }
  }

  // Listen for vote updates
  onVoteUpdate(callback) {
    if (this.socket) {
      this.socket.on('vote_updated', callback)
    }
  }

  // Event-related methods
  // Listen for new events
  onNewEvent(callback) {
    if (this.socket) {
      this.socket.on('new_event', callback)
    }
  }

  // Listen for event updates
  onEventUpdate(callback) {
    if (this.socket) {
      this.socket.on('event_updated', callback)
    }
  }

  // Listen for RSVP updates
  onRSVPUpdate(callback) {
    if (this.socket) {
      this.socket.on('rsvp_updated', callback)
    }
  }

  // Join events feed for real-time updates
  joinEventsFeed() {
    if (this.socket?.connected) {
      this.socket.emit('join_events_feed')
    }
  }

  // Leave events feed
  leaveEventsFeed() {
    if (this.socket?.connected) {
      this.socket.emit('leave_events_feed')
    }
  }

  // Join specific event room
  joinEvent(eventId) {
    if (this.socket?.connected && eventId) {
      this.socket.emit('join_event', eventId)
    }
  }

  // Leave specific event room
  leaveEvent(eventId) {
    if (this.socket?.connected && eventId) {
      this.socket.emit('leave_event', eventId)
    }
  }

  // Emit profile update
  emitProfileUpdate(profileData) {
    if (this.socket?.connected) {
      this.socket.emit('profile_update', profileData)
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event)
    }
  }

  // Get connection status
  get connected() {
    return this.socket?.connected || false
  }

  // Get socket ID
  get id() {
    return this.socket?.id || null
  }
}

// Create singleton instance
export default new SocketService()