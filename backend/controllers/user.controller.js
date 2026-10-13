const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const env = require('../config/env')
const { ApiError, asyncHandler, ok } = require('../utils/response')
const { todayInTimezone } = require('../utils/dates')
const { USER_PUBLIC, VENUE_BRIEF } = require('../utils/selects')

// GET /api/users/me
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: USER_PUBLIC })
  if (!user) throw new ApiError(404, 'User not found')
  return ok(res, user)
})

// PATCH /api/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, phone: phone || null },
    select: USER_PUBLIC,
  })
  return ok(res, user)
})

// PUT /api/users/me/password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) throw new ApiError(404, 'User not found')

  const valid = await bcrypt.compare(oldPassword, user.password)
  if (!valid) throw new ApiError(400, 'Current password is incorrect')

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 12) },
  })
  return ok(res, undefined, 'Password changed successfully')
})

// GET /api/users/me/stats
const dashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const today = todayInTimezone(env.TIMEZONE)
  const upcomingWhere = { userId, status: 'confirmed', eventDate: { gte: today } }

  const [totalBookings, upcomingBookings, completedBookings, cancelledBookings, spent, nextBookings] =
    await Promise.all([
      prisma.booking.count({ where: { userId } }),
      prisma.booking.count({ where: upcomingWhere }),
      prisma.booking.count({ where: { userId, status: 'completed' } }),
      prisma.booking.count({ where: { userId, status: 'cancelled' } }),
      prisma.booking.aggregate({ where: { userId, paymentStatus: 'paid' }, _sum: { totalAmount: true } }),
      prisma.booking.findMany({
        where: upcomingWhere,
        include: { venue: { select: VENUE_BRIEF } },
        orderBy: { eventDate: 'asc' },
        take: 3,
      }),
    ])

  return ok(res, {
    totalBookings,
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    totalSpent: spent._sum.totalAmount || 0,
    nextBookings,
  })
})

module.exports = { getProfile, updateProfile, changePassword, dashboardStats }
