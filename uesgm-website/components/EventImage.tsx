'use client'

import { useState } from 'react'

interface EventImageProps {
  src: string
  alt: string
}

export function EventImage({ src, alt }: EventImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <img 
          src="/images/placeholder-image.png" 
          alt={alt}
          className="w-full h-full object-contain p-4"
        />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  )
}
