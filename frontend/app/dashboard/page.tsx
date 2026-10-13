import Link from 'next/link'
import { getMyDashboardStats } from '@/actions/user.actions'
import { auth } from '@/lib/auth'
import { Calendar, CheckCircle, Clock, DollarSign, ArrowRight, MapPin } from 'lucide-react'
import { SLOT_CONFIG, formatTime } from '@/lib/slots'
import { format } from 'date-fns'
import type { BookingDoc } from '@/types'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await auth()
  const result = await getMyDashboardStats()

  if (!result.success || !result.data) {
    return <div className="text-muted-foreground">Failed to load dashboard</div>
  }

  const stats = result.data

  const STAT_CARDS = [
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Upcoming',
      value: stats.upcomingBookings,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Completed',
      value: stats.completedBookings,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Spent',
      value: `Rs. ${stats.totalSpent.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {session?.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-5">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Upcoming Bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.nextBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No upcoming bookings</p>
            <Link href="/venues" className="text-primary text-sm font-medium hover:underline mt-1 inline-block">
              Browse venues →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.nextBookings.map((booking: BookingDoc) => {
              const slot = SLOT_CONFIG[booking.bookingType]
              const venue = typeof booking.venue === 'string' ? null : booking.venue
              return (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all"
                >
                  <img
                    src={venue?.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=100'}
                    alt={venue?.name ?? 'Venue image'}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{venue?.name ?? 'Venue'}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" /> {venue?.city ?? 'Unknown city'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(booking.eventDate), 'MMM d, yyyy')} · {slot.label} ({formatTime(slot.start)} – {formatTime(slot.end)})
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold">Rs. {booking.totalAmount.toLocaleString()}</div>
                    <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
                      Confirmed
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-lg">Planning another event?</h3>
          <p className="text-slate-400 text-sm mt-1">Browse our premium venue collection</p>
        </div>
        <Link
          href="/venues"
          className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm whitespace-nowrap"
        >
          Browse Venues →
        </Link>
      </div>
    </div>
  )
}
