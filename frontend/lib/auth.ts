import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { API_URL } from '@/lib/config'
import { UserRole } from '@/types'

// The session lives exactly as long as the backend JWT (JWT_EXPIRES_IN=7d in the backend .env)
const SESSION_SECONDS = 7 * 24 * 60 * 60

interface LoginResponse {
  success: boolean
  data?: {
    token: string
    user: { id: string; name: string; email: string; role: UserRole }
  }
  error?: string
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            cache: 'no-store',
          })
          const json = (await res.json()) as LoginResponse
          if (!res.ok || !json.success || !json.data) return null

          const { token, user } = json.data
          return { id: user.id, name: user.name, email: user.email, role: user.role, accessToken: token }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        // Used by lib/api.ts (server) and the venue image upload (browser) to call the Express API
        session.accessToken = token.accessToken
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: SESSION_SECONDS, updateAge: SESSION_SECONDS },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
})
