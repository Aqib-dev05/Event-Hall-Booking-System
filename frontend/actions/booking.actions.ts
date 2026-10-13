'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest } from '@/lib/api'
import { ActionResponse } from '@/lib/apiResponse'
import { AdminStats, BookingDoc, BookingStatus, BookingType } from '@/types'

// Thin wrappers around the Express API (/bookings/*, /payments/*, /admin/*)

// ─── Payment ──────────────────────────────────────────────────────────────────

/** The server calculates the price itself — only the booking details are sent. */
export async function createPaymentIntent(data: {
  venueId: string
  bookingType: BookingType
  eventDate: string
}): Promise<ActionResponse<{ clientSecret: string; amount: number }>> {
  return apiRequest<{ clientSecret: string; amount: number }>('/payments/create-intent', {
    method: 'POST',
    body: data,
  })
}

// ─── Create booking ───────────────────────────────────────────────────────────

export async function createBooking(data: {
  venueId: string
  eventType: string
  eventDate: string
  bookingType: BookingType
  guestCount: number
  specialRequests?: string
  paymentIntentId: string
}): Promise<ActionResponse<BookingDoc>> {
  const result = await apiRequest<BookingDoc>('/bookings', { method: 'POST', body: data })
  if (result.success) revalidatePath('/dashboard/bookings')
  return result
}

// ─── Customer bookings ────────────────────────────────────────────────────────

export async function getMyBookings(): Promise<ActionResponse<BookingDoc[]>> {
  return apiRequest<BookingDoc[]>('/bookings/my')
}

export async function getBookingById(id: string): Promise<ActionResponse<BookingDoc>> {
  return apiRequest<BookingDoc>(`/bookings/${encodeURIComponent(id)}`)
}

export async function cancelBooking(id: string): Promise<ActionResponse> {
  const result = await apiRequest(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'PATCH' })
  if (result.success) {
    revalidatePath('/dashboard/bookings')
    revalidatePath('/admin/bookings')
  }
  return result
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function submitReview(data: {
  bookingId: string
  venueId: string
  rating: number
  comment: string
}): Promise<ActionResponse> {
  const result = await apiRequest('/bookings/review', { method: 'POST', body: data })
  if (result.success) {
    revalidatePath(`/venues/${data.venueId}`)
    revalidatePath(`/dashboard/bookings/${data.bookingId}`)
  }
  return result
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAllBookings(search?: string): Promise<ActionResponse<BookingDoc[]>> {
  return apiRequest<BookingDoc[]>('/admin/bookings', { query: { search } })
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<ActionResponse> {
  const result = await apiRequest(`/admin/bookings/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  })
  if (result.success) revalidatePath('/admin/bookings')
  return result
}

export async function getAdminStats(): Promise<ActionResponse<AdminStats>> {
  return apiRequest<AdminStats>('/admin/stats')
}
