'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Building2, LayoutDashboard, Calendar, Users, MapPin, LogOut, Shield } from 'lucide-react'

interface Props { user: { name?: string | null; email?: string | null } }

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/venues', label: 'Venues', icon: MapPin, exact: false },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar, exact: false },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
]

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()
  const isActive = (href: string, exact: boolean) => exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white p-5 sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-8">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        EventHall <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-1">Admin</span>
      </Link>

      <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl mb-6">
        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center font-bold text-primary-foreground text-sm flex-shrink-0">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{user.name}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Administrator</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? 'bg-primary/20 text-primary'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>

      <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 mb-2">
        <LayoutDashboard className="w-4 h-4" /> Customer View
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </aside>
  )
}
