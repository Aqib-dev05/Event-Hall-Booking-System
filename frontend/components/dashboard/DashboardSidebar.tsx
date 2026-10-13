'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Building2, LayoutDashboard, Calendar, User, LogOut, Shield } from 'lucide-react'

interface Props {
  user: { name?: string | null; email?: string | null; role?: string }
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: Calendar, exact: false },
  { href: '/dashboard/profile', label: 'Profile', icon: User, exact: false },
]

export default function DashboardSidebar({ user }: Props) {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border p-5 sticky top-0 h-screen">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-8">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        EventHall
      </Link>

      {/* User info */}
      <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-6">
        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}

        {user.role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors mt-4"
          >
            <Shield className="w-4 h-4" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </aside>
  )
}
