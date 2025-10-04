import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role, studentId, year, branch, courseType, clubName, description } = req.body
    
    console.log('=== REGISTRATION REQUEST ===')
    console.log('Registration request received:', {
      name, email, role, studentId, year, branch, courseType, clubName, description: description ? 'provided' : 'empty'
    })
    console.log('Full request body keys:', Object.keys(req.body))

    // Basic validation
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password })
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      })
    }

    // Check if user already exists with same email and role
    const existingUser = await User.findOne({ email, role })
    if (existingUser) {
      console.log('User already exists with email:', email, 'and role:', role)
      return res.status(400).json({
        success: false,
        message: `A ${role} account with this email already exists. Please use a different email or try logging in.`,
        code: 'EMAIL_EXISTS',
        existingRole: existingUser.role
      })
    }

    // Check if there's an account with this email but different role
    const existingUserDifferentRole = await User.findOne({ email, role: { $ne: role } })
    if (existingUserDifferentRole) {
      console.log('User exists with different role:', existingUserDifferentRole.role, 'for email:', email)
      // This is allowed - same email can be used for different roles
    }

    // Validate role-specific fields
    if (role === 'student') {
      console.log('Validating student fields:', { studentId, year, branch, courseType })
      if (!studentId || !year || !branch || !courseType) {
        console.log('Missing student fields')
        return res.status(400).json({
          success: false,
          message: 'Student ID, year, branch, and course type are required for student registration'
        })
      }

      // Check if student ID already exists
      const existingStudent = await User.findOne({ studentId })
      if (existingStudent) {
        console.log('Student ID already exists:', studentId)
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        })
      }
    } else if (role === 'club') {
      console.log('Validating club fields:', { clubName })
      if (!clubName) {
        console.log('Missing club name')
        return res.status(400).json({
          success: false,
          message: 'Club name is required for club registration'
        })
      }
    }

    // Create user data object
    const userData = {
      name,
      email,
      password,
      role: role || 'student'
    }

    // Add role-specific fields
    if (role === 'student') {
      userData.studentId = studentId
      userData.year = year
      userData.branch = branch
      userData.courseType = courseType
    } else if (role === 'club') {
      userData.clubName = clubName
      if (description) {
        userData.description = description
      }
    }

    // Create user
    console.log('Creating user with data:', userData)
    const user = await User.create(userData)
    console.log('User created successfully:', user._id)

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: `${role === 'club' ? 'Club' : 'Student'} registered successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...(user.role === 'student' && {
            studentId: user.studentId,
            year: user.year,
            branch: user.branch,
            courseType: user.courseType
          }),
          ...(user.role === 'club' && {
            clubName: user.clubName,
            description: user.description,
            verified: user.verified
          })
        },
        token
      }
    })
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + validationErrors.join(', ')
      })
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      // Check if this is the old email index causing issues
      if (error.message.includes('email_1 dup key') && role && role !== 'student') {
        console.log('🔧 Detected old email index issue, attempting to fix...')
        
        try {
          // Try to fix the indexes
          await User.fixIndexes()
          
          // Retry the user creation after fixing indexes
          console.log('🔄 Retrying user creation after index fix...')
          const newUser = new User(userData)
          await newUser.save()
          
          const token = generateToken(newUser._id)
          
          return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
              user: newUser.getPublicProfile(),
              token
            }
          })
          
        } catch (retryError) {
          console.error('Retry failed after index fix:', retryError.message)
          return res.status(400).json({
            success: false,
            message: 'Database index conflict detected. Please run: node manualIndexFix.js to fix the database, then try again.',
            code: 'DATABASE_INDEX_CONFLICT'
          })
        }
      }
      
      const field = Object.keys(error.keyValue)[0]
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body

    console.log('Login attempt:', { email, role: role || 'not specified' })

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // If role is specified, find user with that role
    // If no role specified, find any user with this email (backward compatibility)
    let findQuery = { email }
    if (role) {
      findQuery.role = role
    }

    const user = await User.findOne(findQuery).select('+password')
    
    if (!user) {
      // If role was specified and no user found, check if user exists with different role
      if (role) {
        const userWithDifferentRole = await User.findOne({ email, role: { $ne: role } })
        if (userWithDifferentRole) {
          return res.status(401).json({
            success: false,
            message: `No ${role} account found with this email. Did you mean to login as a ${userWithDifferentRole.role}?`,
            suggestedRole: userWithDifferentRole.role
          })
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...(user.role === 'student' && {
            studentId: user.studentId,
            year: user.year,
            branch: user.branch,
            courseType: user.courseType
          }),
          ...(user.role === 'club' && {
            clubName: user.clubName,
            description: user.description,
            verified: user.verified
          })
        },
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('rsvpEvents', 'title eventDate venue')
      .populate('eventsCreated', 'title eventDate status')

    res.json({
      success: true,
      data: { user }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error getting profile'
    })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, description, profilePicture } = req.body
    
    const updateData = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    })
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      })
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password')
    
    // Check current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    })
  }
}