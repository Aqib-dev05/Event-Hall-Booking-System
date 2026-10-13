import Link from 'next/link'
import { Building2, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Building2 className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-6xl font-bold text-muted-foreground/30 mb-2">404</h1>
      <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <Link href="/venues" className="flex items-center gap-2 border border-border font-semibold px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm">
          Browse Venues
        </Link>
      </div>
    </div>
  )
}
