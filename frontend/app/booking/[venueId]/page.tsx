import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getVenueById } from '@/actions/venue.actions'
import BookingWizard from '@/components/booking/BookingWizard'

interface Props {
  params: { venueId: string }
  searchParams: { slot?: string; date?: string }
}

export const metadata = { title: 'Book a Venue' }

export default async function BookingPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user) {
    redirect(`/login?callbackUrl=/booking/${params.venueId}`)
  }

  const result = await getVenueById(params.venueId)
  if (!result.success || !result.data) return notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BookingWizard
        venue={result.data}
        initialSlot={searchParams.slot}
        initialDate={searchParams.date}
        userId={session.user.id}
      />
    </div>
  )
}
