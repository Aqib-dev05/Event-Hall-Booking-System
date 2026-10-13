const router = require('express').Router()
const ctrl = require('../controllers/booking.controller')
const { requireAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { idParam } = require('../validators/venue')
const { createBookingSchema, createReviewSchema } = require('../validators/booking')

router.use(requireAuth)

router.post('/', validate(createBookingSchema), ctrl.createBooking)
router.get('/my', ctrl.myBookings)
router.post('/review', validate(createReviewSchema), ctrl.submitReview)
router.get('/:id', validate(idParam, 'params'), ctrl.getBooking)
router.patch('/:id/cancel', validate(idParam, 'params'), ctrl.cancelBooking)

module.exports = router
