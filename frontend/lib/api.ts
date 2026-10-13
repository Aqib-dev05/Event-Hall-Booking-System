import { auth } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { ActionResponse, actionError } from '@/lib/apiResponse'

// Server-side helper used by server actions and server components to talk to the Express backend.
// It attaches the backend JWT from the NextAuth session and converts the API envelope
//   { success, data, message } | { success: false, error }
// into the ActionResponse shape the UI already uses.

type Query = Record<string, string | number | boolean | null | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
  /** Send the logged-in user's token (default true). Set false for public endpoints. */
  authenticated?: boolean
}

interface Envelope<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export async function apiRequest<T = void>(
  path: string,
  { method = 'GET', body, query, authenticated = true }: RequestOptions = {}
): Promise<ActionResponse<T>> {
  const url = new URL(`${API_URL}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (authenticated) {
    const session = await auth()
    if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => null)) as Envelope<T> | null

    if (!res.ok || !json?.success) {
      return actionError(json?.error || `Request failed (${res.status})`)
    }
    return { success: true, data: json.data, message: json.message }
  } catch (e) {
    console.error('API request failed:', path, e)
    return actionError('Cannot reach the server. Please try again later')
  }
}
