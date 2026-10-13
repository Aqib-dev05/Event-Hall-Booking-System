import { getAllBookings } from '@/actions/booking.actions'
import { format } from 'date-fns'
import { SLOT_CONFIG } from '@/lib/slots'
import AdminBookingStatusUpdate from '@/components/admin/AdminBookingStatusUpdate'

export const metadata = { title: 'Manage Bookings' }

interface Props { searchParams: { search?: string } }

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
}

const PAYMENT_STYLES: Record<string, string> = {
  unpaid: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-blue-100 text-blue-700',
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const result = await getAllBookings(searchParams.search)
  const bookings = result.success ? result.data ?? [] : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">All Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">{bookings.length} total bookings</p>
        </div>
      </div>

      {/* Search */}
      <form className="mb-5" method="GET">
        <input
          name="search"
          defaultValue={searchParams.search}
          placeholder="Search by customer name, email, or venue..."
          className="w-full max-w-md h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Customer', 'Venue', 'Date', 'Slot', 'Status', 'Payment', 'Amount', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => {
                const user = booking.user as any
                const venue = booking.venue as any
                const slot = SLOT_CONFIG[booking.bookingType]
                return (
                  <tr key={booking.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{user?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{venue?.name || 'N/A'}<div className="text-xs text-muted-foreground">{venue?.city}</div></td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{format(new Date(booking.eventDate), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-sm capitalize">{slot.label}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[booking.status]}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${PAYMENT_STYLES[booking.paymentStatus]}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">Rs. {booking.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <AdminBookingStatusUpdate bookingId={booking.id} currentStatus={booking.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {bookings.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No bookings found</div>
        )}
      </div>
    </div>
  )
}
