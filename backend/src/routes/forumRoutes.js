import express from 'express'
import { body } from 'express-validator'
import { authenticate as authenticateToken, optionalAuth } from '../middleware/auth.js'
import {
  getForums,
  getForum,
  createForum,
  joinForum,
  leaveForum,
  getForumCategories
} from '../controllers/forumController.js'

const router = express.Router()

// Validation rules
const createForumValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Forum name must be 3-50 characters and contain only letters, numbers, spaces, hyphens, and underscores'),
  
  body('displayName')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Display name must be 3-100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters'),
  
  body('category')
    .isIn(['Academic', 'Technology', 'Sports', 'Arts', 'General', 'Events', 'Career', 'Entertainment'])
    .withMessage('Invalid category selected'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be 1-30 characters')
]

// Public routes (with optional authentication)
router.get('/', optionalAuth, getForums)
router.get('/categories', getForumCategories)
router.get('/:forumName', optionalAuth, getForum)

// Protected routes
router.post('/', authenticateToken, createForumValidation, createForum)
router.post('/:forumName/join', authenticateToken, joinForum)
router.post('/:forumName/leave', authenticateToken, leaveForum)

export default router