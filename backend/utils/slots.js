// Time-slot business rules (ported 1:1 from the original frontend lib/slots.ts)
//
//   Morning   08:00 – 12:00  (4 hrs)
//   Afternoon 13:00 – 17:00  (4 hrs)
//   Evening   17:00 – 22:00  (5 hrs)
//   Full Day  08:00 – 22:00  (14 hrs)

const SLOT_TYPES = ['morning', 'afternoon', 'evening', 'fullday']

const SLOT_CONFIG = {
  morning: { label: 'Morning', start: '08:00', end: '12:00', hours: 4 },
  afternoon: { label: 'Afternoon', start: '13:00', end: '17:00', hours: 4 },
  evening: { label: 'Evening', start: '17:00', end: '22:00', hours: 5 },
  fullday: { label: 'Full Day', start: '08:00', end: '22:00', hours: 14 },
}

const SERVICE_FEE_RATE = 0.1

function formatTime(time24) {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function getSlotLabel(type) {
  const s = SLOT_CONFIG[type]
  return `${formatTime(s.start)} – ${formatTime(s.end)}`
}

function calculateTotal(pricePerHour, bookingType) {
  const durationHrs = SLOT_CONFIG[bookingType].hours
  const subtotal = pricePerHour * durationHrs
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE)
  return { durationHrs, subtotal, serviceFee, total: subtotal + serviceFee }
}

/**
 * Availability from the booking types that are already taken on a date
 * (callers pass only pending + confirmed bookings; cancelled ones are ignored).
 *  - fullday taken            -> every slot blocked
 *  - any single slot taken    -> that slot + fullday blocked
 */
function computeAvailability(takenTypes) {
  const hasFullDay = takenTypes.includes('fullday')
  const hasMorning = takenTypes.includes('morning')
  const hasAfternoon = takenTypes.includes('afternoon')
  const hasEvening = takenTypes.includes('evening')
  const anyIndividual = hasMorning || hasAfternoon || hasEvening

  return {
    morning: { available: !hasFullDay && !hasMorning },
    afternoon: { available: !hasFullDay && !hasAfternoon },
    evening: { available: !hasFullDay && !hasEvening },
    fullday: { available: !hasFullDay && !anyIndividual },
  }
}

/** Can `wanted` be booked when `takenTypes` already exist for that day? */
function isSlotFree(takenTypes, wanted) {
  return computeAvailability(takenTypes)[wanted].available
}

/** A venue still has at least one bookable slot on a day. */
function hasAnyFreeSlot(takenTypes) {
  const a = computeAvailability(takenTypes)
  return SLOT_TYPES.some((t) => a[t].available)
}

module.exports = {
  SLOT_TYPES,
  SLOT_CONFIG,
  formatTime,
  getSlotLabel,
  calculateTotal,
  computeAvailability,
  isSlotFree,
  hasAnyFreeSlot,
}
