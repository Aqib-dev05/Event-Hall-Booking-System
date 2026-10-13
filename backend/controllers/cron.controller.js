const prisma = require('../config/db')
const env = require('../config/env')
const { ApiError, asyncHandler, ok } = require('../utils/response')
const { tomorrowInTimezone } = require('../utils/dates')
const { sendBookingReminderEmail } = require('../utils/email')

/** Sends the "your event is tomorrow" email for every confirmed booking happening tomorrow. */
async function runReminders() {
  const tomorrow = tomorrowInTimezone(env.TIMEZONE)

  const bookings = await prisma.booking.findMany({
    where: { eventDate: tomorrow, status: 'confirmed', reminderSent: false },
    include: { user: { select: { email: true } }, venue: true },
  })

  let sent = 0
  for (const booking of bookings) {
    try {
      await sendBookingReminderEmail(booking.user.email, booking, booking.venue)
      await prisma.booking.update({ where: { id: booking.id }, data: { reminderSent: true } })
      sent++
    } catch (e) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, e)
    }
  }
  return { sent, eligible: bookings.length }
}

// GET /api/cron/send-reminders   (Authorization: Bearer <CRON_SECRET>)
// Handy for an external scheduler; the server also runs it by itself every day at 09:00 (see server.js).
const sendReminders = asyncHandler(async (req, res) => {
  if (!env.CRON_SECRET || req.headers.authorization !== `Bearer ${env.CRON_SECRET}`) {
    throw new ApiError(401, 'Unauthorized')
  }
  const { sent, eligible } = await runReminders()
  return ok(res, { sent, eligible }, `Sent ${sent} reminder(s) out of ${eligible} eligible bookings`)
})

module.exports = { runReminders, sendReminders }
