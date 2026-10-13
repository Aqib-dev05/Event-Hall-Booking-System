'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateBookingStatus } from '@/actions/booking.actions'
import { BookingStatus } from '@/types'

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed']

interface Props { bookingId: string; currentStatus: BookingStatus }

export default function AdminBookingStatusUpdate({ bookingId, currentStatus }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as BookingStatus
    setSaving(true)
    const result = await updateBookingStatus(bookingId, newStatus)
    setSaving(false)
    if (result.success) {
      toast.success('Status updated')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={saving}
      className="h-8 px-2 rounded-lg border border-input text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring bg-background disabled:opacity-70 capitalize"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="capitalize">{s}</option>
      ))}
    </select>
  )
}
