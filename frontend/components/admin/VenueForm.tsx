'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Plus, X } from 'lucide-react'
import { saveVenue } from '@/lib/venueUpload'
import { VenueCategory, VenueDoc } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(5, 'Full address required'),
  city: z.string().min(2, 'City is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  pricePerHour: z.number().min(1, 'Price is required'),
  category: z.enum(['party', 'wedding', 'corporate', 'birthday', 'concert', 'other']),
})
type VenueFormValues = z.infer<typeof schema>

const CATEGORIES: VenueCategory[] = ['party', 'wedding', 'corporate', 'birthday', 'concert', 'other']
const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface NewImage {
  file: File
  preview: string
}
const COMMON_AMENITIES = ['WiFi', 'Parking', 'Catering', 'Sound System', 'AC', 'Projector', 'Stage', 'Lighting', 'Generator', 'Decoration']

interface Props { venue?: VenueDoc }

export default function VenueForm({ venue }: Props) {
  const router = useRouter()
  const isEdit = !!venue

  const [amenities, setAmenities] = useState<string[]>(venue?.amenities || [])
  const { data: session } = useSession()
  const fileInput = useRef<HTMLInputElement>(null)
  // Pictures that are already uploaded (kept on save) + new files chosen in this form
  const [existingImages, setExistingImages] = useState<string[]>(venue?.images || [])
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const [customAmenity, setCustomAmenity] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VenueFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: venue?.name || '',
      description: venue?.description || '',
      location: venue?.location || '',
      city: venue?.city || '',
      capacity: venue?.capacity || 100,
      pricePerHour: venue?.pricePerHour || 5000,
      category: venue?.category || 'party',
    },
  })

  function toggleAmenity(a: string) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
  }

  function addCustomAmenity() {
    if (customAmenity.trim() && !amenities.includes(customAmenity.trim())) {
      setAmenities((prev) => [...prev, customAmenity.trim()])
      setCustomAmenity('')
    }
  }

  // Free the browser memory used by the previews when leaving the page
  const previewsRef = useRef<NewImage[]>([])
  previewsRef.current = newImages
  useEffect(() => () => previewsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), [])

  const totalImages = existingImages.length + newImages.length

  function onFilesChosen(files: FileList | null) {
    if (!files) return
    const accepted: NewImage[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG or WEBP images are allowed`)
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name}: each image must be 5 MB or smaller`)
        continue
      }
      if (totalImages + accepted.length >= MAX_IMAGES) {
        toast.error(`You can add up to ${MAX_IMAGES} images`)
        break
      }
      accepted.push({ file, preview: URL.createObjectURL(file) })
    }
    if (accepted.length) setNewImages((prev) => [...prev, ...accepted])
    if (fileInput.current) fileInput.current.value = ''
  }

  function removeExisting(url: string) {
    setExistingImages((prev) => prev.filter((u) => u !== url))
  }

  function removeNew(index: number) {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function onSubmit(data: VenueFormValues) {
    if (!session?.accessToken) {
      toast.error('Your session has expired. Please login again')
      return
    }

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('description', data.description)
    formData.append('location', data.location)
    formData.append('city', data.city)
    formData.append('capacity', String(data.capacity))
    formData.append('pricePerHour', String(data.pricePerHour))
    formData.append('category', data.category)
    formData.append('amenities', JSON.stringify(amenities))
    if (isEdit) formData.append('existingImages', JSON.stringify(existingImages))
    newImages.forEach((img) => formData.append('images', img.file))

    const result = await saveVenue({ id: venue?.id, token: session.accessToken, formData })

    if (!result.success) {
      toast.error(result.error)
    } else {
      toast.success(`Venue ${isEdit ? 'updated' : 'created'} successfully!`)
      router.push('/admin/venues')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-bold text-lg">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Venue Name</label>
            <input {...register('name')} placeholder="e.g. Pearl Continental Banquet Hall" className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea {...register('description')} rows={4} placeholder="Describe the venue..." className="w-full px-4 py-3 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">City</label>
            <select {...register('city')} className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background">
              {['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select {...register('category')} className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background capitalize">
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Full Address</label>
            <input {...register('location')} placeholder="e.g. 123 MM Alam Road, Gulberg III" className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.location && <p className="text-destructive text-xs mt-1">{errors.location.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Capacity (max guests)</label>
            <input {...register('capacity', { valueAsNumber: true })} type="number" min={1} className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.capacity && <p className="text-destructive text-xs mt-1">{errors.capacity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Price Per Hour (Rs.)</label>
            <input {...register('pricePerHour', { valueAsNumber: true })} type="number" min={1} className="w-full h-11 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.pricePerHour && <p className="text-destructive text-xs mt-1">{errors.pricePerHour.message}</p>}
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-bold text-lg mb-4">Amenities</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {COMMON_AMENITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                amenities.includes(a) ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
            placeholder="Add custom amenity..."
            className="flex-1 h-10 px-4 rounded-xl border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="button" onClick={addCustomAmenity} className="h-10 px-4 bg-secondary rounded-xl text-sm font-medium hover:bg-secondary/80">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {amenities.filter((a) => !COMMON_AMENITIES.includes(a)).map((a) => (
          <span key={a} className="inline-flex items-center gap-1 mt-2 mr-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            {a}
            <button type="button" onClick={() => toggleAmenity(a)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-bold text-lg mb-1">Images</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload up to {MAX_IMAGES} pictures (JPG, PNG or WEBP, max 5 MB each). The first picture is the cover.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {existingImages.map((url) => (
            <div key={url} className="relative aspect-video rounded-xl overflow-hidden border border-border bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Venue" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(url)}
                aria-label="Remove image"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {newImages.map((img, i) => (
            <div key={img.preview} className="relative aspect-video rounded-xl overflow-hidden border border-primary/40 bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">New</span>
              <button
                type="button"
                onClick={() => removeNew(i)}
                aria-label="Remove image"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {totalImages < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-secondary/50 flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground"
            >
              <ImagePlus className="w-6 h-6" />
              Add images
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => onFilesChosen(e.target.files)}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 px-8 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Venue')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 px-6 border border-border rounded-xl text-sm font-medium hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
