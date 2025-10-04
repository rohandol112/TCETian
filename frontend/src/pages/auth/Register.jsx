import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiUserPlus, 
  FiUsers,
  FiBookOpen,
  FiCalendar
} from 'react-icons/fi'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Student fields
    studentId: '',
    year: '',
    branch: '',
    courseType: '',
    // Club fields
    clubName: '',
    description: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const courseTypes = [
    'Engineering',
    'Management', 
    'Computer Applications',
    'Vocational'
  ]

  const courseYears = {
    'Engineering': ['FE', 'SE', 'TE', 'BE'],
    'Management': ['1st Year', '2nd Year'],
    'Computer Applications': ['1st Year', '2nd Year', '3rd Year'],
    'Vocational': ['1st Year', '2nd Year', '3rd Year']
  }

  const courseBranches = {
    'Engineering': ['AI&DS', 'AI&ML', 'CIVIL', 'COMPS', 'CS&E', 'E&CS', 'E&TC', 'IoT', 'IT', 'MECH', 'M&ME'],
    'Management': ['MBA'],
    'Computer Applications': ['BCA', 'MCA'],
    'Vocational': ['BVOC']
  }
  
  const { register, isAuthenticated, error, clearError } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/events', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      showToast(error, 'error')
      clearError()
    }
  }, [error, showToast, clearError])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    // Validate role-specific fields
    if (formData.role === 'student' && (!formData.studentId || !formData.year || !formData.branch || !formData.courseType)) {
      showToast('Please fill all student details', 'error')
      return
    }

    if (formData.role === 'club' && !formData.clubName) {
      showToast('Please enter club name', 'error')
      return
    }

    setIsLoading(true)

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    }

    // Add role-specific fields
    if (formData.role === 'student') {
      userData.studentId = formData.studentId
      userData.year = formData.year
      userData.branch = formData.branch
      userData.courseType = formData.courseType
    } else if (formData.role === 'club') {
      userData.clubName = formData.clubName
      userData.description = formData.description
    }

    const result = await register(userData)
    
    if (result.success) {
      showToast('Welcome to TCETian! Your account has been created successfully.', 'success')
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
              <FiUserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gradient">Join TCETian</h2>
            <p className="text-gray-300 mt-2">Create your account to get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'student'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <FiUser className="w-6 h-6 mx-auto mb-2" />
                  <span className="block text-sm font-medium">Student</span>
                  <span className="block text-xs text-gray-400">Join events & activities</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'club' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'club'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <FiUsers className="w-6 h-6 mx-auto mb-2" />
                  <span className="block text-sm font-medium">Club</span>
                  <span className="block text-xs text-gray-400">Create & manage events</span>
                </button>
              </div>
              <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 <strong>Tip:</strong> You can use the same email for both Student and Club accounts if needed.
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  placeholder="Enter your full name"
                />
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

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <>
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-300 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiBookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={handleChange}
                      className="form-input block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                      placeholder="Enter your student ID"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="courseType" className="block text-sm font-medium text-gray-300 mb-2">
                    Course Type
                  </label>
                  <select
                    id="courseType"
                    name="courseType"
                    required
                    value={formData.courseType}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        courseType: e.target.value,
                        year: '', // Reset year and branch when course type changes
                        branch: ''
                      })
                    }}
                    className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none"
                  >
                    <option value="" className="bg-gray-900">Select Course Type</option>
                    {courseTypes.map(type => (
                      <option key={type} value={type} className="bg-gray-900">{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-2">
                      Year
                    </label>
                    <select
                      id="year"
                      name="year"
                      required
                      value={formData.year}
                      onChange={handleChange}
                      disabled={!formData.courseType}
                      className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none disabled:opacity-50"
                    >
                      <option value="" className="bg-gray-900">Select Year</option>
                      {formData.courseType && courseYears[formData.courseType]?.map(year => (
                        <option key={year} value={year} className="bg-gray-900">{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-300 mb-2">
                      Branch/Course
                    </label>
                    <select
                      id="branch"
                      name="branch"
                      required
                      value={formData.branch}
                      onChange={handleChange}
                      disabled={!formData.courseType}
                      className="form-input block w-full py-3 px-3 rounded-lg text-white focus:outline-none disabled:opacity-50"
                    >
                      <option value="" className="bg-gray-900">Select Branch</option>
                      {formData.courseType && courseBranches[formData.courseType]?.map(branch => (
                        <option key={branch} value={branch} className="bg-gray-900">{branch}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Club-specific fields */}
            {formData.role === 'club' && (
              <>
                <div>
                  <label htmlFor="clubName" className="block text-sm font-medium text-gray-300 mb-2">
                    Club Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUsers className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="clubName"
                      name="clubName"
                      type="text"
                      required
                      value={formData.clubName}
                      onChange={handleChange}
                      className="form-input block w-full pl-10 pr-3 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                      placeholder="Enter your club name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="form-input block w-full py-3 px-3 rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none"
                    placeholder="Brief description of your club..."
                  />
                </div>
              </>
            )}

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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input block w-full pl-10 pr-10 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <FiUserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-gradient hover:underline font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register