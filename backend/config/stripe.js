const Stripe = require('stripe')
const env = require('./env')

// Same API version the original Next.js project used.
const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null

module.exports = { stripe }
