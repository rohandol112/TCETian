# TCETian Event Management System

## Overview

TCETian now features a comprehensive **Event Management System** with dual-user roles:

### 🎯 **Core Features**

1. **Dual Role System**
   - **Students**: Browse events, RSVP, manage their event participation
   - **Clubs**: Create, manage, and track events with detailed analytics

2. **Event Management Flow**
   - **Club Side (Server)**: Clubs create and manage events through a dedicated dashboard
   - **Student Side (Client)**: Students browse and RSVP to events through the main Events page

---

## 🏗️ **System Architecture**

### Backend (API)
- **Models**: User (with roles), Event (with RSVP management)
- **Authentication**: JWT-based with role-based access control
- **Routes**: Separate endpoints for student and club actions
- **Features**: Full CRUD operations, RSVP management, analytics

### Frontend (React)
- **Role-based UI**: Different interfaces for students vs clubs
- **Real-time Updates**: Event capacity, RSVP status, waitlists
- **Responsive Design**: Mobile-friendly event browsing and management

---

## 👥 **User Roles & Permissions**

### Students 📚
- **Registration**: Requires student ID, year, and branch
- **Capabilities**:
  - Browse all published events
  - Filter events by category, search
  - RSVP to events (with capacity management)
  - Cancel RSVPs
  - View event details and organizer info
  - Track their RSVP history in profile

### Clubs 🎭
- **Registration**: Requires club name and description
- **Capabilities**:
  - Access dedicated event dashboard
  - Create comprehensive events with:
    - Basic info (title, description, category)
    - Date/time/duration settings
    - Venue and capacity management
    - Registration deadlines
    - Tags, requirements, images
    - Contact information
  - View event analytics (RSVPs, views, attendees)
  - Manage attendee lists (confirmed & waitlist)
  - Edit/delete their events
  - Track event performance metrics

---

## 🚀 **Getting Started**

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/tcetian
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📊 **Event Management Workflow**

### For Clubs:
1. **Register** as a club with club name and description
2. **Login** and access the Dashboard via navbar
3. **Create Events** with comprehensive details
4. **Monitor** RSVP numbers and analytics
5. **Manage** attendee lists and event capacity
6. **Track** event performance metrics

### For Students:
1. **Register** as a student with ID, year, and branch
2. **Browse Events** on the main Events page
3. **Filter & Search** events by category/keywords
4. **RSVP** to interesting events
5. **Manage RSVPs** (cancel if needed)
6. **View** event details and organizer information

---

## 🔧 **Key Components**

### Backend Components:
- `models/User.js` - User model with role-based fields
- `models/Event.js` - Event model with RSVP management
- `controllers/eventController.js` - Event CRUD and RSVP operations
- `controllers/authController.js` - Authentication with role support
- `routes/eventRoutes.js` - Role-based route protection
- `middleware/auth.js` - JWT authentication and authorization

### Frontend Components:
- `pages/Events.jsx` - Main event browsing page (public)
- `components/events/EventDashboard.jsx` - Club dashboard (club-only)
- `components/events/CreateEventModal.jsx` - Event creation form
- `pages/auth/Register.jsx` - Enhanced registration with role selection
- `services/` - API service layer for backend communication

---

## 🛡️ **Security Features**

- **JWT Authentication** with role-based access control
- **Protected Routes** based on user roles
- **Input Validation** on both client and server
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for secure cross-origin requests
- **Password Hashing** with bcrypt

---

## 📱 **Mobile Responsiveness**

- Fully responsive design for all screen sizes
- Touch-optimized interfaces
- Mobile-friendly event cards and forms
- Optimized navigation for mobile users

---

## 🎨 **UI/UX Features**

- **TerraQuake Design System** integration
- **Glass morphism** effects
- **Gradient backgrounds** and animations
- **Real-time feedback** for user actions
- **Loading states** and error handling
- **Toast notifications** for user feedback

---

## 🔮 **Future Enhancements**

1. **Event Analytics Dashboard** with charts and insights
2. **Email Notifications** for RSVP confirmations
3. **Event Categories** with custom icons
4. **Advanced Filtering** by date range, popularity
5. **Event Reviews** and ratings system
6. **Calendar Integration** for personal scheduling
7. **Social Sharing** capabilities
8. **Event Reminders** and notifications

---

## 📚 **API Endpoints**

### Authentication
- `POST /api/auth/register` - Register with role selection
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/me` - Get current user profile

### Events (Public)
- `GET /api/events` - Get events with filtering
- `GET /api/events/:id` - Get single event details

### Events (Student Only)
- `POST /api/events/:id/rsvp` - RSVP to event
- `DELETE /api/events/:id/rsvp` - Cancel RSVP

### Events (Club Only)
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/:id/attendees` - Get attendee list
- `GET /api/events/dashboard/stats` - Get dashboard analytics

---

This system provides a complete event management solution that bridges the gap between event organizers (clubs) and participants (students), creating a vibrant campus community platform! 🎉