const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const env = require('./config/env')
const routes = require('./routes')
const { webhook } = require('./controllers/payment.controller')
const { notFound, errorHandler } = require('./middleware/error')

const app = express()

app.set('trust proxy', 1)
// This is a JSON API consumed from another origin (the Next.js app), so allow cross-origin reads.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    // Browsers from FRONTEND_URL only. Requests without an Origin header (server actions, curl, Stripe) pass.
    origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
  })
)

// Stripe needs the untouched raw body to verify the signature -> must come BEFORE express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), webhook)

app.use(express.json({ limit: '1mb' }))

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
