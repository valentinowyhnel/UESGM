"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState } from "react"

interface PartnerCardProps {
    name: string
    description: string
    website?: string
    image?: string
}

export function PartnerCard({ name, description, website, image }: PartnerCardProps) {
    const [imageError, setImageError] = useState(false)

    return (
        <Card className="hover:shadow-lg transition-all group border-transparent hover:border-gold/30">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform overflow-hidden">
                    {image && !imageError ? (
                        <Image
                            src={image}
                            alt={name}
                            width={96}
                            height={96}
                            className="rounded-full object-cover w-full h-full"
                            unoptimized
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <span className="text-3xl font-bold text-gray-300">{name.charAt(0)}</span>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-lg font-montserrat group-hover:text-primary transition-colors">{name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    {website && website !== "#" && (
                        <a 
                            href={website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-gold text-sm mt-2 inline-block transition-colors"
                        >
                            Visiter le site →
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
