import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Building2, LayoutDashboard, Calendar, User, LogOut, ChevronRight } from 'lucide-react'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'admin') redirect('/admin')

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <DashboardSidebar user={session.user} />
      <main className="flex-1 p-6 lg:p-8 min-w-0">{children}</main>
    </div>
  )
}
