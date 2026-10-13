import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMyProfile } from '@/actions/user.actions'
import ProfileForm from '@/components/dashboard/ProfileForm'
import ChangePasswordForm from '@/components/dashboard/ChangePasswordForm'

export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const result = await getMyProfile()
  const user = result.success ? result.data : null

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      <div className="space-y-6">
        <ProfileForm user={user} />
        <ChangePasswordForm />
      </div>
    </div>
  )
}
