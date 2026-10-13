import Link from 'next/link'
import { getMyBookings } from '@/actions/booking.actions'
import { SLOT_CONFIG, formatTime } from '@/lib/slots'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import { format, isFuture } from 'date-fns'
import { BookingDoc } from '@/types'

export const metadata = { title: 'My Bookings' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
}

interface Props {
  searchParams: { tab?: string }
}

export default async function MyBookingsPage({ searchParams }: Props) {
  const result = await getMyBookings()
  const allBookings = result.success ? result.data ?? [] : []
  const tab = searchParams.tab || 'all'

  function filterBookings(bookings: BookingDoc[]) {
    if (tab === 'upcoming') return bookings.filter((b) => b.status === 'confirmed' && isFuture(new Date(b.eventDate)))
    if (tab === 'past') return bookings.filter((b) => b.status === 'completed' || (!isFuture(new Date(b.eventDate)) && b.status !== 'cancelled'))
    if (tab === 'cancelled') return bookings.filter((b) => b.status === 'cancelled')
    return bookings
  }

  const bookings = filterBookings(allBookings)

  const TABS = [
    { key: 'all', label: 'All', count: allBookings.length },
    { key: 'upcoming', label: 'Upcoming', count: allBookings.filter((b) => b.status === 'confirmed' && isFuture(new Date(b.eventDate))).length },
    { key: 'past', label: 'Past', count: allBookings.filter((b) => b.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: allBookings.filter((b) => b.status === 'cancelled').length },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/bookings${t.key !== 'all' ? `?tab=${t.key}` : ''}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No bookings found</h3>
          <p className="text-muted-foreground text-sm mb-4">Ready to book your next event?</p>
          <Link href="/venues" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary/90">
            Browse Venues <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Venue</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Slot</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => {
                  const venue = booking.venue as any
                  const slot = SLOT_CONFIG[booking.bookingType]
                  return (
                    <tr key={booking.id} className="hover:bg-secondary/20">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={venue?.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=60'}
                            alt={venue?.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-sm">{venue?.name || 'Unknown Venue'}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {venue?.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {format(new Date(booking.eventDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {slot.label}<br />
                        <span className="text-xs">{formatTime(slot.start)} – {formatTime(slot.end)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[booking.status] || ''}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold">
                        Rs. {booking.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
