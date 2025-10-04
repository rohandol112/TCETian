import { createContext, useContext, useEffect, useState } from 'react'
import socketService from '../services/socketService'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [notifications, setNotifications] = useState([])

  // Connect/disconnect socket based on authentication
  useEffect(() => {
    if (user && token) {
      // Connect to socket
      const socket = socketService.connect(token)
      setIsConnected(true)

      // Setup real-time event listeners
      setupEventListeners()

      // Join social feed by default
      socketService.joinSocialFeed()

      // Update user status to online
      socketService.updateUserStatus('online')

      return () => {
        socketService.updateUserStatus('offline')
        socketService.leaveSocialFeed()
        socketService.disconnect()
        setIsConnected(false)
      }
    } else {
      // Disconnect if user logs out
      socketService.disconnect()
      setIsConnected(false)
    }
  }, [user, token])

  const setupEventListeners = () => {
    // Listen for notifications
    socketService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev])
      showToast(notification.message, notification.type || 'info')
    })

    // Listen for user status updates
    socketService.onUserStatusUpdate((update) => {
      // Handle online/offline status updates
      console.log('User status update:', update)
    })

    // Listen for typing indicators
    socketService.onUserTypingComment((data) => {
      // Handle typing indicators in comments
      console.log('User typing:', data)
    })
  }

  // Join a post room for real-time comments
  const joinPostRoom = (postId) => {
    if (isConnected && postId) {
      socketService.joinPost(postId)
    }
  }

  // Leave a post room
  const leavePostRoom = (postId) => {
    if (isConnected && postId) {
      socketService.leavePost(postId)
    }
  }

  // Send typing indicator
  const sendTypingIndicator = (postId, isTyping) => {
    if (isConnected) {
      socketService.sendTypingComment(postId, isTyping)
    }
  }

  // Listen for real-time events with callbacks
  const onNewPost = (callback) => {
    socketService.onNewPost(callback)
    return () => socketService.off('new_post', callback)
  }

  const onPostUpdate = (callback) => {
    socketService.onPostUpdate(callback)
    return () => socketService.off('post_updated', callback)
  }

  const onNewComment = (callback) => {
    socketService.onNewComment(callback)
    return () => socketService.off('new_comment', callback)
  }

  const onCommentUpdate = (callback) => {
    socketService.onCommentUpdate(callback)
    return () => socketService.off('comment_updated', callback)
  }

  const onTypingComment = (callback) => {
    socketService.onUserTypingComment(callback)
    return () => socketService.off('user_typing_comment', callback)
  }

  // Event-related listeners
  const onNewEvent = (callback) => {
    socketService.onNewEvent(callback)
    return () => socketService.off('new_event_created', callback)
  }

  const onEventUpdate = (callback) => {
    socketService.onEventUpdate(callback)
    return () => socketService.off('event_updated', callback)
  }

  const onRSVPUpdate = (callback) => {
    socketService.onRSVPUpdate(callback)
    return () => socketService.off('rsvp_update', callback)
  }

  // Profile update listeners
  const onProfileUpdate = (callback) => {
    socketService.onProfileUpdate(callback)
    return () => socketService.off('profile_updated', callback)
  }

  const onUserStatsUpdate = (callback) => {
    socketService.onUserStatsUpdate(callback)
    return () => socketService.off('user_stats_updated', callback)
  }

  const onVoteUpdate = (callback) => {
    socketService.onVoteUpdate(callback)
    return () => socketService.off('vote_updated', callback)
  }

  // Emit profile updates
  const emitProfileUpdate = (profileData) => {
    if (isConnected) {
      socketService.emitProfileUpdate(profileData)
    }
  }

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([])
  }

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const value = {
    socket: socketService.socket,
    isConnected,
    onlineUsers,
    notifications,
    joinPostRoom,
    leavePostRoom,
    sendTypingIndicator,
    onNewPost,
    onPostUpdate,
    onNewComment,
    onCommentUpdate,
    onTypingComment,
    onProfileUpdate,
    onUserStatsUpdate,
    onVoteUpdate,
    onNewEvent,
    onEventUpdate,
    onRSVPUpdate,
    emitProfileUpdate,
    clearNotifications,
    markNotificationAsRead
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContext