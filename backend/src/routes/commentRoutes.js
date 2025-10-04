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

// Student-only routes
router.post('/', authenticate, authorize('student'), createComment)
router.put('/:id', authenticate, authorize('student'), updateComment)
router.delete('/:id', authenticate, authorize('student'), deleteComment)
router.post('/:id/vote', authenticate, authorize('student'), voteComment)

export default router