import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCard } from "@/components/cards/EventCard"
import { prisma } from "@/lib/prisma"

async function getEvents() {
  try {
    const now = new Date()
    
    const [upcoming, past] = await Promise.all([
      prisma.event.findMany({
        where: {
          publishedAt: { not: null },
          startDate: { gte: now }
        },
        orderBy: { startDate: 'asc' },
        include: {
          antennes: {
            include: {
              antenne: {
                select: { id: true, city: true }
              }
            }
          },
          _count: {
            select: { registrations: true }
          }
        }
      }),
      prisma.event.findMany({
        where: {
          publishedAt: { not: null },
          startDate: { lt: now }
        },
        orderBy: { startDate: 'desc' },
        include: {
          antennes: {
            include: {
              antenne: {
                select: { id: true, city: true }
              }
            }
          },
          _count: {
            select: { registrations: true }
          }
        }
      })
    ])

    return { upcoming, past }
  } catch (error) {
    console.error('Erreur récupération événements:', error)
    return { upcoming: [], past: [] }
  }
}

function formatEventForCard(event: any) {
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
    image: event.imageUrl || '/images/event-placeholder.jpg',
    description: event.description || ''
  }
}

export default async function EventsPage() {
    const { upcoming, past } = await getEvents()

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
