const prisma = require('../config/db')
const env = require('../config/env')
const { stripe } = require('../config/stripe')
const { ApiError, asyncHandler, ok } = require('../utils/response')
const { parseDateOnly, todayInTimezone } = require('../utils/dates')
const { calculateTotal } = require('../utils/slots')

function requireStripe() {
  if (!stripe) throw new ApiError(503, 'Payments are not configured (missing STRIPE_SECRET_KEY)')
  return stripe
}

// POST /api/payments/create-intent   { venueId, bookingType, eventDate }
// The price is calculated here on the server — the client never decides the amount.
const createIntent = asyncHandler(async (req, res) => {
  const stripeClient = requireStripe()
  const { venueId, bookingType, eventDate } = req.body

  const venue = await prisma.venue.findUnique({ where: { id: venueId } })
  if (!venue) throw new ApiError(404, 'Venue not found')
  if (!venue.isAvailable) throw new ApiError(400, 'This venue is not available')
  if (parseDateOnly(eventDate) < todayInTimezone(env.TIMEZONE)) {
    throw new ApiError(400, 'Event date cannot be in the past')
  }

  const { total } = calculateTotal(venue.pricePerHour, bookingType)

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: Math.round(total * 100), // PKR minor unit (paisa)
    currency: 'pkr',
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: { userId: req.user.id, venueId, bookingType, eventDate },
  })

  return ok(res, { clientSecret: paymentIntent.client_secret, amount: total })
})

// POST /api/payments/webhook  (raw body — registered in app.js before express.json)
const webhook = async (req, res) => {
  const stripeClient = requireStripe()
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, error: 'STRIPE_WEBHOOK_SECRET is not configured' })
  }

  let event
  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ success: false, error: 'Invalid signature' })
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      // Only touches bookings that are still unpaid, so a late/retried webhook can never
      // undo a cancellation, refund or "completed" status.
      await prisma.booking.updateMany({
        where: { paymentIntentId: event.data.object.id, paymentStatus: 'unpaid' },
        data: { paymentStatus: 'paid', status: 'confirmed' },
      })
    } else if (event.type === 'payment_intent.payment_failed') {
      console.warn(`[stripe] payment failed for intent ${event.data.object.id}`)
    }
  } catch (err) {
    console.error('Webhook handling failed:', err)
    return res.status(500).json({ success: false, error: 'Webhook handler failed' })
  }

  res.json({ received: true })
}

module.exports = { createIntent, webhook }
