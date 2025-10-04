export const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    return res.status(404).json({
      success: false,
      message
    })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} already exists`
    return res.status(400).json({
      success: false,
      message
    })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    return res.status(400).json({
      success: false,
      message
    })
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    return res.status(401).json({
      success: false,
      message
    })
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  })
}

export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}