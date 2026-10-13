'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'
import { submitReview } from '@/actions/booking.actions'

const schema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
})
type FormData = z.infer<typeof schema>

interface Props { bookingId: string; venueId: string }

export default function ReviewForm({ bookingId, venueId }: Props) {
  const router = useRouter()
  const [hovered, setHovered] = useState(0)
  const [rating, setRating] = useState(0)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0 },
  })

  async function onSubmit(data: FormData) {
    const result = await submitReview({ bookingId, venueId, rating: data.rating, comment: data.comment })
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Review submitted! Thank you 🙏')
      router.refresh()
    }
  }

  function handleStarClick(val: number) {
    setRating(val)
    setValue('rating', val)
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-bold text-lg mb-4">Leave a Review</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Stars */}
        <div>
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => handleStarClick(star)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hovered || rating) ? 'fill-primary text-primary' : 'text-border'
                  }`}
                />
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-destructive text-xs mt-1">Please select a rating</p>}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Your Review</label>
          <textarea
            {...register('comment')}
            rows={4}
            placeholder="Share your experience with this venue..."
            className="w-full px-4 py-3 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {errors.comment && <p className="text-destructive text-xs mt-1">{errors.comment.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
