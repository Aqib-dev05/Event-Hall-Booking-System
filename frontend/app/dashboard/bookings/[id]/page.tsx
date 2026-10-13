import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getBookingById } from '@/actions/booking.actions'
import { SLOT_CONFIG, formatTime } from '@/lib/slots'
import { format, differenceInHours, isPast } from 'date-fns'
import CancelBookingButton from '@/components/dashboard/CancelBookingButton'
import ReviewForm from '@/components/dashboard/ReviewForm'
import { MapPin, Calendar, Users, CreditCard, ArrowLeft } from 'lucide-react'

interface Props { params: { id: string } }

export const metadata = { title: 'Booking Details' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
}

export default async function BookingDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const result = await getBookingById(params.id)
  if (!result.success || !result.data) return notFound()

  const booking = result.data
  const venue = booking.venue as any
  const slot = SLOT_CONFIG[booking.bookingType]

  const hoursUntilEvent = differenceInHours(new Date(booking.eventDate), new Date())
  const canCancel = booking.status === 'confirmed' && hoursUntilEvent >= 48
  const eventPassed = isPast(new Date(booking.eventDate))
  const canReview = eventPassed && booking.status === 'completed'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/bookings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground text-sm mt-1">#{booking.id.slice(-8).toUpperCase()}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${STATUS_STYLES[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Venue info */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold text-lg mb-4">Venue</h2>
            <div className="flex gap-4">
              <img
                src={venue?.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=120'}
                alt={venue?.name}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
              <div>
                <h3 className="font-bold text-lg">{venue?.name}</h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {venue?.location}, {venue?.city}
                </div>
                <Link
                  href={`/venues/${typeof venue === 'object' ? venue.id : venue}`}
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View venue page →
                </Link>
              </div>
            </div>
          </div>

          {/* Event details */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold text-lg mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Calendar className="w-4 h-4" />, label: 'Date', value: format(new Date(booking.eventDate), 'EEEE, MMMM d, yyyy') },
                { icon: <span className="text-sm">{slot.emoji}</span>, label: 'Time Slot', value: `${slot.label}: ${formatTime(slot.start)} – ${formatTime(slot.end)}` },
                { icon: <span className="text-sm">🎉</span>, label: 'Event Type', value: booking.eventType },
                { icon: <Users className="w-4 h-4" />, label: 'Guests', value: booking.guestCount.toString() },
              ].map((item) => (
                <div key={item.label} className="bg-secondary/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm">{item.icon}{item.label}</div>
                  <div className="font-semibold text-sm">{item.value}</div>
                </div>
              ))}
            </div>
            {booking.specialRequests && (
              <div className="mt-4 p-4 bg-secondary/50 rounded-xl">
                <div className="text-sm font-medium text-muted-foreground mb-1">Special Requests</div>
                <p className="text-sm">{booking.specialRequests}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h2 className="font-bold text-lg mb-4">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{slot.hours} hrs × Rs. {(venue?.pricePerHour || 0).toLocaleString()}/hr</span>
                <span>Rs. {(booking.totalAmount / 1.1).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service fee (10%)</span>
                <span>Rs. {(booking.totalAmount - booking.totalAmount / 1.1).toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total Paid</span>
                <span>Rs. {booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <CreditCard className="w-4 h-4" />
                <span>Status: <span className={booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{booking.paymentStatus}</span></span>
              </div>
            </div>
          </div>

          {/* Review form */}
          {canReview && (
            <ReviewForm bookingId={booking.id} venueId={typeof venue === 'object' ? venue.id : venue} />
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          {/* Cancel */}
          {canCancel && (
            <CancelBookingButton bookingId={booking.id} />
          )}
          {booking.status === 'confirmed' && hoursUntilEvent < 48 && hoursUntilEvent > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
              ⚠️ Cancellation window has passed (within 48 hrs of event)
            </div>
          )}

          {/* Calendar link */}
          {booking.status === 'confirmed' && !eventPassed && (
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.eventType + ' at ' + venue?.name)}&dates=${new Date(booking.eventDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=${encodeURIComponent(venue?.location || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 border border-border rounded-2xl text-sm font-medium hover:bg-secondary transition-colors"
            >
              📅 Add to Google Calendar
            </a>
          )}

          {/* Booking ID */}
          <div className="bg-white rounded-2xl border border-border p-4 text-sm">
            <div className="text-muted-foreground mb-1">Booking ID</div>
            <div className="font-mono font-bold">#{booking.id.slice(-8).toUpperCase()}</div>
            <div className="text-muted-foreground mt-3 mb-1">Booked on</div>
            <div>{format(new Date(booking.createdAt), 'MMM d, yyyy')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
