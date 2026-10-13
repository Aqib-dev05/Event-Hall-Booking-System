const router = require('express').Router()
const { createIntent } = require('../controllers/payment.controller')
const { requireAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { createIntentSchema } = require('../validators/booking')

// The Stripe webhook is registered in app.js (it needs the raw request body).
router.post('/create-intent', requireAuth, validate(createIntentSchema), createIntent)

module.exports = router
