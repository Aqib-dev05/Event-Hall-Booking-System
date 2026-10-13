import mongoose, { Schema, model, models } from 'mongoose'
import { IUser } from '@/types'

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const User = models?.User || model<IUser>('User', UserSchema)
export default User
