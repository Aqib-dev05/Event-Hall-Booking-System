export type UserRole = 'customer' | 'admin'
export type VenueCategory = 'party' | 'wedding' | 'corporate' | 'birthday' | 'concert' | 'other'
export type BookingType = 'morning' | 'afternoon' | 'evening' | 'fullday'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

// Shapes returned by the Express API (PostgreSQL ids are strings named `id`)
export interface UserDoc {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  emailVerified: boolean
  createdAt: string
}

export interface VenueDoc {
  id: string
  name: string
  description: string
  location: string
  city: string
  capacity: number
  pricePerHour: number
  category: VenueCategory
  images: string[]
  amenities: string[]
  isAvailable: boolean
  rating: number
  totalReviews: number
  createdAt: string
}

export interface BookingDoc {
  id: string
  userId: string
  venueId: string
  user?: UserDoc
  venue?: VenueDoc
  eventType: string
  eventDate: string
  bookingType: BookingType
  slotLabel: string
  slotStart: string
  slotEnd: string
  durationHrs: number
  guestCount: number
  totalAmount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentIntentId?: string | null
  specialRequests?: string | null
  reminderSent: boolean
  createdAt: string
}

export interface ReviewDoc {
  id: string
  userId: string
  venueId: string
  bookingId: string
  user?: { name: string }
  rating: number
  comment: string
  createdAt: string
}

export interface SlotAvailability {
  morning: { available: boolean }
  afternoon: { available: boolean }
  evening: { available: boolean }
  fullday: { available: boolean }
}

export interface DashboardStats {
  totalBookings: number
  upcomingBookings: number
  completedBookings: number
  cancelledBookings: number
  totalSpent: number
  nextBookings: BookingDoc[]
}

export interface AdminStats {
  totalVenues: number
  totalBookings: number
  pendingBookings: number
  monthlyRevenue: number
  revenueByMonth: { month: string; revenue: number; count: number }[]
  recentBookings: BookingDoc[]
}

export interface BookingFormData {
  eventType: string
  eventDate: string
  bookingType: BookingType
  guestCount: number
  specialRequests?: string
}

// Next Auth
declare module 'next-auth' {
  interface Session {
    // JWT issued by the Express backend — sent as "Authorization: Bearer <token>"
    accessToken: string
    user: {
      id: string
      name: string
      email: string
      role: UserRole
    }
  }
  interface User {
    id: string
    name: string
    email: string
    role: UserRole
    accessToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    accessToken: string
  }
}
