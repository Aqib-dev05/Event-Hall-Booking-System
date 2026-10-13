const prisma = require('../config/db')

// Only pending + confirmed bookings occupy a slot. Cancelled / completed are ignored.
const ACTIVE_STATUSES = ['pending', 'confirmed']

/** Booking types already taken for a venue on a day. `client` can be prisma or a transaction client. */
async function getTakenTypes(client, venueId, eventDate) {
  const rows = await client.booking.findMany({
    where: { venueId, eventDate, status: { in: ACTIVE_STATUSES } },
    select: { bookingType: true },
  })
  return rows.map((r) => r.bookingType)
}

/** For many venues at once: Map<venueId, bookingType[]> */
async function getTakenTypesForVenues(venueIds, eventDate) {
  const map = new Map(venueIds.map((id) => [id, []]))
  if (venueIds.length === 0) return map
  const rows = await prisma.booking.findMany({
    where: { venueId: { in: venueIds }, eventDate, status: { in: ACTIVE_STATUSES } },
    select: { venueId: true, bookingType: true },
  })
  for (const r of rows) map.get(r.venueId).push(r.bookingType)
  return map
}

module.exports = { ACTIVE_STATUSES, getTakenTypes, getTakenTypesForVenues }
