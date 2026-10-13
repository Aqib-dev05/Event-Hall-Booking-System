import { getAllUsers } from '@/actions/user.actions'
import { format } from 'date-fns'
import { Users } from 'lucide-react'

export const metadata = { title: 'All Users' }

export default async function AdminUsersPage() {
  const result = await getAllUsers()
  const users = result.success ? result.data ?? [] : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">{users.length} registered customers</p>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Customer', 'Email', 'Phone', 'Total Bookings', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/20">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="font-medium text-sm">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{user.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      (user as any).totalBookings > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {(user as any).totalBookings}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No customers yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
