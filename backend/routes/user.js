const router = require('express').Router()
const ctrl = require('../controllers/user.controller')
const { requireAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { updateProfileSchema, changePasswordSchema } = require('../validators/user')

router.use(requireAuth)

router.get('/me', ctrl.getProfile)
router.patch('/me', validate(updateProfileSchema), ctrl.updateProfile)
router.put('/me/password', validate(changePasswordSchema), ctrl.changePassword)
router.get('/me/stats', ctrl.dashboardStats)

module.exports = router
