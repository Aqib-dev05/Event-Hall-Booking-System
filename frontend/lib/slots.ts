import { BookingType, SlotAvailability } from '@/types'

export const SLOT_CONFIG: Record<
  BookingType,
  { label: string; start: string; end: string; hours: number; emoji: string }
> = {
  morning: {
    label: 'Morning',
    start: '08:00',
    end: '12:00',
    hours: 4,
    emoji: '🌅',
  },
  afternoon: {
    label: 'Afternoon',
    start: '13:00',
    end: '17:00',
    hours: 4,
    emoji: '☀️',
  },
  evening: {
    label: 'Evening',
    start: '17:00',
    end: '22:00',
    hours: 5,
    emoji: '🌆',
  },
  fullday: {
    label: 'Full Day',
    start: '08:00',
    end: '22:00',
    hours: 14,
    emoji: '📅',
  },
}

export function getSlotLabel(type: BookingType): string {
  const s = SLOT_CONFIG[type]
  return `${formatTime(s.start)} – ${formatTime(s.end)}`
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function calculateTotal(
  pricePerHour: number,
  bookingType: BookingType
): {
  durationHrs: number
  subtotal: number
  serviceFee: number
  total: number
} {
  const durationHrs = SLOT_CONFIG[bookingType].hours
  const subtotal = pricePerHour * durationHrs
  const serviceFee = Math.round(subtotal * 0.1)
  const total = subtotal + serviceFee
  return { durationHrs, subtotal, serviceFee, total }
}

/**
 * Determines slot availability from a list of active booking types.
 * Rules:
 * - fullday booked → all slots unavailable
 * - any individual slot booked → that slot + fullday unavailable
 * - cancelled bookings are ignored (caller filters those out)
 */
export function computeAvailability(
  activeBookingTypes: BookingType[]
): SlotAvailability {
  const hasFullDay = activeBookingTypes.includes('fullday')
  const hasMorning = activeBookingTypes.includes('morning')
  const hasAfternoon = activeBookingTypes.includes('afternoon')
  const hasEvening = activeBookingTypes.includes('evening')

  const anyIndividual = hasMorning || hasAfternoon || hasEvening

  return {
    morning: { available: !hasFullDay && !hasMorning },
    afternoon: { available: !hasFullDay && !hasAfternoon },
    evening: { available: !hasFullDay && !hasEvening },
    fullday: { available: !hasFullDay && !anyIndividual },
  }
}
