'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md mb-8">{error.message || 'An unexpected error occurred. Please try again.'}</p>
      <div className="flex gap-3">
        <button onClick={reset} className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
          Try Again
        </button>
        <Link href="/" className="border border-border font-semibold px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm">
          Go Home
        </Link>
      </div>
    </div>
  )
}
