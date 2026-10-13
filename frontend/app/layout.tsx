import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { auth } from '@/lib/auth'
import Navbar from '@/components/shared/Navbar'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'EventHall Pakistan', template: '%s | EventHall Pakistan' },
  description: 'Book the perfect event hall for your special occasion in Pakistan',
  keywords: ['event hall', 'booking', 'Pakistan', 'wedding', 'corporate', 'party'],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers session={session}>
          <Navbar session={session} />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
