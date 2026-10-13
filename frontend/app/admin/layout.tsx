import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <AdminSidebar user={session.user} />
      <main className="flex-1 p-6 lg:p-8 min-w-0">{children}</main>
    </div>
  )
}
