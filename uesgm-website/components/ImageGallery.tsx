'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from './ImageWithFallback'

interface ImageGalleryProps {
  images: string[]
  title?: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const nextImage = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, index) => (
          <div
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity group"
            onClick={() => openLightbox(index)}
          >
            <ImageWithFallback
              src={img}
              alt={`${title || 'Image'} - ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          <div
            className="relative w-full h-full max-w-7xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex]}
              alt={`${title || 'Image'} - ${selectedIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
