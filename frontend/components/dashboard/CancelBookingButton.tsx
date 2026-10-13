'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cancelBooking } from '@/actions/booking.actions'
import { Loader2, AlertTriangle } from 'lucide-react'

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    setLoading(true)
    const result = await cancelBooking(bookingId)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success('Booking cancelled. Refund will be processed in 3-5 business days.')
      setShowDialog(false)
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-sm font-medium hover:bg-red-100 transition-colors"
      >
        Cancel Booking
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Cancel Booking?</h3>
            <p className="text-muted-foreground text-sm text-center mb-6">
              Are you sure you want to cancel this booking? Your refund will be processed within 3-5 business days.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
