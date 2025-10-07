import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

class SocketService {
  constructor() {
    this.io = null
    this.connectedUsers = new Map() // userId -> socketId
    this.userRooms = new Map() 
    this.userSockets = new Map() // userId -> socket object
    this.userActivity = new Map() // userId -> last activity timestamp
    this.roomUsers = new Map() // roomName -> Set of userIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    })

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.id).select('-password')
        
        if (!user) {
          return next(new Error('User not found'))
        }

        socket.userId = user._id.toString()
        socket.user = user
        next()
      } catch (error) {
        next(new Error('Authentication error'))
      }
    })

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`)
      
      // Store user connection with enhanced tracking
      this.connectedUsers.set(socket.userId, socket.id)
      this.userSockets.set(socket.userId, socket)
      this.userRooms.set(socket.id, new Set())
      this.userActivity.set(socket.userId, new Date())

      // Join user to their personal room for notifications
      socket.join(`user_${socket.userId}`)
      this.userRooms.get(socket.id).add(`user_${socket.userId}`)
      
      // Emit user online status to all connected users
      socket.broadcast.emit('user_online', {
        userId: socket.userId,
        user: {
          _id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role,
          year: socket.user.year,
          branch: socket.user.branch
        },
        timestamp: new Date()
      })

      // Handle joining post rooms for real-time comments
      socket.on('join_post', (postId) => {
        const roomName = `post_${postId}`
        socket.join(roomName)
        this.userRooms.get(socket.id).add(roomName)
        
        // Track users in this post room
        if (!this.roomUsers.has(roomName)) {
          this.roomUsers.set(roomName, new Set())
        }
        this.roomUsers.get(roomName).add(socket.userId)
        
        // Update user activity
        this.userActivity.set(socket.userId, new Date())
        
        // Notify others in the room about user joining
        socket.to(roomName).emit('user_joined_post', {
          userId: socket.userId,
          userName: socket.user.name,
          postId: postId,
          timestamp: new Date()
        })
        
        console.log(`User ${socket.user.name} joined post room: ${roomName}`)
      })

      // Handle leaving post rooms
      socket.on('leave_post', (postId) => {
        const roomName = `post_${postId}`
        socket.leave(roomName)
        this.userRooms.get(socket.id).delete(roomName)
        
        // Remove user from room tracking
        if (this.roomUsers.has(roomName)) {
          this.roomUsers.get(roomName).delete(socket.userId)
          if (this.roomUsers.get(roomName).size === 0) {
            this.roomUsers.delete(roomName)
          }
        }
        
        // Notify others in the room about user leaving
        socket.to(roomName).emit('user_left_post', {
          userId: socket.userId,
          userName: socket.user.name,
          postId: postId,
          timestamp: new Date()
        })
        
        console.log(`User ${socket.user.name} left post room: ${roomName}`)
      })

      // Handle joining social feed for real-time updates
      socket.on('join_social_feed', () => {
        socket.join('social_feed')
        this.userRooms.get(socket.id).add('social_feed')
        
        // Track users in social feed
        if (!this.roomUsers.has('social_feed')) {
          this.roomUsers.set('social_feed', new Set())
        }
        this.roomUsers.get('social_feed').add(socket.userId)
        
        // Update user activity
        this.userActivity.set(socket.userId, new Date())
        
        console.log(`User ${socket.user.name} joined social feed`)
      })

      // Handle leaving social feed
      socket.on('leave_social_feed', () => {
        socket.leave('social_feed')
        this.userRooms.get(socket.id).delete('social_feed')
      })

      // Handle user status updates
      socket.on('user_status', (status) => {
        socket.broadcast.emit('user_status_update', {
          userId: socket.userId,
          status: status,
          user: {
            _id: socket.user._id,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        })
      })

      // Handle typing indicators for comments
      socket.on('typing_comment', ({ postId, isTyping }) => {
        socket.to(`post_${postId}`).emit('user_typing_comment', {
          userId: socket.userId,
          userName: socket.user.name,
          isTyping
        })
      })

      // === EVENT SOCKET HANDLERS ===
      
      // Handle joining events feed
      socket.on('join_events_feed', () => {
        this.joinEventsFeed(socket)
        this.userRooms.get(socket.id).add('events_feed')
      })

      // Handle joining analytics room
      socket.on('join_analytics', () => {
        socket.join('analytics')
        this.userRooms.get(socket.id).add('analytics')
        console.log(`User ${socket.userId} joined analytics room`)
      })

      // Handle leaving analytics room
      socket.on('leave_analytics', () => {
        socket.leave('analytics')
        this.userRooms.get(socket.id).delete('analytics')
        console.log(`User ${socket.userId} left analytics room`)
      })

      // Handle leaving events feed
      socket.on('leave_events_feed', () => {
        this.leaveEventsFeed(socket)
        this.userRooms.get(socket.id).delete('events_feed')
      })

      // Handle joining specific event room
      socket.on('join_event', (eventId) => {
        if (eventId) {
          this.joinEventRoom(socket, eventId)
          this.userRooms.get(socket.id).add(`event_${eventId}`)
          
          // Send current event viewers count
          const viewersCount = this.getUsersInRoom(`event_${eventId}`).length
          socket.emit('event_viewers_count', {
            eventId,
            count: viewersCount
          })
        }
      })

      // Handle leaving specific event room
      socket.on('leave_event', (eventId) => {
        if (eventId) {
          this.leaveEventRoom(socket, eventId)
          this.userRooms.get(socket.id).delete(`event_${eventId}`)
        }
      })

      // Handle event interest tracking (for personalized notifications)
      socket.on('track_event_interest', ({ eventId, category, interested }) => {
        // Store user's interest for targeted notifications
        console.log(`User ${socket.userId} ${interested ? 'interested in' : 'not interested in'} ${category} events`)
        
        // You could store this in Redis or user preferences
        socket.emit('interest_tracked', {
          eventId,
          category,
          interested,
          timestamp: new Date()
        })
      })

      // Handle real-time RSVP updates
      socket.on('rsvp_event', ({ eventId, action }) => {
        // This would typically trigger the actual RSVP logic
        // For now, we'll just broadcast the attempt
        socket.to(`event_${eventId}`).emit('rsvp_activity', {
          userId: socket.userId,
          userName: socket.user.name,
          action, // 'rsvp' or 'cancel'
          eventId,
          timestamp: new Date()
        })
      })

      // Handle event sharing
      socket.on('event_shared', ({ eventId, shareCount }) => {
        console.log(`Event ${eventId} shared. New share count: ${shareCount}`)
        
        // Broadcast to all users viewing this event
        socket.to(`event_${eventId}`).emit('event_share_update', {
          eventId,
          shareCount,
          sharedBy: socket.userId,
          timestamp: new Date().toISOString()
        })
        
        // Also broadcast to events feed for real-time stats
        socket.broadcast.to('events_feed').emit('event_stats_update', {
          eventId,
          type: 'share',
          shareCount,
          timestamp: new Date().toISOString()
        })
      })

      // Handle unified event broadcasting from frontend
      socket.on('broadcast_new_event', (eventData) => {
        console.log('Broadcasting new event from frontend:', eventData.eventId)
        
        const payload = {
          ...eventData,
          broadcastedBy: socket.userId,
          timestamp: new Date().toISOString()
        }

        // Broadcast to all users in events feed
        socket.broadcast.to('events_feed').emit('new_event', payload)
        
        // Also broadcast to general audience to match API-triggered broadcasts
        socket.broadcast.emit('new_event', payload)
        
        // Additionally notify social feed for visibility
        socket.broadcast.to('social_feed').emit('event_notification', {
          type: 'new_event',
          message: `New ${eventData.category} event: ${eventData.title}`,
          eventData,
          timestamp: new Date().toISOString()
        })
        
        console.log(`Event ${eventData.eventId} broadcasted to all connected users`)
      })

      // Handle analytics updates
      socket.on('update_analytics', (analyticsData) => {
        console.log('Updating analytics:', analyticsData)
        
        // Broadcast to analytics room for real-time dashboard updates
        socket.broadcast.to('analytics').emit('analytics_update', {
          ...analyticsData,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        })
        
        // Update specific club dashboard if it's an event creation
        if (analyticsData.type === 'event_created' && analyticsData.clubId) {
          socket.broadcast.to(`club_${analyticsData.clubId}`).emit('club_stats_update', {
            type: 'event_created',
            eventId: analyticsData.eventId,
            timestamp: new Date().toISOString()
          })
        }
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected`)
        
        // Clean up user tracking
        this.connectedUsers.delete(socket.userId)
        this.userSockets.delete(socket.userId)
        this.userActivity.delete(socket.userId)
        
        // Clean up room tracking
        const userRooms = this.userRooms.get(socket.id) || new Set()
        userRooms.forEach(roomName => {
          if (this.roomUsers.has(roomName)) {
            this.roomUsers.get(roomName).delete(socket.userId)
            if (this.roomUsers.get(roomName).size === 0) {
              this.roomUsers.delete(roomName)
            }
          }
        })
        this.userRooms.delete(socket.id)
        
        // Broadcast user offline status with timestamp
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          user: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role,
            year: socket.user.year,
            branch: socket.user.branch
          },
          timestamp: new Date()
        })
      })
    })

    return this.io
  }

  // Emit new post to social feed
  emitNewPost(post) {
    if (this.io) {
      this.io.to('social_feed').emit('new_post', post)
    }
  }

  // Emit post update (votes, etc.)
  emitPostUpdate(postId, update) {
    if (this.io) {
      this.io.to(`post_${postId}`).emit('post_updated', { postId, ...update })
      this.io.to('social_feed').emit('post_updated', { postId, ...update })
    }
  }

  // Emit new comment
  emitNewComment(postId, comment) {
    if (this.io) {
      this.io.to(`post_${postId}`).emit('new_comment', comment)
    }
  }

  // Notify about new comment with email integration
  notifyNewComment(postId, commentData, emailNotified = false) {
    if (!this.io) return

    try {
      // Real-time notification to post subscribers
      this.io.to(`post_${postId}`).emit('new_comment', {
        postId,
        comment: commentData,
        emailSent: emailNotified,
        timestamp: new Date()
      })

      // Personal notification to post author if different from commenter
      if (commentData.postAuthorId && commentData.postAuthorId !== commentData.authorId) {
        this.sendNotificationToUser(commentData.postAuthorId, {
          type: 'new_comment',
          title: 'New Comment',
          message: `${commentData.authorName} commented on your post: "${commentData.content.substring(0, 50)}..."`,
          postId: postId,
          commentId: commentData._id,
          emailNotified,
          avatar: commentData.authorAvatar
        })
      }
      
      console.log(`💬 New comment notification sent for post ${postId}`)
    } catch (error) {
      console.error('❌ Failed to send comment notification:', error)
    }
  }

  // Emit comment update (votes, replies)
  emitCommentUpdate(postId, commentId, update) {
    if (this.io) {
      this.io.to(`post_${postId}`).emit('comment_updated', { commentId, ...update })
    }
  }

  // Send notification to specific user
  emitNotification(userId, notification) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('notification', notification)
    }
  }

  // Send notification with email integration status
  sendNotificationToUser(userId, notification) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('notification', {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        read: false,
        createdAt: new Date()
      })
      
      console.log(`🔔 Real-time notification sent to user ${userId}: ${notification.title}`)
    }
  }

  // Send notification to multiple users
  emitNotificationToUsers(userIds, notification) {
    if (this.io) {
      userIds.forEach(userId => {
        this.io.to(`user_${userId}`).emit('notification', notification)
      })
    }
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId)
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys())
  }

  // Get users in a specific room
  getUsersInRoom(roomName) {
    return Array.from(this.roomUsers.get(roomName) || new Set())
  }

  // Get user's current rooms
  getUserRooms(userId) {
    const socketId = this.connectedUsers.get(userId)
    return socketId ? Array.from(this.userRooms.get(socketId) || new Set()) : []
  }

  // Get user's last activity
  getUserLastActivity(userId) {
    return this.userActivity.get(userId)
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const socket = this.userSockets.get(userId)
    if (socket) {
      socket.emit(event, data)
      return true
    }
    return false
  }

  // Send message to users in specific room
  sendToRoom(roomName, event, data, excludeUserId = null) {
    if (this.io) {
      const emitter = this.io.to(roomName)
      if (excludeUserId) {
        const socketId = this.connectedUsers.get(excludeUserId)
        if (socketId) {
          emitter.except(socketId)
        }
      }
      emitter.emit(event, data)
    }
  }

  // Emit user-specific post interaction
  emitUserPostInteraction(userId, postId, action, data) {
    if (this.io) {
      // Notify the user
      this.io.to(`user_${userId}`).emit('post_interaction', {
        postId,
        action,
        data,
        timestamp: new Date()
      })
      
      // Notify others in the post room
      this.io.to(`post_${postId}`).except(this.connectedUsers.get(userId)).emit('user_post_activity', {
        userId,
        postId,
        action,
        timestamp: new Date()
      })
    }
  }

  // Emit user profile update notification
  emitUserProfileUpdate(userId, updateData) {
    if (this.io) {
      // Notify the user about their profile update
      this.io.to(`user_${userId}`).emit('profile_updated', {
        ...updateData,
        timestamp: new Date()
      })
      
      // Notify users in the same rooms about relevant profile changes
      const userRooms = this.getUserRooms(userId)
      userRooms.forEach(roomName => {
        this.io.to(roomName).except(this.connectedUsers.get(userId)).emit('user_profile_updated', {
          userId,
          updatedFields: updateData.updatedFields || [],
          user: updateData.user,
          timestamp: new Date()
        })
      })
    }
  }

  // Emit user stats update (reputation, posts count, etc.)
  emitUserStatsUpdate(userId, stats) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('user_stats_updated', {
        stats,
        timestamp: new Date()
      })
    }
  }

  // Get online users statistics
  getOnlineStats() {
    const totalUsers = this.connectedUsers.size
    const roomStats = {}
    
    this.roomUsers.forEach((users, roomName) => {
      roomStats[roomName] = users.size
    })

    return {
      totalOnlineUsers: totalUsers,
      roomStats,
      timestamp: new Date()
    }
  }

  // === EVENT WEBSOCKET METHODS ===

  // Broadcast new event to all users
  broadcastNewEvent(eventData) {
    if (this.io) {
      console.log('Broadcasting new event:', eventData.title)
      this.io.emit('new_event', {
        ...eventData,
        timestamp: new Date()
      })
      
      // Also send to events room specifically
      this.io.to('events_feed').emit('new_event', {
        ...eventData,
        timestamp: new Date()
      })
    }
  }

  // Send event notification to interested users
  sendEventNotification(notificationData) {
    if (this.io) {
      console.log('Sending event notification:', notificationData.message)
      
      // Send to all users (they can filter by preferences on client side)
      this.io.emit('event_notification', {
        ...notificationData,
        timestamp: new Date()
      })
    }
  }

  // Broadcast event update (time change, cancellation, etc.)
  broadcastEventUpdate(eventId, updateData) {
    if (this.io) {
      console.log('Broadcasting event update for:', eventId)
      
      // Send to event-specific room
      this.io.to(`event_${eventId}`).emit('event_updated', {
        eventId,
        ...updateData,
        timestamp: new Date()
      })
      
      // Send to general events feed
      this.io.to('events_feed').emit('event_updated', {
        eventId,
        ...updateData,
        timestamp: new Date()
      })
    }
  }

  // Broadcast RSVP update
  broadcastRSVPUpdate(eventId, rsvpData) {
    if (this.io) {
      console.log('Broadcasting RSVP update for event:', eventId)
      
      // Send to event-specific room
      this.io.to(`event_${eventId}`).emit('rsvp_updated', {
        eventId,
        ...rsvpData,
        timestamp: new Date()
      })
    }
  }

  // Join events feed room
  joinEventsFeed(socket) {
    socket.join('events_feed')
    console.log(`User ${socket.userId} joined events feed`)
  }

  // Leave events feed room
  leaveEventsFeed(socket) {
    socket.leave('events_feed')
    console.log(`User ${socket.userId} left events feed`)
  }

  // Join specific event room for real-time updates
  joinEventRoom(socket, eventId) {
    const roomName = `event_${eventId}`
    socket.join(roomName)
    
    // Track room membership
    if (!this.roomUsers.has(roomName)) {
      this.roomUsers.set(roomName, new Set())
    }
    this.roomUsers.get(roomName).add(socket.userId)
    
    console.log(`User ${socket.userId} joined event room: ${eventId}`)
    
    // Notify others in room about new user
    socket.to(roomName).emit('user_joined_event', {
      userId: socket.userId,
      eventId,
      timestamp: new Date()
    })
  }

  // Leave specific event room
  leaveEventRoom(socket, eventId) {
    const roomName = `event_${eventId}`
    socket.leave(roomName)
    
    // Update room membership
    if (this.roomUsers.has(roomName)) {
      this.roomUsers.get(roomName).delete(socket.userId)
      if (this.roomUsers.get(roomName).size === 0) {
        this.roomUsers.delete(roomName)
      }
    }
    
    console.log(`User ${socket.userId} left event room: ${eventId}`)
    
    // Notify others in room about user leaving
    socket.to(roomName).emit('user_left_event', {
      userId: socket.userId,
      eventId,
      timestamp: new Date()
    })
  }

  // Send real-time event analytics update
  sendEventAnalytics(eventId, analytics) {
    if (this.io) {
      this.io.to(`event_${eventId}`).emit('event_analytics', {
        eventId,
        analytics,
        timestamp: new Date()
      })
    }
  }

  // Send event reminder notifications
  sendEventReminder(eventId, attendeeIds, reminderData) {
    if (this.io) {
      console.log(`Sending event reminder for ${eventId} to ${attendeeIds.length} users`)
      
      attendeeIds.forEach(userId => {
        this.io.to(`user_${userId}`).emit('event_reminder', {
          eventId,
          ...reminderData,
          timestamp: new Date()
        })
      })
    }
  }
}

export default new SocketService()
