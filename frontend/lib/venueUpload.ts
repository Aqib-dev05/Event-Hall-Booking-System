import { API_URL } from '@/lib/config'
import { ActionResponse, actionError } from '@/lib/apiResponse'
import { VenueDoc } from '@/types'

/**
 * Creates (no id) or updates (id) a venue and uploads its pictures.
 *
 * This is the one place where the browser talks to the Express API directly instead of using a
 * server action: image files must not go through Next.js (server actions are limited to 1 MB by
 * default and Vercel functions to 4.5 MB). The backend (multer -> Cloudinary) accepts the multipart
 * request and checks that the token belongs to an admin.
 */
export async function saveVenue(params: {
  id?: string
  token: string
  formData: FormData
}): Promise<ActionResponse<VenueDoc>> {
  const { id, token, formData } = params
  try {
    const res = await fetch(`${API_URL}/venues${id ? `/${encodeURIComponent(id)}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { Authorization: `Bearer ${token}` }, // no Content-Type: the browser adds the multipart boundary
      body: formData,
    })
    const json = (await res.json().catch(() => null)) as
      | { success: boolean; data?: VenueDoc; error?: string }
      | null

    if (!res.ok || !json?.success) return actionError(json?.error || `Request failed (${res.status})`)
    return { success: true, data: json.data }
  } catch {
    return actionError('Cannot reach the server. Please try again later')
  }
}
