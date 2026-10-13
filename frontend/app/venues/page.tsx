import { Suspense } from 'react'
import { getVenues } from '@/actions/venue.actions'
import VenueCard from '@/components/venue/VenueCard'
import VenueFilters from '@/components/venue/VenueFilters'
import { Building2, SlidersHorizontal } from 'lucide-react'

interface Props {
  searchParams: {
    search?: string
    category?: string
    city?: string
    capacity?: string
    minPrice?: string
    maxPrice?: string
    date?: string
  }
}

export const metadata = { title: 'Browse Venues' }

export default async function VenuesPage({ searchParams }: Props) {
  let minCapacity: number | undefined
  let maxCapacity: number | undefined

  if (searchParams.capacity) {
    if (searchParams.capacity === '<50') { maxCapacity = 50 }
    else if (searchParams.capacity === '50-100') { minCapacity = 50; maxCapacity = 100 }
    else if (searchParams.capacity === '100-200') { minCapacity = 100; maxCapacity = 200 }
    else if (searchParams.capacity === '200+') { minCapacity = 200 }
  }

  const result = await getVenues({
    search: searchParams.search,
    category: searchParams.category,
    city: searchParams.city,
    minCapacity,
    maxCapacity,
    minPrice: searchParams.minPrice && Number.isFinite(Number(searchParams.minPrice)) ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice && Number.isFinite(Number(searchParams.maxPrice)) ? Number(searchParams.maxPrice) : undefined,
    date: searchParams.date,
  })

  const venues = result.success ? result.data ?? [] : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Event Halls</h1>
        <p className="text-muted-foreground mt-1">
          {venues.length} venue{venues.length !== 1 ? 's' : ''} available
          {searchParams.city && ` in ${searchParams.city}`}
          {searchParams.category && ` · ${searchParams.category}`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-72 flex-shrink-0">
          <VenueFilters searchParams={searchParams} />
        </aside>

        {/* Venues grid */}
        <div className="flex-1">
          {venues.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No venues found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
