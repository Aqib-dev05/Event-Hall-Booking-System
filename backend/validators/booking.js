const { z } = require('zod')
const { SLOT_TYPES } = require('../utils/slots')
const { parseDateOnly } = require('../utils/dates')

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed']

const eventDate = z
  .string({ required_error: 'Please select a date' })
  .refine((v) => parseDateOnly(v) !== null, 'Date must be in YYYY-MM-DD format')

const bookingType = z.enum(SLOT_TYPES, { errorMap: () => ({ message: 'Please select a time slot' }) })

const createBookingSchema = z.object({
  venueId: z.string({ required_error: 'venueId is required' }).min(1, 'venueId is required'),
  eventType: z.string({ required_error: 'Please select event type' }).trim().min(1, 'Please select event type'),
  eventDate,
  bookingType,
  guestCount: z.number({ required_error: 'Guest count is required', invalid_type_error: 'Guest count must be a number' }).int().min(1, 'At least 1 guest required'),
  specialRequests: z.string().trim().optional(),
  paymentIntentId: z.string({ required_error: 'paymentIntentId is required' }).min(1, 'paymentIntentId is required'),
})

const createReviewSchema = z.object({
  bookingId: z.string({ required_error: 'bookingId is required' }).min(1),
  venueId: z.string({ required_error: 'venueId is required' }).min(1),
  rating: z.number({ required_error: 'Please select a rating' }).int().min(1, 'Please select a rating').max(5, 'Rating must be between 1 and 5'),
  comment: z.string({ required_error: 'Comment is required' }).trim().min(10, 'Comment must be at least 10 characters'),
})

const updateStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
})

const adminBookingsQuery = z.object({ search: z.string().trim().optional() })

const createIntentSchema = z.object({
  venueId: z.string({ required_error: 'venueId is required' }).min(1, 'venueId is required'),
  bookingType,
  eventDate,
})

/** @typedef {z.infer<typeof createBookingSchema>} CreateBookingInput */
/** @typedef {z.infer<typeof createReviewSchema>} CreateReviewInput */

module.exports = {
  createBookingSchema,
  createReviewSchema,
  updateStatusSchema,
  adminBookingsQuery,
  createIntentSchema,
}
