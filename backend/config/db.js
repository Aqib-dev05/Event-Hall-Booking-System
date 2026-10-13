const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const env = require('./env')

// Prisma 6 "client" engine: queries run through the node-postgres driver adapter.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

module.exports = prisma
