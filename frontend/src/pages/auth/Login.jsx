import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiUser, FiUsers } from 'react-icons/fi'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' // Default role
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, isAuthenticated, error, clearError } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/events'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  useEffect(() => {
    if (error) {
      showError('Login Failed', error)
      clearError()
    }
  }, [error, showError, clearError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await login(formData.email, formData.password, formData.role)
    
    if (result.success) {
      showSuccess('Welcome back!', 'You have been logged in successfully.')
    }
    
    setIsLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20 pt-32">
      <div className="max-w-md w-full">
        <div className="glass rounded-2xl p-8 card-hover">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
              <FiLogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gradient">Welcome Back</h2>
            <p className="text-gray-300 mt-2">Sign in to your TCETian account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Login As
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    formData.role === 'student'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/20 hover:border-white/40 text-gray-300 hover:text-white'
                  }`}
                >
                  <FiUser className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Student</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'club' })}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    formData.role === 'club'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/20 hover:border-white/40 text-gray-300 hover:text-white'
                  }`}
                >
                  <FiUsers className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Club</div>
                </button>
              </div>
              <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 Select your account type above. The same email can have both Student and Club accounts.
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input block w-full pl-10 pr-10 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gradient py-3 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <FiLogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-gradient hover:underline font-medium"
              >
                Join TCETian
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login