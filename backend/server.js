const cron = require('node-cron')
const env = require('./config/env')
const prisma = require('./config/db')
const app = require('./app')
const { runReminders } = require('./controllers/cron.controller')

async function start() {
  try {
    await prisma.$connect()
    // Fail fast with a clear message if migrations have not been applied yet.
    await prisma.user.count()
  } catch (err) {
    console.error('\nCould not use the database. Is DATABASE_URL correct and did you run `npm run db:migrate`?\n')
    console.error(err.message)
    process.exit(1)
  }

  const server = app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}/api  (${env.NODE_ENV})`)
  })

  // Daily event reminders at 09:00 (replaces the old Vercel cron)
  const task = cron.schedule(
    '0 9 * * *',
    () => {
      runReminders()
        .then(({ sent, eligible }) => console.log(`[cron] reminders sent: ${sent}/${eligible}`))
        .catch((e) => console.error('[cron] reminder job failed:', e))
    },
    { timezone: env.TIMEZONE }
  )

  const shutdown = async () => {
    task.stop()
    server.close(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start()
