const router = require('express').Router()
const { sendReminders } = require('../controllers/cron.controller')

router.get('/send-reminders', sendReminders)

module.exports = router
