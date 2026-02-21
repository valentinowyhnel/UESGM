import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowLeft, Users, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventRegistrationForm } from '@/components/forms/EventRegistrationForm'
import { ImageGallery } from '@/components/ImageGallery'
import { EventImage } from '@/components/EventImage'
import { prisma } from '@/lib/prisma'

// Générer les paramètres statiques pour tous les événements publiés
export async function generateStaticParams() {
  try {
    const events = await prisma.event.findMany({
      where: {
        publishedAt: { not: null },
        status: 'PUBLISHED'
      },
      select: { id: true },
      take: 100 // Limiter à 100 événements pour le build
    })
    
    return events.map((event) => ({
      id: event.id
    }))
  } catch (error) {
    console.error('Erreur generateStaticParams:', error)
    return []
  }
}

// Désactiver le cache pour récupérer les événements en temps réel
export const dynamicParams = true
export const revalidate = 0

async function getEvent(id: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
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
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!event || !event.publishedAt) {
      return null
    }

    return event
  } catch (error) {
    console.error('Erreur récupération événement:', error)
    return null
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  const isPast = new Date(event.startDate) < new Date()
  const eventImageUrls = event.images?.map(img => img.url) || []
  const allImages = event.imageUrl ? [event.imageUrl, ...eventImageUrls] : eventImageUrls

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Bouton retour */}
      <Link href="/evenements" className="inline-block mb-6">
        <Button variant="ghost" className="hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux événements
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image principale */}
          {event.imageUrl && (
            <div className="w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden border bg-slate-100">
              <EventImage
                src={event.imageUrl}
                alt={event.title}
              />
            </div>
          )}

          {/* Galerie d'images */}
          {allImages.length > 1 && (
            <Card className="border">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="w-5 h-5" />
                  Galerie ({allImages.length} photos)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ImageGallery images={allImages} title={event.title} />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card className="border">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-xl">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          {event.antennes.length > 0 && (
            <Card className="border">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-xl">Antennes concernées</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {event.antennes.map((eventAntenne) => (
                    <Badge key={eventAntenne.id} variant="secondary" className="px-3 py-1">
                      {eventAntenne.antenne.city}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations principales */}
          <Card className="border">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col gap-3">
                <CardTitle className="text-xl leading-tight">{event.title}</CardTitle>
                {event.category && (
                  <Badge variant="outline" className="w-fit">{event.category}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Date et heure */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm md:text-base">
                    {new Date(event.startDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(event.startDate).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Lieu */}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm md:text-base">Lieu</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Nombre d'inscrits */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm md:text-base">Inscriptions</p>
                  <p className="text-sm text-muted-foreground">
                    {event._count.registrations} personne{event._count.registrations > 1 ? 's' : ''} inscrite{event._count.registrations > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Statut */}
              {isPast && (
                <Badge variant="secondary" className="w-full justify-center py-2 mt-2">
                  Événement passé
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Formulaire d'inscription */}
          {!isPast && (
            <Card className="border">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">S'inscrire à cet événement</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <EventRegistrationForm eventId={event.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
