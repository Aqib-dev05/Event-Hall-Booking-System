const crypto = require('crypto')
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary')
const env = require('../config/env')
const { ApiError } = require('./response')

// All uploads of this project live under:  <CLOUDINARY_ROOT_FOLDER>/venues
const VENUE_FOLDER = `${env.CLOUDINARY_ROOT_FOLDER}/venues`

function assertConfigured() {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, 'Image upload is not configured (missing CLOUDINARY_* environment variables)')
  }
}

/** Streams one in-memory multer file to Cloudinary and resolves with its secure URL. */
function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        // The folder is part of the public_id (works in fixed AND dynamic folder mode)...
        public_id: `${VENUE_FOLDER}/${crypto.randomUUID()}`,
        // ...and asset_folder makes it show up inside the folder in dynamic-folder-mode accounts.
        asset_folder: VENUE_FOLDER,
        overwrite: false,
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    )
    stream.end(buffer)
  })
}

/** Uploads every multer file; if one fails the already-uploaded ones are removed again. */
async function uploadVenueImages(files = []) {
  if (files.length === 0) return []
  assertConfigured()

  const settled = await Promise.allSettled(files.map((f) => uploadBuffer(f.buffer)))
  const urls = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value)
  const failed = settled.find((s) => s.status === 'rejected')

  if (failed) {
    await deleteImagesByUrl(urls)
    console.error('[cloudinary] upload failed:', failed.reason)
    throw new ApiError(502, 'Image upload failed. Please try again')
  }
  return urls
}

/** "https://res.cloudinary.com/<cloud>/image/upload/v123/<root>/venues/abc.jpg" -> "<root>/venues/abc" */
function publicIdFromUrl(url) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null
  const marker = '/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  let path = url.slice(idx + marker.length).split('?')[0]
  path = path.replace(/^v\d+\//, '')
  path = path.replace(/\.[a-zA-Z0-9]+$/, '')
  // only ever delete files that live inside this project's root folder
  return path.startsWith(`${env.CLOUDINARY_ROOT_FOLDER}/`) ? decodeURIComponent(path) : null
}

/** Best effort: failures are logged and never block the request. */
async function deleteImagesByUrl(urls = []) {
  if (!isCloudinaryConfigured) return
  const ids = urls.map(publicIdFromUrl).filter(Boolean)
  await Promise.all(
    ids.map((id) =>
      cloudinary.uploader.destroy(id, { resource_type: 'image' }).catch((e) =>
        console.error(`[cloudinary] could not delete ${id}:`, e.message || e)
      )
    )
  )
}

module.exports = { uploadVenueImages, deleteImagesByUrl, publicIdFromUrl, VENUE_FOLDER }
