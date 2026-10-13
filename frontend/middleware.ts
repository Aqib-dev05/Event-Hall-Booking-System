import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const isLoggedIn = !!token
  const isAdmin = token?.role === 'admin'
  const nextUrl = request.nextUrl
  const isDashboard = nextUrl.pathname.startsWith('/dashboard')
  const isAdminPath = nextUrl.pathname.startsWith('/admin')
  const isAuthPage = ['/login', '/register'].includes(nextUrl.pathname)

  if (isAdminPath) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + nextUrl.pathname, nextUrl))
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  if (isDashboard && isLoggedIn && isAdmin) {
    return NextResponse.redirect(new URL('/admin', nextUrl))
  }

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login?callbackUrl=' + nextUrl.pathname, nextUrl))
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
