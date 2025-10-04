# TCETian - WebSocket Implementation Guide

## 🚀 Real-Time Features

TCETian now includes comprehensive WebSocket functionality for real-time social interactions. Here's what's been implemented:

### ✨ Features

#### 1. **Real-Time Notifications**
- Instant notifications for new posts, comments, and interactions
- Live notification center in the navbar
- Unread notification badges
- Toast notifications for immediate feedback

#### 2. **Live Post Updates**
- Real-time vote counts without page refresh
- Instant display of new posts in the social feed
- Live comment counts and updates

#### 3. **Comment System**
- Real-time comment posting and display
- Live comment voting
- Typing indicators for comments
- Nested comment threading support

#### 4. **Activity Feed**
- Live activity feed showing recent community actions
- Real-time updates for posts, votes, and comments
- User activity tracking

#### 5. **Online Status**
- Online user count display
- Connection status indicators
- Automatic reconnection handling

#### 6. **Save & Share Features**
- Real-time post saving/bookmarking
- Share functionality with Web Share API
- Clipboard fallback for sharing

### 🛠️ Technical Implementation

#### Backend (Node.js + Socket.IO)
```javascript
// WebSocket Service Structure
- socketService.js: Core WebSocket server logic
- Real-time event emissions for posts, comments, votes
- User authentication via JWT tokens
- Room-based communication for posts and users
```

#### Frontend (React + Socket.IO Client)
```javascript
// React Context Structure
- SocketContext.jsx: WebSocket state management
- socketService.js: Client-side WebSocket communication
- Real-time event listeners and handlers
```

### 📡 WebSocket Events

#### Server Events
- `new_post`: Broadcast new posts to social feed
- `post_updated`: Send vote updates for posts
- `new_comment`: Broadcast new comments to post rooms
- `comment_updated`: Send comment vote updates
- `notification`: Send notifications to users
- `user_status_update`: Broadcast user online/offline status

#### Client Events
- `join_post`: Join a post room for comments
- `leave_post`: Leave a post room
- `join_social_feed`: Join the main social feed
- `typing_comment`: Send typing indicators
- `user_status`: Update user online status

### 🏗️ File Structure

```
backend/src/
├── services/
│   └── socketService.js          # WebSocket server logic
├── controllers/
│   ├── postController.js         # Enhanced with real-time events
│   └── commentController.js      # Enhanced with real-time events
└── app.js                        # WebSocket server initialization

frontend/src/
├── context/
│   └── SocketContext.jsx         # WebSocket React context
├── services/
│   └── socketService.js          # Client WebSocket service
├── components/
│   ├── notifications/
│   │   └── NotificationCenter.jsx # Live notifications
│   ├── realtime/
│   │   ├── OnlineStatus.jsx      # Connection status
│   │   └── LiveActivityFeed.jsx  # Activity feed
│   └── social/
│       └── PostCard.jsx          # Enhanced with real-time features
└── pages/
    └── Social.jsx                # Main social platform page
```

### 🎯 Usage Examples

#### Joining Real-Time Updates
```javascript
// Automatically handled by SocketContext
const { onNewPost, onPostUpdate, onNewComment } = useSocket()

useEffect(() => {
  const unsubscribe = onNewPost((post) => {
    // Handle new post
    setPosts(prev => [post, ...prev])
  })
  return unsubscribe
}, [])
```

#### Sending Typing Indicators
```javascript
const { sendTypingIndicator } = useSocket()

// On textarea focus/blur
sendTypingIndicator(postId, true)  // Start typing
sendTypingIndicator(postId, false) // Stop typing
```

### 🔧 Configuration

#### Environment Variables
```env
# Backend
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret

# Frontend
VITE_API_URL=http://localhost:5001/api
```

#### Dependencies Added
**Backend:**
- `socket.io`: WebSocket server implementation

**Frontend:**
- `socket.io-client`: WebSocket client library

### 🚦 Getting Started

1. **Install Dependencies**
```bash
# Backend
cd backend && npm install socket.io

# Frontend
cd frontend && npm install socket.io-client
```

2. **Start Services**
```bash
# Backend (with WebSocket support)
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

3. **Test Real-Time Features**
- Open multiple browser tabs
- Login with different users
- Create posts, comments, and votes
- Observe real-time updates across tabs

### 🎨 UI Components

#### NotificationCenter
- Bell icon with unread count badge
- Dropdown with live notifications
- Connection status indicator
- Mark as read functionality

#### OnlineStatus
- Live user count display
- Connection status with visual indicators
- Pulse animations for live updates

#### LiveActivityFeed
- Real-time activity stream
- Animated new activity entries
- Activity type icons and timestamps

### 📱 Features in Action

1. **Real-Time Voting**: Vote on posts and see counts update instantly across all users
2. **Live Comments**: Comment on posts and see them appear immediately for all viewers
3. **Typing Indicators**: See when other users are typing comments
4. **Activity Stream**: Watch live feed of community activity
5. **Notifications**: Receive instant notifications for interactions
6. **Online Status**: See who's online and connection status

### 🔮 Future Enhancements

- Private messaging system
- Voice/video chat integration
- Screen sharing for study groups
- Real-time collaborative documents
- Push notifications for mobile
- Advanced presence indicators

### 🐛 Troubleshooting

#### Connection Issues
- Check if backend server is running on port 5001
- Verify JWT token is properly set
- Check browser console for WebSocket errors

#### Real-Time Updates Not Working
- Ensure both users are authenticated
- Check if WebSocket connection is established
- Verify event listeners are properly set up

---

## 🎉 WebSocket Implementation Complete!

The TCETian platform now features a fully functional real-time social experience with:
- ✅ Live post updates and voting
- ✅ Real-time comment system with typing indicators
- ✅ Live notifications and activity feed
- ✅ Online status and connection management
- ✅ Save/share functionality
- ✅ Responsive real-time UI components

Users can now experience a truly interactive social platform with instant updates and seamless real-time communication!