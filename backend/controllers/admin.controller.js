const prisma = require('../config/db')
const { ApiError, asyncHandler, ok } = require('../utils/response')
const { USER_PUBLIC, USER_BRIEF } = require('../utils/selects')

const contains = (value) => ({ contains: value, mode: 'insensitive' })
const bookingInclude = {
  user: { select: USER_BRIEF },
  venue: { select: { id: true, name: true, city: true } },
}

// GET /api/admin/bookings?search=
const listBookings = asyncHandler(async (req, res) => {
  const { search } = req.query
  const where = search
    ? {
        OR: [
          { user: { name: contains(search) } },
          { user: { email: contains(search) } },
          { venue: { name: contains(search) } },
        ],
      }
    : {}

  const bookings = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  })
  return ok(res, bookings)
})

// PATCH /api/admin/bookings/:id/status   { status }
const updateBookingStatus = asyncHandler(async (req, res) => {
  await prisma.booking.update({ where: { id: req.params.id }, data: { status: req.body.status } })
  return ok(res, undefined, 'Status updated')
})

// GET /api/admin/users   (customers + their booking count)
const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'customer' },
    select: { ...USER_PUBLIC, _count: { select: { bookings: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return ok(
    res,
    users.map(({ _count, ...u }) => ({ ...u, totalBookings: _count.bookings }))
  )
})

// GET /api/admin/stats
const stats = asyncHandler(async (req, res) => {
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))

  const [totalVenues, totalBookings, pendingBookings, monthly, paidRecent, recentBookings] = await Promise.all([
    prisma.venue.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'pending' } }),
    prisma.booking.aggregate({
      where: { paymentStatus: 'paid', createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      where: { paymentStatus: 'paid', createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.booking.findMany({
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  // Revenue per calendar month for the last 6 months (months without paid bookings are omitted)
  const buckets = new Map()
  for (const b of paidRecent) {
    const key = b.createdAt.getUTCFullYear() * 100 + (b.createdAt.getUTCMonth() + 1)
    const cur = buckets.get(key) || { year: b.createdAt.getUTCFullYear(), month: b.createdAt.getUTCMonth(), revenue: 0, count: 0 }
    cur.revenue += b.totalAmount
    cur.count += 1
    buckets.set(key, cur)
  }
  const revenueByMonth = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({
      month: new Date(Date.UTC(v.year, v.month, 1)).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      revenue: v.revenue,
      count: v.count,
    }))

  return ok(res, {
    totalVenues,
    totalBookings,
    pendingBookings,
    monthlyRevenue: monthly._sum.totalAmount || 0,
    revenueByMonth,
    recentBookings,
  })
})

module.exports = { listBookings, updateBookingStatus, listUsers, stats }
