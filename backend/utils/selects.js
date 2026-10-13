// Reusable Prisma `select` shapes — never expose the password hash.
const USER_PUBLIC = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
}

const USER_BRIEF = { id: true, name: true, email: true }
const VENUE_BRIEF = { id: true, name: true, images: true, city: true }

module.exports = { USER_PUBLIC, USER_BRIEF, VENUE_BRIEF }
