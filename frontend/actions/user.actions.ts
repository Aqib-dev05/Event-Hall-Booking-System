'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest } from '@/lib/api'
import { ActionResponse } from '@/lib/apiResponse'
import { DashboardStats, UserDoc } from '@/types'

// Thin wrappers around the Express API (POST /auth/register, /users/*, /admin/users)

export async function registerUser(data: {
  name: string
  email: string
  password: string
  phone?: string
}): Promise<ActionResponse<{ message: string }>> {
  return apiRequest<{ message: string }>('/auth/register', {
    method: 'POST',
    body: data,
    authenticated: false,
  })
}

export async function getMyProfile(): Promise<ActionResponse<UserDoc>> {
  return apiRequest<UserDoc>('/users/me')
}

export async function updateProfile(data: {
  name: string
  phone?: string
}): Promise<ActionResponse<UserDoc>> {
  const result = await apiRequest<UserDoc>('/users/me', { method: 'PATCH', body: data })
  if (result.success) revalidatePath('/dashboard/profile')
  return result
}

export async function changePassword(data: {
  oldPassword: string
  newPassword: string
}): Promise<ActionResponse> {
  return apiRequest('/users/me/password', { method: 'PUT', body: data })
}

export async function getMyDashboardStats(): Promise<ActionResponse<DashboardStats>> {
  return apiRequest<DashboardStats>('/users/me/stats')
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<ActionResponse<(UserDoc & { totalBookings: number })[]>> {
  return apiRequest<(UserDoc & { totalBookings: number })[]>('/admin/users')
}
