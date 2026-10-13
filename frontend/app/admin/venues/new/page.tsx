import VenueForm from '@/components/admin/VenueForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Add New Venue' }

export default function NewVenuePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/venues" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Venues
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Add New Venue</h1>
      <VenueForm />
    </div>
  )
}
