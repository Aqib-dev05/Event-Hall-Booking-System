import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getBookingById } from '@/actions/booking.actions'
import { SLOT_CONFIG, formatTime } from '@/lib/slots'
import { CheckCircle, Calendar, Download, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import type { BookingDoc } from '@/types'

interface Props { params: { bookingId: string } }

export const metadata = { title: 'Booking Confirmed!' }

function getCalendarLink(booking: BookingDoc, venueName: string, venueLocation: string) {
  const slot = SLOT_CONFIG[booking.bookingType]
  const date = new Date(booking.eventDate)
  const startDT = new Date(date); const [sh, sm] = slot.start.split(':'); startDT.setHours(+sh, +sm, 0)
  const endDT = new Date(date); const [eh, em] = slot.end.split(':'); endDT.setHours(+eh, +em, 0)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.eventType} at ${venueName}`,
    dates: `${fmt(startDT)}/${fmt(endDT)}`,
    location: venueLocation,
    details: `EventHall Booking #${booking.id.slice(-8).toUpperCase()}`,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export default async function ConfirmationPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const result = await getBookingById(params.bookingId)
  if (!result.success || !result.data) return notFound()

  const booking = result.data
  const venue = booking.venue as any
  const slot = SLOT_CONFIG[booking.bookingType]
  const calLink = getCalendarLink(booking, venue.name, venue.location)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Success animation */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <h1 className="text-4xl font-bold mb-2">Booking Confirmed! 🎉</h1>
      <p className="text-muted-foreground mb-8">
        A confirmation email has been sent to your email address.
      </p>

      {/* Booking details card */}
      <div className="bg-white rounded-2xl border border-border p-6 text-left shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Booking Summary</h2>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
            ✅ Confirmed
          </span>
        </div>
        <div className="space-y-3">
          {[
            ['Booking ID', `#${booking.id.slice(-8).toUpperCase()}`],
            ['Venue', venue.name],
            ['Location', venue.location + ', ' + venue.city],
            ['Date', format(new Date(booking.eventDate), 'EEEE, MMMM d, yyyy')],
            ['Time Slot', `${slot.label}: ${formatTime(slot.start)} – ${formatTime(slot.end)}`],
            ['Event Type', booking.eventType],
            ['Guests', booking.guestCount.toString()],
            ['Payment', `Rs. ${booking.totalAmount.toLocaleString()} · Paid ✅`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={calLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Calendar className="w-4 h-4" /> Add to Google Calendar
        </a>
        <Link
          href="/dashboard/bookings"
          className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-xl font-semibold text-sm hover:bg-secondary transition-colors"
        >
          View My Bookings <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Need help?{' '}
        <Link href="/venues" className="text-foreground underline hover:no-underline">
          Browse more venues
        </Link>
      </p>
    </div>
  )
}
