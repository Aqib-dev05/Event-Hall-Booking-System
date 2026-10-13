'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Check, Loader2, ChevronRight } from 'lucide-react'
import { checkSlotAvailability } from '@/actions/venue.actions'
import { createBooking, createPaymentIntent } from '@/actions/booking.actions'
import { SLOT_CONFIG, calculateTotal, formatTime } from '@/lib/slots'
import { VenueDoc, BookingType } from '@/types'
import { format } from 'date-fns'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const SLOTS: BookingType[] = ['morning', 'afternoon', 'evening', 'fullday']
const EVENT_TYPES = ['Party', 'Wedding', 'Corporate Event', 'Birthday', 'Concert', 'Conference', 'Other']

const step1Schema = z.object({
  eventType: z.string().min(1, 'Please select event type'),
  eventDate: z.string().min(1, 'Please select a date'),
  bookingType: z.enum(['morning', 'afternoon', 'evening', 'fullday'] as const),
  guestCount: z.number().min(1, 'At least 1 guest required'),
  specialRequests: z.string().optional(),
})
type Step1Data = z.infer<typeof step1Schema>

interface Props {
  venue: VenueDoc
  initialSlot?: string
  initialDate?: string
  userId: string
}

const STEPS = ['Event Details', 'Review & Confirm', 'Payment']

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        {STEPS.map((label, i) => {
          const num = i + 1
          const done = num < step
          const active = num === step
          return (
            <div key={i} className="flex flex-col items-center gap-2 z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done ? 'bg-primary text-primary-foreground' :
                  active ? 'bg-primary text-primary-foreground ring-4 ring-primary/30' :
                  'bg-white border-2 border-border text-muted-foreground'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaymentForm({
  totalAmount,
  venueId,
  bookingType,
  eventDate,
  onSuccess,
  onError,
}: {
  totalAmount: number
  venueId: string
  bookingType: BookingType
  eventDate: string
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  async function handlePay() {
    if (!stripe || !elements) return
    setPaying(true)

    try {
      // The server works out the price itself from the venue and slot
      const intent = await createPaymentIntent({ venueId, bookingType, eventDate })

      if (!intent.success || !intent.data?.clientSecret) {
        onError(intent.success ? 'Payment initialization failed' : intent.error)
        setPaying(false)
        return
      }

      const result = await stripe.confirmCardPayment(intent.data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      })

      if (result.error) {
        onError(result.error.message || 'Payment failed')
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id)
      }
    } catch (e) {
      onError('Payment processing error')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="border border-input rounded-xl p-4 focus-within:ring-2 focus-within:ring-ring">
          <CardElement
            options={{
              style: {
                base: { fontSize: '16px', color: '#111827', '::placeholder': { color: '#9ca3af' } },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-blue-50 text-blue-700 rounded-xl p-3 text-xs">
        🔒 Test mode: use card <strong>4242 4242 4242 4242</strong>, any future date, any CVC.
      </div>

      <button
        onClick={handlePay}
        disabled={paying || !stripe}
        className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {paying && <Loader2 className="w-4 h-4 animate-spin" />}
        {paying ? 'Processing payment...' : `Pay Rs. ${totalAmount.toLocaleString()}`}
      </button>
    </div>
  )
}

export default function BookingWizard({ venue, initialSlot, initialDate, userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Step1Data | null>(null)
  const [slotAvailability, setSlotAvailability] = useState<Record<string, boolean>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [savingBooking, setSavingBooking] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      eventDate: initialDate || '',
      bookingType: (initialSlot as BookingType) || undefined,
      guestCount: 1,
    },
  })

  const watchedDate = watch('eventDate')
  const watchedSlot = watch('bookingType')

  async function handleDateChange(date: string) {
    setValue('eventDate', date)
    setValue('bookingType', undefined as any)
    if (!date) return
    setLoadingSlots(true)
    const res = await checkSlotAvailability(venue.id, date)
    setLoadingSlots(false)
    if (res.success && res.data) {
      setSlotAvailability({
        morning: res.data.morning.available,
        afternoon: res.data.afternoon.available,
        evening: res.data.evening.available,
        fullday: res.data.fullday.available,
      })
    }
  }

  function onStep1Submit(data: Step1Data) {
    if (data.guestCount > venue.capacity) {
      toast.error(`Max capacity is ${venue.capacity} guests`)
      return
    }
    setFormData(data)
    setStep(2)
  }

  async function handlePaymentSuccess(paymentIntentId: string) {
    if (!formData) return
    setSavingBooking(true)
    const result = await createBooking({
      venueId: venue.id,
      eventType: formData.eventType,
      eventDate: formData.eventDate,
      bookingType: formData.bookingType,
      guestCount: formData.guestCount,
      specialRequests: formData.specialRequests,
      paymentIntentId,
    })
    setSavingBooking(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Booking confirmed! 🎉')
    router.push(`/booking/confirmation/${result.data!.id}`)
  }

  const priceBreakdown = watchedSlot ? calculateTotal(venue.pricePerHour, watchedSlot) : null

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Book {venue.name}</h1>
      <p className="text-muted-foreground mb-8">{venue.city}</p>

      <ProgressBar step={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* ── Step 1: Event Details ── */}
          {step === 1 && (
            <div className="step-enter bg-white rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold mb-5">Event Details</h2>
              <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Event Type</label>
                  <select
                    {...register('eventType')}
                    className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  >
                    <option value="">Select event type...</option>
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.eventType && <p className="text-destructive text-xs mt-1">{errors.eventType.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Event Date</label>
                  <input
                    type="date"
                    value={watchedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.eventDate && <p className="text-destructive text-xs mt-1">{errors.eventDate.message}</p>}
                </div>

                {watchedDate && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Time Slot</label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-4">
                        <Loader2 className="w-4 h-4 animate-spin" /> Checking availability...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {SLOTS.map((slotType) => {
                          const slot = SLOT_CONFIG[slotType]
                          const avail = slotAvailability[slotType] ?? true
                          const selected = watchedSlot === slotType
                          const { total } = calculateTotal(venue.pricePerHour, slotType)
                          return (
                            <button
                              key={slotType}
                              type="button"
                              disabled={!avail}
                              onClick={() => setValue('bookingType', slotType)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                selected ? 'border-primary bg-primary/5' :
                                avail ? 'border-green-300 bg-green-50/50 hover:border-green-400' :
                                'border-border bg-secondary/50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="font-semibold text-sm">{slot.emoji} {slot.label}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatTime(slot.start)} – {formatTime(slot.end)}
                              </div>
                              <div className="text-xs font-semibold text-primary mt-1.5">
                                {avail ? `Rs. ${total.toLocaleString()}` : 'Booked'}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {errors.bookingType && <p className="text-destructive text-xs mt-1">Please select a time slot</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Guest Count <span className="text-muted-foreground">(max {venue.capacity})</span>
                  </label>
                  <input
                    {...register('guestCount', { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={venue.capacity}
                    className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.guestCount && <p className="text-destructive text-xs mt-1">{errors.guestCount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Special Requests <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    {...register('specialRequests')}
                    rows={3}
                    placeholder="Any special requirements, setup preferences, etc."
                    className="w-full px-4 py-3 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Review <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === 2 && formData && priceBreakdown && (
            <div className="step-enter bg-white rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold mb-5">Review Your Booking</h2>
              <div className="space-y-3 mb-6">
                {[
                  ['Venue', venue.name],
                  ['Location', venue.city],
                  ['Date', format(new Date(formData.eventDate), 'EEEE, MMMM d, yyyy')],
                  ['Time Slot', `${SLOT_CONFIG[formData.bookingType].label}: ${formatTime(SLOT_CONFIG[formData.bookingType].start)} – ${formatTime(SLOT_CONFIG[formData.bookingType].end)}`],
                  ['Event Type', formData.eventType],
                  ['Guests', formData.guestCount.toString()],
                  ...(formData.specialRequests ? [['Special Requests', formData.specialRequests]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-border text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Slot duration</span><span>{SLOT_CONFIG[formData.bookingType].hours} hrs</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Price/hour</span><span>Rs. {venue.pricePerHour.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>Rs. {priceBreakdown.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service fee (10%)</span><span>Rs. {priceBreakdown.serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>Total</span><span>Rs. {priceBreakdown.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 border border-border rounded-xl font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  Confirm & Pay <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment ── */}
          {step === 3 && formData && priceBreakdown && (
            <div className="step-enter bg-white rounded-2xl border border-border p-6">
              <h2 className="text-xl font-bold mb-2">Secure Payment</h2>
              <p className="text-muted-foreground text-sm mb-6">
                You will be charged Rs. {priceBreakdown.total.toLocaleString()} for {SLOT_CONFIG[formData.bookingType].label} slot on{' '}
                {format(new Date(formData.eventDate), 'MMM d, yyyy')}
              </p>
              <Elements stripe={stripePromise}>
                <PaymentForm
                  totalAmount={priceBreakdown.total}
                  venueId={venue.id}
                  bookingType={formData.bookingType}
                  eventDate={formData.eventDate}
                  onSuccess={handlePaymentSuccess}
                  onError={(msg) => toast.error(msg)}
                />
              </Elements>
              <button
                onClick={() => setStep(2)}
                className="w-full h-10 border border-border rounded-xl font-semibold text-sm hover:bg-secondary transition-colors mt-3"
              >
                ← Back to Review
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Venue summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-border p-5 sticky top-20">
            <img
              src={venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'}
              alt={venue.name}
              className="w-full h-36 object-cover rounded-xl mb-4"
            />
            <h3 className="font-bold">{venue.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">{venue.city}</p>
            <div className="mt-3 pt-3 border-t border-border text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Capacity</span><span>Up to {venue.capacity} guests</span>
              </div>
              <div className="flex justify-between text-muted-foreground mt-1">
                <span>Rate</span><span>Rs. {venue.pricePerHour.toLocaleString()}/hr</span>
              </div>
              {watchedSlot && priceBreakdown && (
                <div className="flex justify-between font-bold mt-3 pt-3 border-t border-border">
                  <span>Total</span><span>Rs. {priceBreakdown.total.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
