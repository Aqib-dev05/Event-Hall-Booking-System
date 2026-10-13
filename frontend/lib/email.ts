import nodemailer from 'nodemailer'
import { BookingDoc, VenueDoc, UserDoc } from '@/types'
import { SLOT_CONFIG, formatTime } from './slots'
import { format } from 'date-fns'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

function getBaseLayout(content: string): string {
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

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'EEEE, MMMM d, yyyy')
}

function getCalendarLink(booking: BookingDoc, venue: VenueDoc): string {
  const slot = SLOT_CONFIG[booking.bookingType]
  const date = new Date(booking.eventDate)
  const startDateTime = new Date(date)
  const [sh, sm] = slot.start.split(':')
  startDateTime.setHours(parseInt(sh), parseInt(sm), 0)
  const endDateTime = new Date(date)
  const [eh, em] = slot.end.split(':')
  endDateTime.setHours(parseInt(eh), parseInt(em), 0)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.eventType} at ${venue.name}`,
    dates: `${fmt(startDateTime)}/${fmt(endDateTime)}`,
    details: `Event Hall Booking #${booking._id}`,
    location: venue.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export async function sendBookingConfirmationEmail(
  to: string,
  booking: BookingDoc,
  venue: VenueDoc
) {
  const slot = SLOT_CONFIG[booking.bookingType]
  const calLink = getCalendarLink(booking, venue as VenueDoc)

  const html = getBaseLayout(`
    <div class="header">
      <h1>EventHall</h1>
      <p>Booking Confirmation</p>
    </div>
    <div class="body">
      <h2 style="color:#111827; margin:0 0 8px">🎉 Your booking is confirmed!</h2>
      <p style="color:#6b7280; margin:0 0 20px">Here are the details for your upcoming event.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Booking ID</span><span class="detail-value">#${booking._id.toString().slice(-8).toUpperCase()}</span></div>
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${venue.name}</span></div>
        <div class="detail-row"><span class="detail-label">Location</span><span class="detail-value">${venue.location}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Time Slot</span><span class="detail-value">${slot.label}: ${formatTime(slot.start)} – ${formatTime(slot.end)}</span></div>
        <div class="detail-row"><span class="detail-label">Event Type</span><span class="detail-value">${booking.eventType}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${booking.guestCount}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge">Confirmed</span></span></div>
        <div class="total-row"><span>Total Paid</span><span>Rs. ${booking.totalAmount.toLocaleString()}</span></div>
      </div>
      <a href="${calLink}" class="btn">📅 Add to Google Calendar</a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings" class="btn" style="background:#f3f4f6; color:#1a1a2e; margin-left:12px">View My Bookings</a>
    </div>
  `)

  await transporter.sendMail({
    from: `"EventHall Pakistan" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Booking Confirmed – ${venue.name} on ${formatDate(booking.eventDate)}`,
    html,
  })
}

export async function sendBookingReminderEmail(
  to: string,
  booking: BookingDoc,
  venue: VenueDoc
) {
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
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${venue.name}</span></div>
        <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${venue.location}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${slot.label}: ${formatTime(slot.start)} – ${formatTime(slot.end)}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${booking.guestCount}</span></div>
      </div>
      <p style="color:#6b7280; font-size:14px">Please arrive 15 minutes early. Contact us if you need any assistance.</p>
    </div>
  `)

  await transporter.sendMail({
    from: `"EventHall Pakistan" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⏰ Reminder: Your event at ${venue.name} is tomorrow!`,
    html,
  })
}

export async function sendCancellationEmail(
  to: string,
  booking: BookingDoc,
  venue: VenueDoc
) {
  const html = getBaseLayout(`
    <div class="header" style="background: linear-gradient(135deg, #450a0a, #7f1d1d);">
      <h1>EventHall</h1>
      <p>Booking Cancellation</p>
    </div>
    <div class="body">
      <h2 style="color:#111827; margin:0 0 8px">Booking Cancelled</h2>
      <p style="color:#6b7280; margin:0 0 20px">Your booking has been successfully cancelled.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Booking ID</span><span class="detail-value">#${booking._id.toString().slice(-8).toUpperCase()}</span></div>
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${venue.name}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">Rs. ${booking.totalAmount.toLocaleString()}</span></div>
        <div class="detail-row"><span class="detail-label">Refund Status</span><span class="detail-value"><span class="badge warning-badge">Processing (3-5 business days)</span></span></div>
      </div>
      <p style="color:#6b7280; font-size:14px">Your refund will be processed within 3-5 business days to your original payment method.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/venues" class="btn">Browse Other Venues</a>
    </div>
  `)

  await transporter.sendMail({
    from: `"EventHall Pakistan" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Booking Cancelled – ${venue.name}`,
    html,
  })
}

export async function sendAdminNewBookingAlert(
  booking: BookingDoc,
  venue: VenueDoc,
  user: UserDoc
) {
  const adminEmail = process.env.EMAIL_USER!
  const slot = SLOT_CONFIG[booking.bookingType]

  const html = getBaseLayout(`
    <div class="header">
      <h1>EventHall Admin</h1>
      <p>New Booking Alert</p>
    </div>
    <div class="body">
      <h2 style="color:#111827; margin:0 0 8px">🆕 New Booking Received</h2>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Customer</span><span class="detail-value">${user.name} (${user.email})</span></div>
        <div class="detail-row"><span class="detail-label">Venue</span><span class="detail-value">${venue.name}</span></div>
        <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(booking.eventDate)}</span></div>
        <div class="detail-row"><span class="detail-label">Slot</span><span class="detail-value">${slot.label}</span></div>
        <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${booking.guestCount}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">Rs. ${booking.totalAmount.toLocaleString()}</span></div>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings" class="btn">View in Admin Panel</a>
    </div>
  `)

  await transporter.sendMail({
    from: `"EventHall System" <${adminEmail}>`,
    to: adminEmail,
    subject: `🆕 New Booking: ${venue.name} – Rs. ${booking.totalAmount.toLocaleString()}`,
    html,
  })
}
