import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { errorResponse, successResponse, serverErrorResponse } from '@/lib/apiResponse'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    const { amount, venueId, bookingData } = await req.json()

    if (!amount || amount < 50) {
      return errorResponse('Invalid amount')
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paisa (PKR minor unit)
      currency: 'pkr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: session.user.id,
        venueId,
        ...bookingData,
      },
    })

    return successResponse({ clientSecret: paymentIntent.client_secret })
  } catch (e) {
    return serverErrorResponse(e)
  }
}
