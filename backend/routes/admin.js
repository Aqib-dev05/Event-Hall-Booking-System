const router = require('express').Router()
const ctrl = require('../controllers/admin.controller')
const { adminListVenues } = require('../controllers/venue.controller')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { idParam } = require('../validators/venue')
const { updateStatusSchema, adminBookingsQuery } = require('../validators/booking')

router.use(requireAuth, requireAdmin)

router.get('/stats', ctrl.stats)
router.get('/venues', adminListVenues)
router.get('/users', ctrl.listUsers)
router.get('/bookings', validate(adminBookingsQuery, 'query'), ctrl.listBookings)
router.patch('/bookings/:id/status', validate(idParam, 'params'), validate(updateStatusSchema), ctrl.updateBookingStatus)

module.exports = router
