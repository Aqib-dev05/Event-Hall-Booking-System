const { z } = require('zod')

const updateProfileSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().optional(),
})

const changePasswordSchema = z.object({
  oldPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: z.string({ required_error: 'New password is required' }).min(6, 'New password must be at least 6 characters').max(72, 'Password is too long'),
})

/** @typedef {z.infer<typeof updateProfileSchema>} UpdateProfileInput */
/** @typedef {z.infer<typeof changePasswordSchema>} ChangePasswordInput */

module.exports = { updateProfileSchema, changePasswordSchema }
