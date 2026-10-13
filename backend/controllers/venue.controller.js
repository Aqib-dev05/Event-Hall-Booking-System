const prisma = require('../config/db')
const { ApiError, asyncHandler, ok } = require('../utils/response')
const { parseDateOnly } = require('../utils/dates')
const { computeAvailability, hasAnyFreeSlot } = require('../utils/slots')
const { getTakenTypes, getTakenTypesForVenues } = require('../utils/availability')
const { uploadVenueImages, deleteImagesByUrl } = require('../utils/images')
const { MAX_FILES } = require('../middleware/upload')

const contains = (value) => ({ contains: value, mode: 'insensitive' })

// GET /api/venues  (public, only active venues)
const listVenues = asyncHandler(async (req, res) => {
  const { search, category, city, minCapacity, maxCapacity, minPrice, maxPrice, date } = req.query

  const where = { isAvailable: true }
  if (search) where.OR = [{ name: contains(search) }, { city: contains(search) }]
  if (category) where.category = category
  if (city) where.city = contains(city)
  if (minCapacity || maxCapacity) {
    where.capacity = {}
    if (minCapacity) where.capacity.gte = minCapacity
    if (maxCapacity) where.capacity.lte = maxCapacity
  }
  if (minPrice || maxPrice) {
    where.pricePerHour = {}
    if (minPrice) where.pricePerHour.gte = minPrice
    if (maxPrice) where.pricePerHour.lte = maxPrice
  }

  let venues = await prisma.venue.findMany({
    where,
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
  })

  // With a date: keep only venues that still have at least one free slot that day
  if (date) {
    const taken = await getTakenTypesForVenues(venues.map((v) => v.id), parseDateOnly(date))
    venues = venues.filter((v) => hasAnyFreeSlot(taken.get(v.id)))
  }

  return ok(res, venues)
})

// GET /api/venues/featured
const featuredVenues = asyncHandler(async (req, res) => {
  const venues = await prisma.venue.findMany({
    where: { isAvailable: true },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    take: 3,
  })
  return ok(res, venues)
})

// GET /api/venues/:id
const getVenue = asyncHandler(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } })
  if (!venue) throw new ApiError(404, 'Venue not found')
  return ok(res, venue)
})

// GET /api/venues/:id/slots?date=YYYY-MM-DD
const venueSlots = asyncHandler(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id }, select: { id: true } })
  if (!venue) throw new ApiError(404, 'Venue not found')

  const taken = await getTakenTypes(prisma, venue.id, parseDateOnly(req.query.date))
  return ok(res, computeAvailability(taken))
})

// GET /api/venues/:id/reviews  (latest 10)
const venueReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { venueId: req.params.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  return ok(res, reviews)
})

// ─── Admin ───────────────────────────────────────────────────────────────────

// GET /api/admin/venues
const adminListVenues = asyncHandler(async (req, res) => {
  const venues = await prisma.venue.findMany({ orderBy: { createdAt: 'desc' } })
  return ok(res, venues)
})

// POST /api/venues   (multipart/form-data, images in field "images")
const createVenue = asyncHandler(async (req, res) => {
  const { existingImages, amenities, ...fields } = req.body
  const files = req.files || []

  const images = await uploadVenueImages(files)
  try {
    const venue = await prisma.venue.create({
      data: { ...fields, amenities: amenities || [], images },
    })
    return ok(res, venue, 'Venue created', 201)
  } catch (err) {
    await deleteImagesByUrl(images) // don't leave orphan files in Cloudinary
    throw err
  }
})

// PUT /api/venues/:id   (multipart/form-data or JSON)
// existingImages = URLs to keep; new files in "images" are appended; everything else is removed.
const updateVenue = asyncHandler(async (req, res) => {
  const current = await prisma.venue.findUnique({ where: { id: req.params.id } })
  if (!current) throw new ApiError(404, 'Venue not found')

  const { existingImages, ...fields } = req.body
  const files = req.files || []

  const imagesTouched = existingImages !== undefined || files.length > 0
  const kept = existingImages === undefined ? current.images : existingImages.filter((u) => current.images.includes(u))
  if (kept.length + files.length > MAX_FILES) {
    throw new ApiError(400, `A venue can have at most ${MAX_FILES} images`)
  }

  const uploaded = await uploadVenueImages(files)
  const data = { ...fields }
  if (imagesTouched) data.images = [...kept, ...uploaded]

  let venue
  try {
    venue = await prisma.venue.update({ where: { id: current.id }, data })
  } catch (err) {
    await deleteImagesByUrl(uploaded)
    throw err
  }

  if (imagesTouched) {
    await deleteImagesByUrl(current.images.filter((u) => !kept.includes(u)))
  }
  return ok(res, venue)
})

// PATCH /api/venues/:id/status   { isAvailable }
const toggleVenue = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body
  await prisma.venue.update({ where: { id: req.params.id }, data: { isAvailable } })
  return ok(res, undefined, `Venue ${isAvailable ? 'activated' : 'deactivated'}`)
})

// DELETE /api/venues/:id
const deleteVenue = asyncHandler(async (req, res) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } })
  if (!venue) throw new ApiError(404, 'Venue not found')

  const bookings = await prisma.booking.count({ where: { venueId: venue.id } })
  if (bookings > 0) {
    throw new ApiError(409, 'This venue has bookings and cannot be deleted. Deactivate it instead')
  }

  await prisma.venue.delete({ where: { id: venue.id } })
  await deleteImagesByUrl(venue.images)
  return ok(res, undefined, 'Venue deleted')
})

module.exports = {
  listVenues,
  featuredVenues,
  getVenue,
  venueSlots,
  venueReviews,
  adminListVenues,
  createVenue,
  updateVenue,
  toggleVenue,
  deleteVenue,
}
