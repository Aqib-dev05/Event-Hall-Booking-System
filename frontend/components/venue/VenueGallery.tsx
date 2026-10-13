'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'

interface Props {
  images: string[]
  name: string
}

export default function VenueGallery({ images, name }: Props) {
  const displayImages = images?.length > 0 ? images : [DEFAULT_IMAGE]
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <div className="grid grid-cols-4 gap-2 h-72 sm:h-96 rounded-2xl overflow-hidden">
        {/* Main image */}
        <div
          className="col-span-3 cursor-pointer relative overflow-hidden bg-secondary"
          onClick={() => setLightbox(true)}
        >
          <img
            src={displayImages[activeIndex]}
            alt={`${name} - main`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {activeIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {displayImages.slice(0, 4).map((img, i) => (
            <div
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`flex-1 cursor-pointer relative overflow-hidden rounded-lg transition-all ${
                activeIndex === i ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`${name} ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {i === 3 && displayImages.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-bold">
                  +{displayImages.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-primary p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => setActiveIndex((i) => (i - 1 + displayImages.length) % displayImages.length)}
            className="absolute left-4 text-white hover:text-primary p-2"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img
            src={displayImages[activeIndex]}
            alt={name}
            className="max-h-[85vh] max-w-[85vw] object-contain"
          />
          <button
            onClick={() => setActiveIndex((i) => (i + 1) % displayImages.length)}
            className="absolute right-4 text-white hover:text-primary p-2"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-4 text-white text-sm">
            {activeIndex + 1} / {displayImages.length}
          </div>
        </div>
      )}
    </>
  )
}
