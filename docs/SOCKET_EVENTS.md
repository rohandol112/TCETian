# Socket.io Real-Time Events - Quick Reference

## 🎯 Event Management Socket Events

### 📡 Client Emissions (Frontend → Backend)

#### Event Feed Management
```javascript
// Join main events feed room
socket.emit('join_events_feed')

// Join specific event room for real-time updates
socket.emit('join_event', eventId)

// Leave event room
socket.emit('leave_event', eventId)
```

#### Event Actions
```javascript
// When user shares an event
socket.emit('event_shared', {
  eventId: string,
  shareCount: number
})

// When new event is created
socket.emit('broadcast_new_event', {
  eventId: string,
  title: string,
  category: string,
  organizer: { name: string, id: string },
  eventDate: string,
  venue: string,
  capacity: number,
  imageUrl: string,
  timestamp: string
})

// When event is updated
socket.emit('event_updated', {
  eventId: string,
  ...eventData,
  timestamp: string
})

// Analytics tracking
socket.emit('update_analytics', {
  type: 'event_created',
  eventId: string,
  clubId: string
})

// Track event interest
socket.emit('track_event_interest', {
  eventId: string,
  category: string,
  interested: boolean
})

// RSVP actions
socket.emit('rsvp_event', {
  eventId: string,
  action: 'rsvp' | 'cancel'
})
```

---

### 📥 Server Broadcasts (Backend → Frontend)

#### Share Updates
```javascript
// Broadcast to specific event room
socket.on('event_share_update', (data) => {
  // data: { eventId, shareCount, sharedBy, timestamp }
})

// Broadcast to events feed
socket.on('event_stats_update', (data) => {
  // data: { eventId, type: 'share', shareCount, timestamp }
})
```

#### Event Updates
```javascript
// New event created
socket.on('new_event_created', (eventData) => {
  // eventData: { eventId, title, category, organizer, ... }
})

// Event modified
socket.on('event_updated', (eventData) => {
  // eventData: { eventId, ...updatedFields, timestamp }
})

// Event viewers count
socket.on('event_viewers_count', (data) => {
  // data: { eventId, count }
})
```

#### RSVP Activity
```javascript
socket.on('rsvp_activity', (data) => {
  // data: { userId, userName, action, eventId, timestamp }
})
```

#### Analytics Updates
```javascript
socket.on('analytics_update', (data) => {
  // data: { ...analyticsData, userId, timestamp }
})

socket.on('club_stats_update', (data) => {
  // data: { type, eventId, ... }
})
```

#### Notifications
```javascript
socket.on('event_notification', (data) => {
  // data: { type, message, eventData, timestamp }
})
```

---

## 🏠 Room Structure

### Global Rooms
- `events_feed` - All users viewing events page
- `social_feed` - General social notifications
- `analytics` - Analytics dashboard listeners

### Event-Specific Rooms
- `event_{eventId}` - Users viewing specific event
- Format: `event_507f1f77bcf86cd799439011`

### Club-Specific Rooms
- `club_{clubId}` - Club members and dashboard
- Format: `club_507f1f77bcf86cd799439011`

---

## 🔌 Connection Lifecycle

### 1. Initial Connection
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id)
})
```

### 2. Authentication
- JWT token sent via `auth.token` in connection handshake
- Server validates and attaches user info to socket

### 3. Join Rooms
```javascript
// On Events Page mount
socket.emit('join_events_feed')

// On Event Details mount
socket.emit('join_event', eventId)
```

### 4. Cleanup
```javascript
// On component unmount
useEffect(() => {
  return () => {
    socket.emit('leave_event', eventId)
    socket.off('event_share_update', handler)
    socket.off('event_stats_update', handler)
  }
}, [])
```

### 5. Disconnection
```javascript
socket.on('disconnect', () => {
  console.log('Disconnected')
})
```

---

## 💡 Usage Examples

### Example 1: Share Event with Real-Time Updates
```javascript
// EventDetailsModal.jsx
const handleShareEvent = async () => {
  const response = await eventService.shareEvent(eventId)
  
  if (response.success) {
    // Copy to clipboard
    await navigator.clipboard.writeText(response.data.shareUrl)
    
    // Emit socket event for real-time updates
    socket.emit('event_shared', {
      eventId,
      shareCount: response.data.shareCount
    })
  }
}

// Listen for share updates from other users
useEffect(() => {
  socket.on('event_share_update', (data) => {
    if (data.eventId === eventId) {
      setEvent(prev => ({
        ...prev,
        analytics: { ...prev.analytics, shareCount: data.shareCount }
      }))
    }
  })
  
  return () => socket.off('event_share_update')
}, [eventId])
```

### Example 2: Events Feed Real-Time Updates
```javascript
// Events.jsx
useEffect(() => {
  if (!isConnected || !socket) return
  
  // Join events feed room
  socket.emit('join_events_feed')
  
  // Listen for share count updates
  socket.on('event_stats_update', (data) => {
    if (data.type === 'share') {
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event._id === data.eventId
            ? { ...event, analytics: { ...event.analytics, shareCount: data.shareCount }}
            : event
        )
      )
    }
  })
  
  // Listen for new events
  socket.on('new_event_created', () => {
    fetchEvents(true) // Refresh events list
  })
  
  return () => {
    socket.off('event_stats_update')
    socket.off('new_event_created')
  }
}, [isConnected, socket])
```

### Example 3: Edit Event with Broadcast
```javascript
// useEventCreation.js
const response = await eventService.updateEvent(eventId, submitData)

if (response.success && socket) {
  // Broadcast update to all viewers
  socket.emit('event_updated', {
    eventId: response.data.event._id,
    ...response.data.event,
    timestamp: new Date().toISOString()
  })
}
```

---

## 🛡️ Socket Service Implementation

### Backend (socketService.js)
```javascript
// Handle event sharing
socket.on('event_shared', ({ eventId, shareCount }) => {
  console.log(`Event ${eventId} shared. New share count: ${shareCount}`)
  
  // Broadcast to event room
  socket.to(`event_${eventId}`).emit('event_share_update', {
    eventId,
    shareCount,
    sharedBy: socket.userId,
    timestamp: new Date().toISOString()
  })
  
  // Broadcast to events feed
  socket.broadcast.to('events_feed').emit('event_stats_update', {
    eventId,
    type: 'share',
    shareCount,
    timestamp: new Date().toISOString()
  })
})
```

### Frontend (SocketContext.jsx)
```javascript
const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Connection setup...
  
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
```

---

## ⚡ Performance Tips

1. **Always clean up listeners** in useEffect cleanup
2. **Use room-based broadcasting** instead of global broadcasts
3. **Debounce frequent events** (like typing, scrolling)
4. **Emit only necessary data** to reduce bandwidth
5. **Use acknowledgments** for critical operations

---

## 🐛 Debugging

### Enable Socket.io Debug Logs
```javascript
// Frontend
localStorage.debug = 'socket.io-client:socket'

// Backend
DEBUG=socket.io:* npm run dev
```

### Check Connection Status
```javascript
console.log('Connected:', socket.connected)
console.log('Socket ID:', socket.id)
console.log('Rooms:', socket.rooms) // Backend only
```

### Monitor Events
```javascript
socket.onAny((eventName, ...args) => {
  console.log('Event:', eventName, args)
})
```

---

**Last Updated:** 2024  
**Socket.io Version:** 4.x  
**Compatible with:** TCETian v2.0.0
