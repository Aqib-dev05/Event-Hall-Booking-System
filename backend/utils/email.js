const nodemailer = require('nodemailer')
const env = require('../config/env')
const { SLOT_CONFIG, formatTime } = require('./slots')
const { formatLongDate, toYmd } = require('./dates')

// Gmail service — only GMAIL_USER + GMAIL_APP_PASSWORD are needed (no host/port).
let transporter = null
function getTransporter() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    })
  }
  return transporter
}

async function send({ from, to, subject, html }) {
  const t = getTransporter()
  if (!t) {
    console.warn(`[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipped "${subject}"`)
    return
  }
  await t.sendMail({ from, to, subject, html })
}

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const shortId = (booking) => booking.id.slice(-8).toUpperCase()
const money = (n) => `Rs. ${n.toLocaleString('en-US')}`
const fromCustomer = () => `"EventHall Pakistan" <${env.GMAIL_USER}>`

function getBaseLayout(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; padding: 0; background: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif; }
      .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 40px; text-align: center; }
      .header h1 { color: #f8d66d; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
      .header p { color: #a0a8c0; margin: 8px 0 0; font-size: 14px; }
      .body { padding: 32px 40px; }
      .detail-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
      .detail-row:last-child { border-bottom: none; }
      .detail-label { color: #6b7280; }
      .detail-value { color: #111827; font-weight: 500; }
      .total-row { display: flex; justify-content: space-between; padding: 12px 0 0; font-size: 16px; font-weight: 700; color: #1a1a2e; }
      .btn { display: inline-block; background: #f8d66d; color: #1a1a2e; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 20px 0 8px; }
      .footer { padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; }
      .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .warning-badge { background: #fef3c7; color: #92400e; }
      .danger-badge { background: #fee2e2; color: #991b1b; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      ${content}
      <div class="footer">
        <p>EventHall Pakistan &bull; Connecting events with perfect venues</p>
        <p>This is an automated email — please do not reply directly.</p>
      </div>
    </div>
  </body>
  </html>
  `
}

// Slots are local Pakistan time (UTC+5, no DST) — the calendar link must carry the real instant.
const PKT_OFFSET = '+05:00'

function getCalendarLink(booking, venue) {
  const slot = SLOT_CONFIG[booking.bookingType]
  const day = toYmd(booking.eventDate)
  const start = new Date(`${day}T${slot.start}:00${PKT_OFFSET}`)
  const end = new Date(`${day}T${slot.end}:00${PKT_OFFSET}`)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.eventType} at ${venue.name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Event Hall Booking #${booking.id}`,
    location: venue.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

async function sendBookingConfirmationEmail(to, booking, venue) {
  const slot = SLOT_CONFIG[booking.bookingType]
  const calLink = getCalendarLink(booking, venue)

  const html = getBaseLayout(`
    <div class="header">
      <h1>EventHall</h1>
      <p>Booking Confirmation</p>
    </div>
    <div class="body">
      <h2 style="color:#111827; margin:0 0 8px">🎉 Your booking is confirmed!</h2>
      <p style="color:#6b7280; margin:0 0 20px">Here are the details for your upcoming event.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Booking ID</span><span class="detail-value">#${shortId(booking)}</span></div>
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${esc(venue.name)}</span></div>
        <div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${esc(venue.location)}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatLongDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Time Slot</span><span class="detail-value">${slot.label}: ${formatTime(slot.start)} – ${formatTime(slot.end)}</span></div>
        <div class="detail-row"><span class="detail-label">Event Type</span><span class="detail-value">${esc(booking.eventType)}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${booking.guestCount}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge">Confirmed</span></span></div>
        <div class="total-row"><span>Total Paid</span><span>${money(booking.totalAmount)}</span></div>
      </div>
      <a href="${calLink}" class="btn">📅 Add to Google Calendar</a>
      <a href="${env.frontendUrl}/dashboard/bookings" class="btn" style="background:#f3f4f6; color:#1a1a2e; margin-left:12px">View My Bookings</a>
    </div>
  `)

  await send({
    from: fromCustomer(),
    to,
    subject: `✅ Booking Confirmed – ${venue.name} on ${formatLongDate(booking.eventDate)}`,
    html,
  })
}

async function sendBookingReminderEmail(to, booking, venue) {
  const slot = SLOT_CONFIG[booking.bookingType]

  const html = getBaseLayout(`
    <div class="header">
      <h1>EventHall</h1>
      <p>Event Reminder</p>
    </div>
    <div class="body">
      <h2 style="color:#111827; margin:0 0 8px">⏰ Your event is tomorrow!</h2>
      <p style="color:#6b7280; margin:0 0 20px">Just a friendly reminder about your upcoming booking.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${esc(venue.name)}</span></div>
        <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${esc(venue.location)}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatLongDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${slot.label}: ${formatTime(slot.start)} – ${formatTime(slot.end)}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${booking.guestCount}</span></div>
      </div>
      <p style="color:#6b7280; font-size:14px">Please arrive 15 minutes early. Contact us if you need any assistance.</p>
    </div>
  `)

  await send({
    from: fromCustomer(),
    to,
    subject: `⏰ Reminder: Your event at ${venue.name} is tomorrow!`,
    html,
  })
}

async function sendCancellationEmail(to, booking, venue, refunded) {
  const refundBlock = refunded
    ? `<div class="detail-row"><span class="detail-label">Refund Status</span><span class="detail-value"><span class="badge warning-badge">Processing (3-5 business days)</span></span></div>`
    : ''
  const refundNote = refunded
    ? `<p style="color:#6b7280; font-size:14px">Your refund will be processed within 3-5 business days to your original payment method.</p>`
    : ''

  const html = getBaseLayout(`
    <div class="header" style="background: linear-gradient(135deg, #450a0a, #7f1d1d);">
      <h1>EventHall</h1>
      <p>Booking Cancellation</p>
    </div>
    <div class="body">
      <h2 style="color:#111827; margin:0 0 8px">Booking Cancelled</h2>
      <p style="color:#6b7280; margin:0 0 20px">Your booking has been successfully cancelled.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Booking ID</span><span class="detail-value">#${shortId(booking)}</span></div>
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${esc(venue.name)}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatLongDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">${money(booking.totalAmount)}</span></div>
        ${refundBlock}
      </div>
      ${refundNote}
      <a href="${env.frontendUrl}/venues" class="btn">Browse Other Venues</a>
    </div>
  `)

  await send({
    from: fromCustomer(),
    to,
    subject: `Booking Cancelled – ${venue.name}`,
    html,
  })
}

async function sendAdminNewBookingAlert(booking, venue, user) {
  const adminEmail = env.adminEmail
  if (!adminEmail) {
    console.warn('[email] No ADMIN_EMAIL / GMAIL_USER set — admin alert skipped')
    return
  }
  const slot = SLOT_CONFIG[booking.bookingType]

  const html = getBaseLayout(`
    <div class="header">
      <h1>EventHall Admin</h1>
      <p>New Booking Alert</p>
    </div>
    <div class="body">
      <h2 style="color:#111827; margin:0 0 8px">🆕 New Booking Received</h2>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Customer</span><span class="detail-value">${esc(user.name)} (${esc(user.email)})</span></div>
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${esc(venue.name)}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatLongDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Slot</span><span class="detail-value">${slot.label}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${booking.guestCount}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">${money(booking.totalAmount)}</span></div>
      </div>
      <a href="${env.frontendUrl}/admin/bookings" class="btn">View in Admin Panel</a>
    </div>
  `)

  await send({
    from: `"EventHall System" <${env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `🆕 New Booking: ${venue.name} – ${money(booking.totalAmount)}`,
    html,
  })
}

module.exports = {
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendCancellationEmail,
  sendAdminNewBookingAlert,
}
