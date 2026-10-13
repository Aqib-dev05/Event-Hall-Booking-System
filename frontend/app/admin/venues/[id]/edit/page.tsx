import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getVenueById } from '@/actions/venue.actions'
import VenueForm from '@/components/admin/VenueForm'

interface Props { params: { id: string } }

export const metadata = { title: 'Edit Venue' }

export default async function EditVenuePage({ params }: Props) {
  const result = await getVenueById(params.id)
  if (!result.success || !result.data) return notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/venues" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Venues
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">Edit Venue: {result.data.name}</h1>
      <VenueForm venue={result.data} />
    </div>
  )
}
