'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateProfile } from '@/actions/user.actions'
import { UserDoc } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ProfileForm({ user }: { user: UserDoc | null | undefined }) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  })

  async function onSubmit(data: FormData) {
    const result = await updateProfile(data)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Profile updated successfully ✅')
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h2 className="font-bold text-lg mb-5">Personal Information</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Full Name</label>
          <input
            {...register('name')}
            className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email <span className="text-muted-foreground">(cannot be changed)</span></label>
          <input
            value={user?.email || ''}
            disabled
            className="w-full h-11 px-4 rounded-xl border border-input text-sm bg-secondary text-muted-foreground cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Phone Number <span className="text-muted-foreground">(optional)</span></label>
          <input
            {...register('phone')}
            type="tel"
            placeholder="+92 300 1234567"
            className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
