'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { CalendarDays, Loader2 } from 'lucide-react'
import { checkSlotAvailability } from '@/actions/venue.actions'
import { SLOT_CONFIG, calculateTotal, formatTime } from '@/lib/slots'
import { VenueDoc, BookingType, SlotAvailability } from '@/types'
import { format } from 'date-fns'

interface Props { venue: VenueDoc }

const SLOTS: BookingType[] = ['morning', 'afternoon', 'evening', 'fullday']

export default function VenueBookingWidget({ venue }: Props) {
  const router = useRouter()
  const { data: session } = useSession()

  const [date, setDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<BookingType | null>(null)
  const [availability, setAvailability] = useState<SlotAvailability | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  async function handleDateChange(value: string) {
    setDate(value)
    setSelectedSlot(null)
    setAvailability(null)
    if (!value) return
    setLoadingSlots(true)
    const result = await checkSlotAvailability(venue.id, value)
    setLoadingSlots(false)
    if (result.success && result.data) {
      setAvailability(result.data)
    } else {
      toast.error('Failed to check availability')
    }
  }

  function handleSlotClick(slotType: BookingType) {
    if (!availability?.[slotType].available) return
    setSelectedSlot(selectedSlot === slotType ? null : slotType)
  }

  function handleProceed() {
    if (!selectedSlot || !date) return
    if (!session?.user) {
      router.push(`/login?callbackUrl=/booking/${venue.id}?slot=${selectedSlot}&date=${date}`)
      return
    }
    router.push(`/booking/${venue.id}?slot=${selectedSlot}&date=${date}`)
  }

  const priceBreakdown = selectedSlot ? calculateTotal(venue.pricePerHour, selectedSlot) : null

  return (
    <div className="bg-white rounded-2xl border border-border shadow-lg p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <span className="text-2xl font-bold">Rs. {venue.pricePerHour.toLocaleString()}</span>
          <span className="text-muted-foreground text-sm"> /hour</span>
        </div>
        {venue.rating > 0 && (
          <span className="text-sm text-muted-foreground">⭐ {venue.rating.toFixed(1)}</span>
        )}
      </div>

      {/* Date picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">Select Date</label>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Slot cards */}
      {date && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Time Slot</label>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {SLOTS.map((slotType) => {
                const slot = SLOT_CONFIG[slotType]
                const isAvailable = availability?.[slotType].available ?? true
                const isSelected = selectedSlot === slotType
                const { total } = calculateTotal(venue.pricePerHour, slotType)

                return (
                  <button
                    key={slotType}
                    onClick={() => handleSlotClick(slotType)}
                    disabled={!isAvailable}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isAvailable
                        ? 'border-green-300 bg-green-50/50 hover:border-green-400'
                        : 'border-border bg-secondary/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{slot.emoji}</span>
                          <span className="font-semibold text-sm">{slot.label}</span>
                          {!isAvailable && (
                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Booked</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(slot.start)} – {formatTime(slot.end)} · {slot.hours} hrs
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">Rs. {total.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">total</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Price breakdown */}
      {priceBreakdown && selectedSlot && (
        <div className="bg-secondary/50 rounded-xl p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between text-muted-foreground">
            <span>{SLOT_CONFIG[selectedSlot].hours} hrs × Rs. {venue.pricePerHour.toLocaleString()}</span>
            <span>Rs. {priceBreakdown.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Service fee (10%)</span>
            <span>Rs. {priceBreakdown.serviceFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
            <span>Total</span>
            <span>Rs. {priceBreakdown.total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleProceed}
        disabled={!selectedSlot || !date}
        className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {!date
          ? 'Select a Date'
          : !selectedSlot
          ? 'Choose a Time Slot'
          : 'Proceed to Book →'}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-3">
        Free cancellation up to 48 hours before the event
      </p>
    </div>
  )
}
