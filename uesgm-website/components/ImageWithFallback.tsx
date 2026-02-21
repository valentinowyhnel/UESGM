'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
}

export function ImageWithFallback({ 
  src, 
  alt, 
  fill = false,
  className = '', 
  sizes,
  priority = false
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  // Si l'image ne peut pas être chargée, afficher le placeholder
  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <img 
          src="/images/placeholder-image.png" 
          alt={alt}
          className="w-full h-full object-contain p-4"
        />
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  )
}
