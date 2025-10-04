import express from 'express'
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  votePost,
  getTrendingPosts,
  savePost,
  unsavePost
} from '../controllers/postController.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'
import { uploadSingle } from '../middleware/upload.js'

const router = express.Router()

// Public routes
router.get('/', optionalAuth, getPosts)
router.get('/trending', getTrendingPosts)
router.get('/:id', optionalAuth, getPost)

// Student-only routes
router.post('/', authenticate, authorize('student'), uploadSingle, createPost)
router.put('/:id', authenticate, authorize('student'), updatePost)
router.delete('/:id', authenticate, authorize('student'), deletePost)
router.post('/:id/vote', authenticate, authorize('student'), votePost)
router.post('/:id/save', authenticate, authorize('student'), savePost)
router.delete('/:id/save', authenticate, authorize('student'), unsavePost)

export default router