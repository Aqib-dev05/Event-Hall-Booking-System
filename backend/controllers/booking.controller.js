const prisma = require('../config/db')
const env = require('../config/env')
const { stripe } = require('../config/stripe')
const { ApiError, asyncHandler, ok } = require('../utils/response')
const { parseDateOnly, todayInTimezone, hoursUntil } = require('../utils/dates')
const { SLOT_CONFIG, getSlotLabel, calculateTotal, isSlotFree } = require('../utils/slots')
const { getTakenTypes } = require('../utils/availability')
const { USER_BRIEF, VENUE_BRIEF } = require('../utils/selects')
const {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendAdminNewBookingAlert,
} = require('../utils/email')

const SLOT_CONFLICT = 'SLOT_CONFLICT'

function slotConflictMessage(taken, wanted) {
  if (taken.includes('fullday')) return 'This venue is fully booked for the selected date'
  if (wanted === 'fullday') return 'Full day booking not available — some slots already taken'
  return 'This slot is already booked'
}

/** Confirms with Stripe that this exact payment succeeded for this exact booking. */
async function verifyPayment({ paymentIntentId, total, userId, venueId, bookingType, eventDate }) {
  if (!stripe) throw new ApiError(503, 'Payments are not configured (missing STRIPE_SECRET_KEY)')

  let intent
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch {
    throw new ApiError(400, 'Invalid payment reference')
  }

  if (intent.status !== 'succeeded') throw new ApiError(400, 'Payment has not been completed')

  const m = intent.metadata || {}
  const matches =
    intent.amount === Math.round(total * 100) &&
    intent.currency === 'pkr' &&
    m.userId === userId &&
    m.venueId === venueId &&
    m.bookingType === bookingType &&
    m.eventDate === eventDate
  if (!matches) throw new ApiError(400, 'Payment does not match this booking')
}

/** Best-effort full refund. Returns true when the money is (or already was) refunded. */
async function refundPayment(paymentIntentId, idempotencyKey) {
  if (!stripe) return false
  try {
    await stripe.refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey })
    return true
  } catch (err) {
    if (err.code === 'charge_already_refunded') return true
    console.error(`[stripe] refund failed for ${paymentIntentId}:`, err.message)
    return false
  }
}

// POST /api/bookings
const createBooking = asyncHandler(async (req, res) => {
  const data = req.body
  const userId = req.user.id

  const venue = await prisma.venue.findUnique({ where: { id: data.venueId } })
  if (!venue) throw new ApiError(404, 'Venue not found')
  if (!venue.isAvailable) throw new ApiError(400, 'This venue is not available')
  if (data.guestCount > venue.capacity) {
    throw new ApiError(400, `Guest count exceeds venue capacity of ${venue.capacity}`)
  }

  const eventDate = parseDateOnly(data.eventDate)
  if (eventDate < todayInTimezone(env.TIMEZONE)) {
    throw new ApiError(400, 'Event date cannot be in the past')
  }

  const slot = SLOT_CONFIG[data.bookingType]
  const { durationHrs, total } = calculateTotal(venue.pricePerHour, data.bookingType)

  await verifyPayment({
    paymentIntentId: data.paymentIntentId,
    total,
    userId,
    venueId: venue.id,
    bookingType: data.bookingType,
    eventDate: data.eventDate,
  })

  let booking
  try {
    // Serializable: two people paying for the same slot at the same moment can never both succeed.
    booking = await prisma.$transaction(
      async (tx) => {
        const taken = await getTakenTypes(tx, venue.id, eventDate)
        if (!isSlotFree(taken, data.bookingType)) {
          const err = new ApiError(409, slotConflictMessage(taken, data.bookingType))
          err.code = SLOT_CONFLICT
          throw err
        }
        return tx.booking.create({
          data: {
            userId,
            venueId: venue.id,
            eventType: data.eventType,
            eventDate,
            bookingType: data.bookingType,
            slotLabel: getSlotLabel(data.bookingType),
            slotStart: slot.start,
            slotEnd: slot.end,
            durationHrs,
            guestCount: data.guestCount,
            totalAmount: total,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentIntentId: data.paymentIntentId,
            specialRequests: data.specialRequests || null,
          },
          include: { venue: true, user: { select: { ...USER_BRIEF, phone: true } } },
        })
      },
      { isolationLevel: 'Serializable' }
    )
  } catch (err) {
    if (err.code === 'P2002') {
      throw new ApiError(409, 'This payment has already been used for a booking')
    }
    // The customer already paid but somebody else got the slot first -> give the money back.
    if (err.code === SLOT_CONFLICT || err.code === 'P2034') {
      const refunded = await refundPayment(data.paymentIntentId, `slot-conflict-${data.paymentIntentId}`)
      const base = err.code === SLOT_CONFLICT ? err.message : 'This slot was just booked by someone else'
      throw new ApiError(
        409,
        refunded
          ? `${base}. Your payment has been refunded automatically`
          : `${base}. Please contact support to get your payment refunded`
      )
    }
    throw err
  }

  // Emails never block or break the booking.
  Promise.allSettled([
    sendBookingConfirmationEmail(booking.user.email, booking, booking.venue),
    sendAdminNewBookingAlert(booking, booking.venue, booking.user),
  ]).then((results) =>
    results.forEach((r) => r.status === 'rejected' && console.error('Email send failed:', r.reason))
  )

  return ok(res, booking, undefined, 201)
})

// GET /api/bookings/my
const myBookings = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { venue: { select: VENUE_BRIEF } },
    orderBy: { createdAt: 'desc' },
  })
  return ok(res, bookings)
})

// GET /api/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { venue: true, user: { select: { ...USER_BRIEF, phone: true } } },
  })
  if (!booking) throw new ApiError(404, 'Booking not found')

  if (booking.userId !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Unauthorized')
  }
  return ok(res, booking)
})

// PATCH /api/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { venue: true, user: { select: { email: true } } },
  })
  if (!booking) throw new ApiError(404, 'Booking not found')

  const isAdmin = req.user.role === 'admin'
  if (booking.userId !== req.user.id && !isAdmin) throw new ApiError(403, 'Unauthorized')

  if (booking.status === 'cancelled') throw new ApiError(400, 'Booking is already cancelled')
  if (booking.status === 'completed') throw new ApiError(400, 'Completed bookings cannot be cancelled')

  // Customers must cancel more than 48 hours before the event
  if (!isAdmin && hoursUntil(booking.eventDate) < 48) {
    throw new ApiError(400, 'Cannot cancel bookings within 48 hours of the event')
  }

  let refunded = false
  if (booking.paymentStatus === 'paid') {
    if (booking.paymentIntentId) {
      refunded = await refundPayment(booking.paymentIntentId, `cancel-${booking.id}`)
      if (!refunded) throw new ApiError(502, 'Refund could not be processed. Please try again or contact support')
    } else {
      refunded = true
    }
  }

  const result = await prisma.booking.updateMany({
    where: { id: booking.id, status: { notIn: ['cancelled', 'completed'] } },
    data: { status: 'cancelled', paymentStatus: refunded ? 'refunded' : booking.paymentStatus },
  })
  if (result.count === 0) throw new ApiError(409, 'Booking was changed by someone else. Please refresh')

  sendCancellationEmail(booking.user.email, booking, booking.venue, refunded).catch((e) =>
    console.error('Email send failed:', e)
  )

  return ok(res, undefined, 'Booking cancelled successfully')
})

// POST /api/bookings/review   { bookingId, venueId, rating, comment }
const submitReview = asyncHandler(async (req, res) => {
  const { bookingId, venueId, rating, comment } = req.body

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) throw new ApiError(404, 'Booking not found')
  if (booking.userId !== req.user.id) throw new ApiError(403, 'Unauthorized')
  if (booking.venueId !== venueId) throw new ApiError(400, 'Booking does not belong to this venue')
  if (booking.status !== 'completed') throw new ApiError(400, 'Can only review completed bookings')

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: { userId: req.user.id, venueId, bookingId, rating, comment },
      })
      const agg = await tx.review.aggregate({
        where: { venueId },
        _avg: { rating: true },
        _count: { _all: true },
      })
      await tx.venue.update({
        where: { id: venueId },
        data: {
          rating: Math.round((agg._avg.rating || 0) * 10) / 10,
          totalReviews: agg._count._all,
        },
      })
    })
  } catch (err) {
    if (err.code === 'P2002') throw new ApiError(409, 'You have already reviewed this booking')
    throw err
  }

  return ok(res, undefined, 'Review submitted successfully', 201)
})

module.exports = { createBooking, myBookings, getBooking, cancelBooking, submitReview }
