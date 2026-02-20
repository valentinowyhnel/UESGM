import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowLeft, Users, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventRegistrationForm } from '@/components/forms/EventRegistrationForm'
import { ImageGallery } from '@/components/ImageGallery'
import { prisma } from '@/lib/prisma'

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
  const allImages = event.imageUrl ? [event.imageUrl] : []

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Bouton retour */}
      <Link href="/evenements">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux événements
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image principale */}
          {event.imageUrl && (
            <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden border">
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Galerie d'images */}
          {allImages.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Galerie ({allImages.length} photos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGallery images={allImages} title={event.title} />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          {event.antennes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Antennes concernées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {event.antennes.map((eventAntenne) => (
                    <Badge key={eventAntenne.id} variant="secondary">
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
          <Card className="sticky top-24">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                {event.category && (
                  <Badge variant="outline">{event.category}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date et heure */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">
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
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Lieu</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Nombre d'inscrits */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Inscriptions</p>
                  <p className="text-sm text-muted-foreground">
                    {event._count.registrations} personne{event._count.registrations > 1 ? 's' : ''} inscrite{event._count.registrations > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Statut */}
              {isPast && (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  Événement passé
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Formulaire d'inscription */}
          {!isPast && (
            <Card>
              <CardHeader>
                <CardTitle>S'inscrire à cet événement</CardTitle>
              </CardHeader>
              <CardContent>
                <EventRegistrationForm eventId={event.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
