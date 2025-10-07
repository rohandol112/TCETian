import express from 'express'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  voteComment
} from '../controllers/commentController.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/:postId', optionalAuth, getComments)

// Authenticated user routes (students and clubs can comment)
router.post('/', authenticate, authorize('student', 'club'), createComment)
router.put('/:id', authenticate, authorize('student', 'club'), updateComment)
router.delete('/:id', authenticate, authorize('student', 'club'), deleteComment)
router.post('/:id/vote', authenticate, authorize('student', 'club'), voteComment)

export default router