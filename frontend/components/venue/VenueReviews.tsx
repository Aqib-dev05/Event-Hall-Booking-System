import { Star } from 'lucide-react'
import { getVenueReviews } from '@/actions/venue.actions'
import { format } from 'date-fns'

interface Props { venueId: string }

export default async function VenueReviews({ venueId }: Props) {
  const result = await getVenueReviews(venueId)
  const reviews = result.success ? result.data ?? [] : []

  if (reviews.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Reviews</h2>
        <div className="text-center py-8 bg-secondary/30 rounded-2xl">
          <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
        </div>
      </div>
    )
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Reviews</h2>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-primary text-primary" />
          <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
          <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {review.user?.name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-semibold text-sm">{review.user?.name || 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), 'MMM yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-primary text-primary' : 'text-border'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
