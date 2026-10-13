const router = require('express').Router()

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }))

router.use('/auth', require('./auth'))
router.use('/users', require('./user'))
router.use('/venues', require('./venue'))
router.use('/bookings', require('./booking'))
router.use('/payments', require('./payment'))
router.use('/admin', require('./admin'))
router.use('/cron', require('./cron'))

module.exports = router
