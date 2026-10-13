'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { changePassword } from '@/actions/user.actions'

const schema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function ChangePasswordForm() {
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const result = await changePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword })
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Password changed successfully ✅')
      reset()
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-bold text-lg mb-5">Change Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Current Password</label>
          <div className="relative">
            <input
              {...register('oldPassword')}
              type={showOld ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full h-11 px-4 pr-12 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.oldPassword && <p className="text-destructive text-xs mt-1">{errors.oldPassword.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">New Password</label>
          <div className="relative">
            <input
              {...register('newPassword')}
              type={showNew ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              className="w-full h-11 px-4 pr-12 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-destructive text-xs mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="Re-enter new password"
            className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-6 bg-foreground text-background font-semibold rounded-xl hover:bg-foreground/90 transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
