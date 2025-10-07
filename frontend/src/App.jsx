import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SocketProvider } from './context/SocketContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Layout Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Stars from './components/effects/Stars'

// Pages
import Home from './pages/Home'
import Events from './pages/Events'
import Social from './pages/Social'
import Profile from './pages/Profile'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import NotFound from './pages/NotFound'

// Event Components


// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <Router>
          <div className="min-h-screen bg-gradient-cosmic text-white relative overflow-hidden">
            {/* Animated Stars Background */}
            <Stars />
            
            {/* Navigation */}
            <Navbar />
            
            {/* Main Content */}
            <main className="relative z-10">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/social" 
                  element={
                    <ProtectedRoute>
                      <Social />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            {/* Footer */}
            <Footer />
          </div>
            </Router>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App