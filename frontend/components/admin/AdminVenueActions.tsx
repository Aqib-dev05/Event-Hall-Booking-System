'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { deleteVenue, toggleVenueAvailability } from '@/actions/venue.actions'

interface Props { venueId: string; isAvailable: boolean }

export default function AdminVenueActions({ venueId, isAvailable }: Props) {
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleToggle() {
    setToggling(true)
    const result = await toggleVenueAvailability(venueId, !isAvailable)
    setToggling(false)
    if (result.success) {
      toast.success(result.message || 'Updated')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteVenue(venueId)
    setDeleting(false)
    setShowConfirm(false)
    if (result.success) {
      toast.success('Venue deleted')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Link
          href={`/admin/venues/${venueId}/edit`}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={isAvailable ? 'Deactivate' : 'Activate'}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          {toggling ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : isAvailable ? (
            <ToggleRight className="w-4 h-4 text-green-600" />
          ) : (
            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">Delete Venue?</h3>
            <p className="text-muted-foreground text-sm mb-5">This action cannot be undone. Venues that already have bookings can't be deleted — deactivate them instead.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
