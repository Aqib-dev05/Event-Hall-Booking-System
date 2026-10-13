'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest } from '@/lib/api'
import { ActionResponse } from '@/lib/apiResponse'
import { ReviewDoc, SlotAvailability, VenueDoc } from '@/types'

// Thin wrappers around the Express API (/venues/*, /admin/venues).
// Creating / editing a venue (with image upload) is done by lib/venueUpload.ts straight from the browser.

// ─── Public ──────────────────────────────────────────────────────────────────

export async function getVenues(filters?: {
  search?: string
  category?: string
  city?: string
  minCapacity?: number
  maxCapacity?: number
  minPrice?: number
  maxPrice?: number
  date?: string
}): Promise<ActionResponse<VenueDoc[]>> {
  return apiRequest<VenueDoc[]>('/venues', { query: filters, authenticated: false })
}

export async function getVenueById(id: string): Promise<ActionResponse<VenueDoc>> {
  return apiRequest<VenueDoc>(`/venues/${encodeURIComponent(id)}`, { authenticated: false })
}

export async function getFeaturedVenues(): Promise<ActionResponse<VenueDoc[]>> {
  return apiRequest<VenueDoc[]>('/venues/featured', { authenticated: false })
}

export async function checkSlotAvailability(
  venueId: string,
  eventDate: string
): Promise<ActionResponse<SlotAvailability>> {
  return apiRequest<SlotAvailability>(`/venues/${encodeURIComponent(venueId)}/slots`, {
    query: { date: eventDate },
    authenticated: false,
  })
}

export async function getVenueReviews(venueId: string): Promise<ActionResponse<ReviewDoc[]>> {
  return apiRequest<ReviewDoc[]>(`/venues/${encodeURIComponent(venueId)}/reviews`, { authenticated: false })
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function deleteVenue(id: string): Promise<ActionResponse> {
  const result = await apiRequest(`/venues/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (result.success) {
    revalidatePath('/venues')
    revalidatePath('/admin/venues')
  }
  return result
}

export async function toggleVenueAvailability(
  id: string,
  isAvailable: boolean
): Promise<ActionResponse> {
  const result = await apiRequest(`/venues/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { isAvailable },
  })
  if (result.success) revalidatePath('/admin/venues')
  return result
}

export async function getAdminVenues(): Promise<ActionResponse<VenueDoc[]>> {
  return apiRequest<VenueDoc[]>('/admin/venues')
}
