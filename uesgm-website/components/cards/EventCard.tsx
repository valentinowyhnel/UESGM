"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock } from "lucide-react"

export interface EventProps {
    id: number | string
    title: string
    date: string
    time: string
    location: string
    category: string
    image?: string
    description: string
}

interface EventCardProps {
    event: EventProps
    isPast?: boolean
}

export function EventCard({ event, isPast = false }: EventCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
            <div className="h-48 bg-gray-200 relative overflow-hidden">
                {/* Placeholder pour l'image */}
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary/40 font-bold text-2xl">
                    image
                </div>
                <Badge className="absolute top-4 right-4 bg-gold text-primary-dark font-bold hover:bg-gold-light">
                    {event.category}
                </Badge>
            </div>
            <CardHeader>
                <div className="flex items-center text-sm text-muted-foreground mb-2 space-x-4">
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-primary" />
                        {event.date}
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-primary" />
                        {event.time}
                    </div>
                </div>
                <CardTitle className="text-2xl font-montserrat group-hover:text-primary transition-colors">
                    {event.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex items-start text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gold-dark" />
                    {event.location}
                </div>
                <p className="text-muted-foreground line-clamp-2">
                    {event.description}
                </p>
            </CardContent>
            <CardFooter className="pt-0">
                <Button 
                    asChild
                    className={`w-full ${isPast ? "bg-gray-400 hover:bg-gray-500" : "bg-primary hover:bg-primary-light"}`}
                >
                    <Link href={`/evenements/${event.id}`}>
                        {isPast ? "Voir le compte-rendu" : "S'inscrire / Détails"}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
