import Link from 'next/link'
import { getAdminVenues, toggleVenueAvailability, deleteVenue } from '@/actions/venue.actions'
import { Plus, MapPin, Users } from 'lucide-react'
import AdminVenueActions from '@/components/admin/AdminVenueActions'

export const metadata = { title: 'Manage Venues' }

export default async function AdminVenuesPage() {
  const result = await getAdminVenues()
  const venues = result.success ? result.data ?? [] : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Venues</h1>
          <p className="text-muted-foreground text-sm mt-1">{venues.length} total venues</p>
        </div>
        <Link
          href="/admin/venues/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Venue
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Venue', 'City', 'Category', 'Capacity', 'Price/hr', 'Rating', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {venues.map((venue) => (
                <tr key={venue.id} className="hover:bg-secondary/20">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=60'}
                        alt={venue.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="font-medium text-sm max-w-[180px] truncate">{venue.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{venue.city}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full capitalize">{venue.category}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{venue.capacity}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium">Rs. {venue.pricePerHour.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm">⭐ {venue.rating.toFixed(1)} ({venue.totalReviews})</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${venue.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {venue.isAvailable ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <AdminVenueActions venueId={venue.id} isAvailable={venue.isAvailable} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {venues.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No venues found. <Link href="/admin/venues/new" className="text-primary hover:underline">Add one</Link>
          </div>
        )}
      </div>
    </div>
  )
}
