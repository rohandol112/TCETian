# 📚 TCETian - College Event Management & Social Platform

<div align="center">

[![Status](https://img.shields.io/badge/status-in%20development-orange.svg)]()
[![React](https://img.shields.io/badge/React-19-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-latest-green.svg)]()

A modern college event management and social platform with Reddit-like features, built with the TerraQuake design aesthetic.

</div>

## 🎯 Features

### 📅 Event Management
- Create and manage college events
- Event registration and RSVP
- Event categories and filtering
- Calendar integration
- Event notifications

### 🗨️ Social Platform (Reddit-like)
- Create posts and discussions
- Upvote/downvote system
- Threaded comments
- User reputation system
- Community moderation

### 👥 User Management
- Student authentication
- User profiles and avatars
- Role-based permissions (Student, Admin, Moderator)
- Activity tracking

### 🎨 Design System
- Modern gradient backgrounds
- Responsive design
- TerraQuake-inspired UI
- Dark/light theme support

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- React Router
- Axios

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd TCETian
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
TCETian/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── .env.example
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # Global styles
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🎨 Design Philosophy

TCETian follows the TerraQuake design system:
- **Gradient Backgrounds**: Beautiful cosmic-inspired gradients
- **Modern Typography**: Clean, readable fonts
- **Interactive Elements**: Smooth hover effects and animations
- **Responsive Design**: Mobile-first approach
- **Consistent Spacing**: Harmonious layout patterns

## 🔧 Development

```bash
# Run backend in development mode
cd backend && npm run dev

# Run frontend in development mode
cd frontend && npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 About TCET

Built for Thakur College of Engineering and Technology students by students.

---

**Happy Coding! 🚀**