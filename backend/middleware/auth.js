const jwt = require('jsonwebtoken')
const prisma = require('../config/db')
const env = require('../config/env')
const { ApiError, asyncHandler } = require('../utils/response')

/** Reads "Authorization: Bearer <jwt>", loads the user and sets req.user. */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Unauthorized')

  let payload
  try {
    payload = jwt.verify(token, env.JWT_SECRET)
  } catch {
    throw new ApiError(401, 'Session expired. Please login again')
  }

  const user = await prisma.user.findUnique({
    where: { id: String(payload.sub) },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!user) throw new ApiError(401, 'Unauthorized')

  req.user = user
  next()
})

/** Use after requireAuth. */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return next(new ApiError(403, 'Unauthorized'))
  next()
}

function signToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

module.exports = { requireAuth, requireAdmin, signToken }
