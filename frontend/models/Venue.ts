import { Schema, model, models } from 'mongoose'
import { IVenue } from '@/types'

const VenueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    pricePerHour: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['party', 'wedding', 'corporate', 'birthday', 'concert', 'other'],
      required: true,
      index: true,
    },
    images: [{ type: String }],
    amenities: [{ type: String }],
    isAvailable: { type: Boolean, default: true, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
)

VenueSchema.index({ city: 1, category: 1 })
VenueSchema.index({ pricePerHour: 1 })
VenueSchema.index({ rating: -1 })

const Venue = models?.Venue || model<IVenue>('Venue', VenueSchema)
export default Venue
