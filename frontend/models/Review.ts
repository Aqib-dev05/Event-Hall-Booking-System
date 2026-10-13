import { Schema, model, models } from 'mongoose'
import { IReview } from '@/types'

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

ReviewSchema.index({ venue: 1, createdAt: -1 })

const Review = models?.Review || model<IReview>('Review', ReviewSchema)
export default Review
