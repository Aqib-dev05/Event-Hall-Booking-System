import { getAdminStats } from '@/actions/booking.actions'
import AdminRevenueChart from '@/components/admin/AdminRevenueChart'
import { Building2, Calendar, DollarSign, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export const metadata = { title: 'Admin Dashboard' }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
}

export default async function AdminDashboardPage() {
  const result = await getAdminStats()
  if (!result.success || !result.data) {
    return <div className="text-muted-foreground">Failed to load stats</div>
  }
  const stats = result.data

  const STAT_CARDS = [
    { label: 'Total Venues', value: stats.totalVenues, icon: <Building2 className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600', href: '/admin/venues' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: <Calendar className="w-5 h-5" />, color: 'bg-green-50 text-green-600', href: '/admin/bookings' },
    { label: 'Revenue This Month', value: `Rs. ${stats.monthlyRevenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600', href: '/admin/bookings' },
    { label: 'Pending Bookings', value: stats.pendingBookings, icon: <Clock className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600', href: '/admin/bookings?status=pending' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and stats</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-2xl border border-border p-5 hover:border-primary/30 transition-colors">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4">Revenue (Last 6 Months)</h2>
          <AdminRevenueChart data={stats.revenueByMonth} />
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/admin/venues/new', label: 'Add New Venue', emoji: '🏛️' },
              { href: '/admin/bookings', label: 'View All Bookings', emoji: '📅' },
              { href: '/admin/users', label: 'View All Users', emoji: '👥' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-sm font-medium">{action.emoji} {action.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Customer', 'Venue', 'Date', 'Slot', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentBookings.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-secondary/20">
                  <td className="px-5 py-4 text-sm font-medium">{booking.user?.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{booking.venue?.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-sm">{format(new Date(booking.eventDate), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-4 text-sm capitalize">{booking.bookingType}</td>
                  <td className="px-5 py-4 text-sm font-semibold">Rs. {booking.totalAmount?.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
