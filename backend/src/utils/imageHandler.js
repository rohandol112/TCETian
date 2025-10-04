import fs from 'fs/promises'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/events')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    cb(null, `event-${uniqueSuffix}${extension}`)
  }
})

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Image processing utilities
export const imageHandler = {
  // Process uploaded image and return URL
  processUploadedImage: (file) => {
    if (!file) return null
    
    // Return relative path that can be served as static file
    return `/uploads/events/${file.filename}`
  },

  // Validate image URL
  validateImageUrl: (url) => {
    if (!url) return false
    
    try {
      const urlObj = new URL(url)
      // Check if it's a valid HTTP/HTTPS URL
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  },

  // Delete image file from disk
  deleteImageFile: async (imagePath) => {
    if (!imagePath || imagePath.startsWith('http')) {
      // Don't delete URLs, only local files
      return true
    }

    try {
      const fullPath = path.join(__dirname, '../../', imagePath)
      await fs.unlink(fullPath)
      console.log(`Deleted image file: ${fullPath}`)
      return true
    } catch (error) {
      console.error('Error deleting image file:', error)
      return false
    }
  },

  // Clean up orphaned image files
  cleanupOrphanedImages: async () => {
    try {
      const uploadDir = path.join(__dirname, '../../uploads/events')
      const files = await fs.readdir(uploadDir)
      
      // Get all image paths from database
      const Event = (await import('../models/Event.js')).default
      const events = await Event.find({ imageUrl: { $exists: true } }).select('imageUrl')
      const usedImages = events
        .map(event => event.imageUrl)
        .filter(url => url && !url.startsWith('http'))
        .map(url => path.basename(url))

      // Delete unused files
      let deletedCount = 0
      for (const file of files) {
        if (!usedImages.includes(file)) {
          await fs.unlink(path.join(uploadDir, file))
          deletedCount++
        }
      }

      console.log(`Cleaned up ${deletedCount} orphaned image files`)
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error)
      return 0
    }
  },

  // Get image info (size, type, etc.)
  getImageInfo: async (imagePath) => {
    if (imagePath.startsWith('http')) {
      return {
        type: 'url',
        url: imagePath,
        size: null
      }
    }

    try {
      const fullPath = path.join(__dirname, '../../', imagePath)
      const stats = await fs.stat(fullPath)
      return {
        type: 'file',
        path: imagePath,
        size: stats.size,
        modified: stats.mtime
      }
    } catch (error) {
      return null
    }
  }
}

export default imageHandler