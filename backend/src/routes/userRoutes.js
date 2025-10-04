import express from 'express'
import multer from 'multer'
import path from 'path'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import {
  getProfile,
  updateProfile,
  updateProfilePicture,
  changePassword,
  getUserById,
  getUserPosts,
  toggleSavePost,
  getSavedPosts
} from '../controllers/userController.js'

const router = express.Router()

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Profile routes (authenticated)
router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate, updateProfile)
router.post('/profile/picture', authenticate, upload.single('profilePicture'), updateProfilePicture)
router.put('/profile/password', authenticate, changePassword)
router.get('/profile/saved-posts', authenticate, getSavedPosts)

// Post interaction routes
router.post('/posts/:postId/save', authenticate, toggleSavePost)

// Public user routes
router.get('/:id', optionalAuth, getUserById)
router.get('/:id/posts', optionalAuth, getUserPosts)

// @desc    Get all clubs
// @route   GET /api/users/clubs
// @access  Public
router.get('/clubs', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default
    
    const clubs = await User.find({ role: 'club' })
      .select('-password -email')
      .populate('eventsCreated', 'title startDate endDate status')
      .sort({ verified: -1, name: 1 })

    res.json({
      success: true,
      data: { clubs }
    })
  } catch (error) {
    console.error('Get clubs error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching clubs'
    })
  }
})

export default router