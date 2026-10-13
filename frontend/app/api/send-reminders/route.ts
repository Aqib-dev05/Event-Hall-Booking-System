import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { connectDB } from '@/lib/db'
import Booking from '@/models/Booking'
import User from '@/models/User'
import Venue from '@/models/Venue'
import { sendBookingReminderEmail } from '@/lib/email'
import { addDays, startOfDay, endOfDay } from 'date-fns'
import type { UserDoc, VenueDoc } from '@/types'

export async function GET(req: NextRequest) {
  try {
    // Basic security: only allow Vercel cron or admin
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const tomorrow = addDays(new Date(), 1)
    const bookings = await Booking.find({
      eventDate: { $gte: startOfDay(tomorrow), $lte: endOfDay(tomorrow) },
      status: 'confirmed',
      reminderSent: false,
    }).lean()

    let sent = 0
    for (const booking of bookings) {
      try {
        const [user, venue] = await Promise.all([
          User.findById(booking.user).lean<UserDoc | null>(),
          Venue.findById(booking.venue).lean<VenueDoc | null>(),
        ])

        if (user && venue) {
          await sendBookingReminderEmail(
            user.email,
            JSON.parse(JSON.stringify(booking)),
            JSON.parse(JSON.stringify(venue))
          )
          await Booking.findByIdAndUpdate(booking._id, { reminderSent: true })
          sent++
        }
      } catch (e) {
        console.error(`Failed to send reminder for booking ${booking._id}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} reminder(s) out of ${bookings.length} eligible bookings`,
    })
  } catch (e) {
    console.error('Cron job failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
