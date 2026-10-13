const multer = require('multer')
const { ApiError } = require('../utils/response')
const env = require('../config/env')

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message || 'Internal server error'

  if (err instanceof multer.MulterError) {
    status = 400
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Each image must be 5 MB or smaller'
    else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') message = 'You can upload up to 5 images'
  } else if (err.type === 'entity.parse.failed') {
    status = 400
    message = 'Invalid JSON body'
  } else if (err.type === 'entity.too.large') {
    status = 413
    message = 'Request body too large'
  } else if (err.code === 'P2002') {
    status = 409
    message = 'A record with these details already exists'
  } else if (err.code === 'P2025') {
    status = 404
    message = 'Record not found'
  } else if (err.code === 'P2034') {
    status = 409
    message = 'Another request changed this data at the same time. Please try again'
  }

  if (status >= 500) {
    console.error(err)
    if (env.isProd) message = 'Internal server error'
  }

  res.status(status).json({ success: false, error: message })
}

module.exports = { notFound, errorHandler }
