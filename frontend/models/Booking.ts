import { Schema, model, models } from 'mongoose'
import { IBooking } from '@/types'

const BookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    eventType: { type: String, required: true },
    eventDate: { type: Date, required: true, index: true },
    bookingType: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'fullday'],
      required: true,
    },
    slotLabel: { type: String, required: true },
    slotStart: { type: String, required: true },
    slotEnd: { type: String, required: true },
    durationHrs: { type: Number, required: true },
    guestCount: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentIntentId: { type: String },
    specialRequests: { type: String },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
)

BookingSchema.index({ venue: 1, eventDate: 1 })
BookingSchema.index({ user: 1, status: 1 })
BookingSchema.index({ eventDate: 1, status: 1, reminderSent: 1 })

const Booking = models?.Booking || model<IBooking>('Booking', BookingSchema)
export default Booking
