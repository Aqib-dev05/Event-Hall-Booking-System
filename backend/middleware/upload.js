const multer = require('multer')
const { ApiError } = require('../utils/response')

const MAX_FILES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB per image
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Files are kept in memory and streamed straight to Cloudinary (nothing is written to disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPG, PNG or WEBP images are allowed'))
    }
    cb(null, true)
  },
})

/** Accepts up to 5 files in the multipart field "images". */
const venueImages = upload.array('images', MAX_FILES)

module.exports = { venueImages, MAX_FILES }
