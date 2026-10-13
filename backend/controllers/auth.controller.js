const bcrypt = require('bcryptjs')
const prisma = require('../config/db')
const { ApiError, asyncHandler, ok } = require('../utils/response')
const { signToken } = require('../middleware/auth')
const { USER_PUBLIC } = require('../utils/selects')

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ApiError(409, 'An account with this email already exists')

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { name, email, password: hashed, phone: phone || null, role: 'customer' },
  })

  return ok(res, { message: 'Account created successfully' }, undefined, 201)
})

// POST /api/auth/login  ->  { token, user }
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  const valid = user ? await bcrypt.compare(password, user.password) : false
  if (!user || !valid) throw new ApiError(401, 'Invalid email or password')

  return ok(res, {
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
})

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: USER_PUBLIC })
  if (!user) throw new ApiError(404, 'User not found')
  return ok(res, user)
})

module.exports = { register, login, me }
