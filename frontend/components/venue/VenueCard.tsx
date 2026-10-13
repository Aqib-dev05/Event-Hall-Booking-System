import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, Star, Clock, ArrowRight } from 'lucide-react'
import { VenueDoc } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  party: 'bg-pink-100 text-pink-700',
  wedding: 'bg-rose-100 text-rose-700',
  corporate: 'bg-blue-100 text-blue-700',
  birthday: 'bg-yellow-100 text-yellow-700',
  concert: 'bg-purple-100 text-purple-700',
  other: 'bg-green-100 text-green-700',
}

interface VenueCardProps {
  venue: VenueDoc
  slotBadge?: string | null  // e.g. "3 slots available" or "Fully Booked"
}

export default function VenueCard({ venue, slotBadge }: VenueCardProps) {
  const mainImage = venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80'
  const isFullyBooked = slotBadge === 'Fully Booked'

  return (
    <Link
      href={`/venues/${venue.id}`}
      className={`group block bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
        isFullyBooked ? 'opacity-70 pointer-events-none' : 'hover:-translate-y-1'
      }`}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-secondary">
        <img
          src={mainImage}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
              CATEGORY_COLORS[venue.category] || 'bg-secondary text-secondary-foreground'
            }`}
          >
            {venue.category}
          </span>
        </div>
        {/* Slot badge */}
        {slotBadge && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isFullyBooked
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {slotBadge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {venue.name}
          </h3>
          {venue.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="text-sm font-semibold">{venue.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({venue.totalReviews})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-sm">{venue.city}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Up to {venue.capacity}
            </span>
          </div>
          <div className="text-right">
            <div className="text-base font-bold">
              Rs. {venue.pricePerHour.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">/hour</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {venue.amenities?.slice(0, 2).join(' · ')}
            {venue.amenities?.length > 2 && ` +${venue.amenities.length - 2} more`}
          </span>
          <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
            Book Now <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
