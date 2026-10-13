require('dotenv').config()
const { z } = require('zod')

// Single place where every environment variable is read and validated.
const optional = z.string().trim().optional().transform((v) => (v ? v : undefined))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Comma separated list of allowed browser origins (CORS)
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,

  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
  // Every image of this project is uploaded under this Cloudinary root folder
  CLOUDINARY_ROOT_FOLDER: z.string().trim().default('event-hall-booking'),

  GMAIL_USER: optional,
  GMAIL_APP_PASSWORD: optional,
  ADMIN_EMAIL: optional,

  CRON_SECRET: optional,
  TIMEZONE: z.string().default('Asia/Karachi'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
  console.error(`\nInvalid environment configuration:\n${lines.join('\n')}\n`)
  console.error('Copy .env.example to .env and fill in the values.')
  process.exit(1)
}

const env = parsed.data

module.exports = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  corsOrigins: env.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  frontendUrl: env.FRONTEND_URL.split(',')[0].trim().replace(/\/$/, ''),
  adminEmail: env.ADMIN_EMAIL || env.GMAIL_USER,
}
