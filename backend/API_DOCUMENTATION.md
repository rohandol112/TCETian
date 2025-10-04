# TCETian Backend API Documentation

## Overview
Complete CRUD backend for TCETian - College Event Management & Social Platform

## Base URL
```
http://localhost:5001/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 🔐 Authentication Endpoints
```
POST /auth/register     - Register new user (student/club)
POST /auth/login        - Login user
GET  /auth/profile      - Get current user profile (Protected)
PUT  /auth/profile      - Update user profile (Protected)
```

### 👥 User Management
```
GET  /users             - Get all users (Protected - Admin only)
GET  /users/:id         - Get user by ID (Protected)
PUT  /users/:id         - Update user (Protected - Own profile only)
DELETE /users/:id       - Delete user (Protected - Admin only)
```

### 📅 Event Management
```
GET  /events            - Get all events (Public)
GET  /events/:id        - Get event by ID (Public)
POST /events            - Create new event (Protected - Club only)
PUT  /events/:id        - Update event (Protected - Event creator only)
DELETE /events/:id      - Delete event (Protected - Event creator only)
POST /events/:id/rsvp   - RSVP to event (Protected - Student only)
DELETE /events/:id/rsvp - Cancel RSVP (Protected - Student only)
```

### 📝 Social Posts
```
GET  /posts             - Get all posts with filters (Public with optional auth)
GET  /posts/trending    - Get trending posts (Public)
GET  /posts/:id         - Get single post with comments (Public with optional auth)
POST /posts             - Create new post (Protected - Student only)
PUT  /posts/:id         - Update post (Protected - Author only)
DELETE /posts/:id       - Delete post (Protected - Author only)
POST /posts/:id/vote    - Vote on post (Protected - Student only)
```

### 💬 Comments
```
GET  /comments/:postId  - Get comments for a post (Public with optional auth)
POST /comments          - Create new comment (Protected - Student only)
PUT  /comments/:id      - Update comment (Protected - Author only)
DELETE /comments/:id    - Delete comment (Protected - Author only)
POST /comments/:id/vote - Vote on comment (Protected - Student only)
```

## 📊 Request/Response Examples

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@tcet.edu",
  "password": "password123",
  "role": "student",
  "studentId": "TCET001",
  "year": "SE",
  "branch": "COMPS",
  "courseType": "Engineering"
}
```

### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Looking for study group",
  "content": "Anyone interested in forming a DS study group?",
  "category": "Academic",
  "tags": ["study-group", "data-structures"]
}
```

### Vote on Post
```http
POST /api/posts/:id/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "voteType": "upvote"  // "upvote", "downvote", or null to remove vote
}
```

### Create Comment
```http
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "I'm interested! Count me in.",
  "postId": "post_object_id",
  "parentCommentId": null  // Optional for replies
}
```

### Get Posts with Filters
```http
GET /api/posts?category=Academic&sort=hot&limit=10&page=1
```

## 🔧 Query Parameters

### Posts Filtering
- `category` - Filter by category (Academic, Events, Study Group, etc.)
- `sort` - Sort by: hot, new, top, controversial
- `search` - Text search in post content
- `year` - Filter by target year
- `branch` - Filter by target branch
- `author` - Filter by author ID
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

### Comments Filtering
- `sort` - Sort by: best, new, old, controversial
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

## 🏗️ Data Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  role: "student" | "club",
  
  // Student fields
  studentId: String,
  year: "FE" | "SE" | "TE" | "BE" | "1st Year" | "2nd Year" | "3rd Year" | "4th Year",
  branch: "AI&DS" | "AI&ML" | "CIVIL" | "COMPS" | "CS&E" | "E&CS" | "E&TC" | "IoT" | "IT" | "MECH" | "M&ME" | "BCA" | "MCA" | "MBA" | "BVOC",
  courseType: "Engineering" | "Management" | "Computer Applications" | "Vocational",
  
  // Club fields
  clubName: String,
  description: String,
  
  // Common fields
  verified: Boolean,
  profilePicture: String,
  rsvpEvents: [EventId],
  eventsCreated: [EventId]
}
```

### Post Schema
```javascript
{
  title: String,
  content: String (required),
  author: UserId (required),
  category: String (required),
  postType: "text" | "image",
  image: String,
  tags: [String],
  upvotes: [{ user: UserId, createdAt: Date }],
  downvotes: [{ user: UserId, createdAt: Date }],
  comments: [CommentId],
  viewCount: Number,
  isHidden: Boolean,
  isLocked: Boolean,
  targetYear: String,
  targetBranch: String
}
```

### Comment Schema
```javascript
{
  content: String (required),
  author: UserId (required),
  post: PostId (required),
  parentComment: CommentId (optional),
  replies: [CommentId],
  depth: Number,
  upvotes: [{ user: UserId, createdAt: Date }],
  downvotes: [{ user: UserId, createdAt: Date }],
  isDeleted: Boolean,
  isEdited: Boolean,
  editedAt: Date
}
```

## 🚀 Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (student/club)
- Password hashing with bcrypt
- Protected routes with middleware

### ✅ Event Management
- Full CRUD operations
- RSVP system with capacity management
- Waitlist functionality
- Event analytics for clubs

### ✅ Social Platform
- Reddit-style post system
- Voting mechanism (upvote/downvote)
- Nested comment system (5 levels deep)
- Advanced sorting algorithms (hot, new, top, controversial)
- Search and filtering
- Category-based organization

### ✅ Security Features
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation
- SQL injection protection
- XSS protection

### ✅ Database Features
- MongoDB with Mongoose ODM
- Proper indexing for performance
- Data validation
- Relationship management
- Aggregation pipelines for complex queries

## 🔄 Ready for Socket.IO Integration

The backend is structured to easily add real-time features:
- Real-time notifications
- Live comment updates
- Live voting updates
- Typing indicators
- Online user status

## 🧪 Testing the API

You can test the API using tools like:
- Postman
- Thunder Client (VS Code extension)
- cURL commands
- Frontend integration

### Health Check
```http
GET /health
```
Should return:
```json
{
  "status": "OK",
  "message": "TCETian API is running!",
  "timestamp": "2025-10-03T..."
}
```

## 📝 Environment Variables Required

Create a `.env` file in the backend directory:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

The CRUD backend is complete and production-ready! 🎉