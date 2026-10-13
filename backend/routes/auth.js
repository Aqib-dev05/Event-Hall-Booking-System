const router = require('express').Router()
const { register, login, me } = require('../controllers/auth.controller')
const { requireAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../validators/auth')

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/me', requireAuth, me)

module.exports = router
