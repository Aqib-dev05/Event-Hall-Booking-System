const router = require('express').Router()
const ctrl = require('../controllers/venue.controller')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { venueImages } = require('../middleware/upload')
const v = require('../validators/venue')

// Public
router.get('/', validate(v.listVenuesQuery, 'query'), ctrl.listVenues)
router.get('/featured', ctrl.featuredVenues)
router.get('/:id', validate(v.idParam, 'params'), ctrl.getVenue)
router.get('/:id/slots', validate(v.idParam, 'params'), validate(v.slotsQuery, 'query'), ctrl.venueSlots)
router.get('/:id/reviews', validate(v.idParam, 'params'), ctrl.venueReviews)

// Admin — multer must run before validate so multipart text fields are in req.body
router.post('/', requireAuth, requireAdmin, venueImages, validate(v.createVenueSchema), ctrl.createVenue)
router.put('/:id', requireAuth, requireAdmin, validate(v.idParam, 'params'), venueImages, validate(v.updateVenueSchema), ctrl.updateVenue)
router.patch('/:id/status', requireAuth, requireAdmin, validate(v.idParam, 'params'), validate(v.toggleVenueSchema), ctrl.toggleVenue)
router.delete('/:id', requireAuth, requireAdmin, validate(v.idParam, 'params'), ctrl.deleteVenue)

module.exports = router
