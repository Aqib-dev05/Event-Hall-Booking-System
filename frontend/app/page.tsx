import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Calendar, Star, Building2, ArrowRight, CheckCircle } from 'lucide-react'
import { getFeaturedVenues } from '@/actions/venue.actions'
import VenueCard from '@/components/venue/VenueCard'

const CATEGORIES = [
  { id: 'party', label: 'Party', emoji: '🎉', color: 'bg-pink-50 hover:bg-pink-100 border-pink-200' },
  { id: 'wedding', label: 'Wedding', emoji: '💍', color: 'bg-rose-50 hover:bg-rose-100 border-rose-200' },
  { id: 'corporate', label: 'Corporate', emoji: '🏢', color: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂', color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200' },
  { id: 'concert', label: 'Concert', emoji: '🎵', color: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { id: 'other', label: 'Other', emoji: '✨', color: 'bg-green-50 hover:bg-green-100 border-green-200' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse Venues',
    description: 'Explore hundreds of event halls across Pakistan. Filter by city, capacity, category, and budget.',
    icon: <Search className="w-6 h-6" />,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    step: '02',
    title: 'Book & Pay',
    description: 'Select your time slot, fill in event details, and pay securely via Stripe. Instant confirmation.',
    icon: <Calendar className="w-6 h-6" />,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    step: '03',
    title: 'Enjoy Your Event',
    description: 'Receive a confirmation email with all details. Show up and enjoy your perfect event!',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-green-50 text-green-600',
  },
]

const STATIC_TESTIMONIALS = [
  {
    name: 'Fatima Malik',
    city: 'Lahore',
    rating: 5,
    comment: 'Booked the Grand Pearl Hall for my daughter\'s wedding. The process was seamless and the venue was absolutely stunning. Highly recommend!',
    date: 'Oct 2024',
  },
  {
    name: 'Usman Tariq',
    city: 'Karachi',
    rating: 5,
    comment: 'Perfect for our company\'s annual dinner. The booking system is easy to use and the confirmation was instant. Will definitely use again.',
    date: 'Nov 2024',
  },
  {
    name: 'Ayesha Siddiqui',
    city: 'Islamabad',
    rating: 4,
    comment: 'Great platform! Found exactly what I needed for my birthday party. The time slot system is very convenient.',
    date: 'Dec 2024',
  },
]

export default async function HomePage() {
  const featuredResult = await getFeaturedVenues()
  const featuredVenues = featuredResult.success ? featuredResult.data ?? [] : []

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Pakistan&apos;s #1 Event Hall Booking Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Book Your Perfect{' '}
              <span className="text-primary">Event Hall</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Discover and book premium event halls across Pakistan. From intimate gatherings
              to grand weddings — find your perfect venue in minutes.
            </p>

            {/* Search bar */}
            <div className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl max-w-2xl">
              <div className="flex items-center gap-3 flex-1 px-4 py-2">
                <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="City (Lahore, Karachi...)"
                  className="flex-1 text-sm text-foreground outline-none bg-transparent placeholder:text-muted-foreground"
                />
              </div>
              <div className="w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-3 flex-1 px-4 py-2">
                <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 text-sm text-foreground outline-none bg-transparent"
                />
              </div>
              <Link
                href="/venues"
                className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-2 justify-center"
              >
                <Search className="w-4 h-4" /> Search Venues
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-8 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Instant confirmation</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Secure payments</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Free cancellation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Browse by Event Type</h2>
          <p className="text-muted-foreground mt-2">Find the perfect venue for any occasion</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/venues?category=${cat.id}`}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-200 hover:scale-105 ${cat.color}`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-semibold text-sm text-slate-700">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Venues ── */}
      {featuredVenues.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold">Top Rated Venues</h2>
                <p className="text-muted-foreground mt-1">Handpicked for exceptional quality</p>
              </div>
              <Link
                href="/venues"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground mt-2">Book your event hall in 3 simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="text-center relative">
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-1/2 w-full border-t-2 border-dashed border-border" />
              )}
              <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10`}>
                {step.icon}
              </div>
              <div className="text-xs font-bold text-primary/60 mb-2">Step {step.step}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-secondary/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">What Our Customers Say</h2>
            <p className="text-muted-foreground mt-2">Trusted by thousands of happy clients</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATIC_TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < t.rating ? 'fill-primary text-primary' : 'text-border'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">&quot;{t.comment}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city} · {t.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-12 text-center text-white">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Ready to Host Your Event?</h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust EventHall Pakistan for their special occasions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/venues"
              className="bg-white/10 text-white border border-white/20 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors"
            >
              Browse Venues
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                EventHall Pakistan
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Pakistan&apos;s trusted platform for booking premium event halls. From weddings to corporate events.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/venues" className="hover:text-foreground">Browse Venues</Link></li>
                <li><Link href="/register" className="hover:text-foreground">Create Account</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Cities</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad'].map((c) => (
                  <li key={c}>
                    <Link href={`/venues?city=${c}`} className="hover:text-foreground">{c}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} EventHall Pakistan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
