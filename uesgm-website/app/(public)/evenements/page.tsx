'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCard } from "@/components/cards/EventCard"
import { useEffect, useState } from "react"

interface EventData {
  id: string
  title: string
  slug: string
  description: string
  location: string
  startDate: string
  category: string
  imageUrl: string | null
}

function formatEventForCard(event: EventData) {
  const eventDate = new Date(event.startDate)
  return {
    id: event.id,
    title: event.title,
    date: eventDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    time: eventDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    location: event.location || 'Lieu à confirmer',
    category: event.category || 'Général',
    image: event.imageUrl || '/images/placeholder-image.png',
    description: event.description || ''
  }
}

// Composant avec SSE pour les mises à jour en temps réel
export default function EventsPage() {
  const [upcoming, setUpcoming] = useState<EventData[]>([])
  const [past, setPast] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les événements
  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events?status=all')
      if (response.ok) {
        const data = await response.json()
        const now = new Date()
        const upcomingEvents = data.data.filter((e: EventData) => new Date(e.startDate) >= now)
        const pastEvents = data.data.filter((e: EventData) => new Date(e.startDate) < now)
        setUpcoming(upcomingEvents)
        setPast(pastEvents)
      }
    } catch (error) {
      console.error('Erreur chargement événements:', error)
    } finally {
      setLoading(false)
    }
  }

  // Chargement initial + SSE pour les mises à jour en temps réel
  useEffect(() => {
    loadEvents()

    let eventSource: EventSource | null = null

    const connectSSE = () => {
      eventSource = new EventSource('/api/sse/events')
      
      // Écouter les événements spécifiques
      eventSource.addEventListener('event:created', () => {
        console.log('📡 Nouvel événement créé')
        loadEvents()
      })
      
      eventSource.addEventListener('event:updated', () => {
        console.log('📡 Événement mis à jour')
        loadEvents()
      })
      
      eventSource.addEventListener('event:published', () => {
        console.log('📡 Événement publié')
        loadEvents()
      })
      
      eventSource.addEventListener('event:any', () => {
        console.log('📡 Mise à jour des événements reçue')
        loadEvents()
      })
      
      eventSource.onerror = () => {
        eventSource?.close()
        setTimeout(connectSSE, 5000)
      }
    }

    connectSSE()

    return () => {
      eventSource?.close()
    }
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des événements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-4xl font-bold font-montserrat text-primary-dark">Nos Événements</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-lato">
          Restez à l'affût de toute l'actualité en lien avec nos événements.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="upcoming">
              À venir ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Passés ({past.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming">
          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {upcoming.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={formatEventForCard(event)} 
                  isPast={false} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun événement à venir pour le moment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {past.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={formatEventForCard(event)} 
                  isPast={true} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun événement passé pour le moment.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
