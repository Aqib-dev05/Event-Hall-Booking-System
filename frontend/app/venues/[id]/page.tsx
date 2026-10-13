import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getVenueById } from '@/actions/venue.actions'
import VenueGallery from '@/components/venue/VenueGallery'
import VenueBookingWidget from '@/components/venue/VenueBookingWidget'
import VenueReviews from '@/components/venue/VenueReviews'
import { MapPin, Users, Star, Wifi, Car, Utensils, Music, Wind, Projector, CheckCircle } from 'lucide-react'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getVenueById(params.id)
  if (!result.success) return { title: 'Venue Not Found' }
  return {
    title: result.data!.name,
    description: result.data!.description.slice(0, 160),
    openGraph: { title: result.data!.name, images: result.data!.images.slice(0, 1) },
  }
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi className="w-4 h-4" />,
  'Parking': <Car className="w-4 h-4" />,
  'Catering': <Utensils className="w-4 h-4" />,
  'Sound System': <Music className="w-4 h-4" />,
  'AC': <Wind className="w-4 h-4" />,
  'Projector': <Projector className="w-4 h-4" />,
}

export default async function VenueDetailPage({ params }: Props) {
  const result = await getVenueById(params.id)
  if (!result.success || !result.data) return notFound()

  const venue = result.data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title row */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary capitalize">
            {venue.category}
          </span>
          {venue.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-semibold">{venue.rating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">({venue.totalReviews} reviews)</span>
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-2">{venue.name}</h1>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{venue.location}, {venue.city}</span>
        </div>
      </div>

      {/* Gallery */}
      <VenueGallery images={venue.images} name={venue.name} />

      {/* Main content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-secondary/50 rounded-2xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <div className="font-bold text-xl">{venue.capacity}</div>
              <div className="text-xs text-muted-foreground">Max Guests</div>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">Rs. {venue.pricePerHour.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Per Hour</div>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
              <div className={`text-lg font-bold ${venue.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                {venue.isAvailable ? '✅ Available' : '❌ Unavailable'}
              </div>
              <div className="text-xs text-muted-foreground">Current Status</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold mb-3">About This Venue</h2>
            <p className="text-muted-foreground leading-relaxed">{venue.description || 'This venue does not have a description yet. Please contact support for more details.'}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-secondary/50 rounded-2xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Venue Highlights</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Capacity up to {venue.capacity} guests</li>
                <li>Price: Rs. {venue.pricePerHour.toLocaleString()} / hour</li>
                <li>Category: {venue.category}</li>
                <li>{venue.isAvailable ? 'Available for booking now' : 'Currently unavailable'}</li>
              </ul>
            </div>
            <div className="bg-secondary/50 rounded-2xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Perfect For</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {venue.category === 'wedding' && 'Weddings, receptions, and large family celebrations.'}
                {venue.category === 'corporate' && 'Corporate events, conferences, product launches, and meetings.'}
                {venue.category === 'party' && 'Birthday parties, anniversaries, and private celebrations.'}
                {venue.category === 'concert' && 'Concerts, live performances, and cultural shows.'}
                {venue.category === 'birthday' && 'Birthday parties, cake ceremonies, and intimate gatherings.'}
                {venue.category === 'other' && 'Special occasions, private events, and custom gatherings.'}
              </p>
            </div>
          </div>

          {/* Amenities */}
          {venue.amenities?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {venue.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background"
                  >
                    <div className="text-primary">
                      {AMENITY_ICONS[amenity] || <CheckCircle className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div>
            <h2 className="text-xl font-bold mb-3">Location</h2>
            <div className="rounded-2xl overflow-hidden border border-border h-64 bg-secondary">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.location + ', ' + venue.city + ', Pakistan')}&output=embed&z=15`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Reviews */}
          <VenueReviews venueId={venue.id} />
        </div>

        {/* Right: Booking widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <VenueBookingWidget venue={venue} />
          </div>
        </div>
      </div>
    </div>
  )
}
