const { z } = require('zod')

const email = z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Please enter a valid email')

const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  email,
  password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters').max(72, 'Password is too long'),
  phone: z.string().trim().optional(),
})

const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
})

/** @typedef {z.infer<typeof registerSchema>} RegisterInput */
/** @typedef {z.infer<typeof loginSchema>} LoginInput */

module.exports = { registerSchema, loginSchema }
