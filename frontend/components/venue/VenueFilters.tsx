'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'party', label: '🎉 Party' },
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'corporate', label: '🏢 Corporate' },
  { value: 'birthday', label: '🎂 Birthday' },
  { value: 'concert', label: '🎵 Concert' },
  { value: 'other', label: '✨ Other' },
]

const CAPACITIES = [
  { value: '', label: 'Any Size' },
  { value: '<50', label: 'Less than 50' },
  { value: '50-100', label: '50 – 100 guests' },
  { value: '100-200', label: '100 – 200 guests' },
  { value: '200+', label: '200+ guests' },
]

interface Props {
  searchParams: Record<string, string | undefined>
}

export default function VenueFilters({ searchParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.search || '')
  const [category, setCategory] = useState(searchParams.category || '')
  const [capacity, setCapacity] = useState(searchParams.capacity || '')
  const [city, setCity] = useState(searchParams.city || '')
  const [minPrice, setMinPrice] = useState(searchParams.minPrice || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice || '')

  function applyFilters() {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    if (capacity) params.set('capacity', capacity)
    if (city) params.set('city', city)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function clearFilters() {
    setSearch(''); setCategory(''); setCapacity('')
    setCity(''); setMinPrice(''); setMaxPrice('')
    startTransition(() => { router.push(pathname) })
  }

  const hasFilters = search || category || capacity || city || minPrice || maxPrice

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-5 sticky top-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Venue name or city..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">City</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          <option value="">All Cities</option>
          {['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Event Type</label>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                category === cat.value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-secondary text-muted-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Capacity</label>
        <select
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          {CAPACITIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Price / Hour (Rs.)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="flex-1 h-10 px-3 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="flex-1 h-10 px-3 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <button
        onClick={applyFilters}
        disabled={isPending}
        className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-70"
      >
        {isPending ? 'Applying...' : 'Apply Filters'}
      </button>
    </div>
  )
}
