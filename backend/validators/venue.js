const { z } = require('zod')
const { parseDateOnly } = require('../utils/dates')

const CATEGORIES = ['party', 'wedding', 'corporate', 'birthday', 'concert', 'other']

const idParam = z.object({ id: z.string().min(1, 'Invalid id') })

// "YYYY-MM-DD" that is a real calendar date
const dateOnly = z
  .string({ required_error: 'Date is required' })
  .refine((v) => parseDateOnly(v) !== null, 'Date must be in YYYY-MM-DD format')

// Multipart bodies arrive as strings, so numbers are coerced and arrays are sent as JSON strings.
const jsonStringArray = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return undefined
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value // fails the array check below with a clear message
    }
  }
  return value
}, z.array(z.string().trim().min(1)).optional())

const venueFields = {
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name is required'),
  description: z.string({ required_error: 'Description is required' }).trim().min(20, 'Description must be at least 20 characters'),
  location: z.string({ required_error: 'Address is required' }).trim().min(5, 'Full address required'),
  city: z.string({ required_error: 'City is required' }).trim().min(2, 'City is required'),
  capacity: z.coerce.number({ invalid_type_error: 'Capacity must be a number' }).int().min(1, 'Capacity must be at least 1'),
  pricePerHour: z.coerce.number({ invalid_type_error: 'Price must be a number' }).int().min(1, 'Price is required'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),
  amenities: jsonStringArray,
  // URLs of already-uploaded images that should be kept (edit form)
  existingImages: jsonStringArray,
}

const createVenueSchema = z.object(venueFields)
const updateVenueSchema = z.object(venueFields).partial()

const toggleVenueSchema = z.object({ isAvailable: z.boolean({ required_error: 'isAvailable is required' }) })

const listVenuesQuery = z.object({
  search: z.string().trim().optional(),
  category: z.enum(CATEGORIES).optional(),
  city: z.string().trim().optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  maxCapacity: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  // only venues with at least one free slot on that day
  date: dateOnly.optional(),
})

const slotsQuery = z.object({ date: dateOnly })

/** @typedef {z.infer<typeof createVenueSchema>} CreateVenueInput */
/** @typedef {z.infer<typeof listVenuesQuery>} ListVenuesQuery */

module.exports = {
  CATEGORIES,
  idParam,
  createVenueSchema,
  updateVenueSchema,
  toggleVenueSchema,
  listVenuesQuery,
  slotsQuery,
}
