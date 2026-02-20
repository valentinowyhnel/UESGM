import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { 
  withAdminAuth, 
  eventUpdateSchema, 
  eventDateSchema,
  logAdminAction, 
  generateSlug
} from '@/lib/admin-events-security'
import { prisma } from '@/lib/prisma'
import { emitAdminEventEvent } from '@/lib/sse'

// Interface pour les événements (même définition que dans le route principal)
interface Event {
  id: string
  title: string
  slug: string
  description: string
  location: string
  imageUrl?: string | null
  category: 'INTEGRATION' | 'ACADEMIC' | 'SOCIAL' | 'CULTURAL'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  startDate: Date
  endDate?: Date | null
  maxAttendees?: number | null
  createdAt: Date
  updatedAt: Date
  createdById: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count?: {
    attendees: number
  }
}

// Mock data pour les événements (même données que dans le route principal)
let mockEvents: Event[] = [
  {
    id: '1',
    title: 'Journée d\'Intégration UESGM 2024',
    slug: 'journee-integration-uesgm-2024',
    description: 'Une journée complète pour accueillir les nouveaux membres et présenter les activités de l\'UESGM. Programme riche avec ateliers, présentations et networking.',
    location: 'Université Omar Bongo, Libreville',
    imageUrl: '/images/events/integration-2024.jpg',
    category: 'INTEGRATION',
    status: 'DRAFT',
    startDate: new Date('2024-03-15T09:00:00Z'),
    endDate: new Date('2024-03-15T17:00:00Z'),
    maxAttendees: 150,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    createdById: 'admin-1',
    createdBy: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@esgm.org'
    },
    _count: {
      attendees: 45
    }
  },
  {
    id: '2',
    title: 'Conférence sur les Sciences Médicales',
    slug: 'conference-sciences-medicales',
    description: 'Conférence animée par des experts médicaux sur les dernières avancées en recherche médicale et les opportunités de carrière.',
    location: 'Faculté de Médecine, Libreville',
    imageUrl: '/images/events/medical-conference.jpg',
    category: 'ACADEMIC',
    status: 'PUBLISHED',
    startDate: new Date('2024-02-20T14:00:00Z'),
    endDate: new Date('2024-02-20T18:00:00Z'),
    maxAttendees: 200,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-08'),
    createdById: 'admin-1',
    createdBy: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@esgm.org'
    },
    _count: {
      attendees: 127
    }
  }
]

// Service pour gérer les événements (même logique que dans le route principal)
const eventService = {
  getById: (id: string) => mockEvents.find(e => e.id === id),

  update: (id: string, updates: Partial<Event>) => {
    const index = mockEvents.findIndex(e => e.id === id)
    if (index === -1) return null

    mockEvents[index] = {
      ...mockEvents[index],
      ...updates,
      updatedAt: new Date()
    }
    return mockEvents[index]
  },

  delete: (id: string) => {
    const index = mockEvents.findIndex(e => e.id === id)
    if (index === -1) return null

    const deleted = mockEvents[index]
    mockEvents.splice(index, 1)
    return deleted
  }
}

// GET - Récupérer un événement spécifique
export const GET = withAdminAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const eventId = params.id

    // Vérifier si l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Logging de l'action
    await logAdminAction(
      user.id,
      'VIEW',
      'event',
      eventId,
      { title: event.title }
    )

    return NextResponse.json({ event })
  } catch (error) {
    console.error('GET event error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'événement' },
      { status: 500 }
    )
  }
})

// PATCH - Mettre à jour un événement
export const PATCH = withAdminAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const eventId = params.id
    const body = await req.json()

    // Validation des données
    const validation = eventUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    // Vérifier si l'événement existe
    const existingEvent = eventService.getById(eventId)
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Créer un objet avec les mises à jour et convertir les dates si nécessaire
    const updateData: Partial<Event> = {
      ...validation.data,
      startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
      endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
    }

    // Si le titre change, regénérer le slug
    if (updateData.title && updateData.title !== existingEvent.title) {
      const newSlug = generateSlug(updateData.title)
      
      // Vérifier si le nouveau slug existe déjà (pour un autre événement)
      const existingWithSlug = mockEvents.find(e => e.slug === newSlug && e.id !== eventId)
      if (existingWithSlug) {
        return NextResponse.json(
          { error: 'Un événement avec ce titre existe déjà' },
          { status: 409 }
        )
      }
      
      // Ajouter le nouveau slug aux mises à jour
      updateData.slug = newSlug
    }

    // Valider les dates avec le schéma Zod
    if (updateData.startDate || updateData.endDate) {
      const dateValidation = eventDateSchema.safeParse({
        startDate: updateData.startDate || existingEvent.startDate.toISOString(),
        endDate: updateData.endDate || existingEvent.endDate?.toISOString()
      });

      if (!dateValidation.success) {
        return NextResponse.json(
          { 
            error: 'Erreur de validation des dates',
            details: dateValidation.error.format()
          },
          { status: 400 }
        )
      }

      // S'assurer que les dates sont des objets Date valides
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }
    }

    // Mise à jour de l'événement
    const updatedEvent = eventService.update(eventId, updateData)
    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Revalidation du cache
    revalidatePath('/admin/evenements')
    // Revalider les pages publiques si l'événement est publié
    const finalStatus = updateData.status || existingEvent.status
    if (finalStatus === 'PUBLISHED') {
      revalidatePath('/events')
      revalidatePath(`/events/${eventId}`)
    }

    // Logging de l'action
    await logAdminAction(
      user.id,
      'UPDATE',
      'event',
      eventId,
      { 
        title: updatedEvent.title,
        updatedFields: Object.keys(updateData)
      }
    )

    return NextResponse.json({ event: updatedEvent })
  } catch (error: any) {
    console.error('PATCH event error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'événement' },
      { status: 500 }
    )
  }
})

// DELETE - Supprimer un événement
export const DELETE = withAdminAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const eventId = params.id

    // Vérifier si l'événement existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'événement a des inscriptions
    if (existingEvent._count.registrations > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer un événement avec des inscriptions',
          details: `Cet événement a ${existingEvent._count.registrations} inscription(s)`
        },
        { status: 400 }
      )
    }

    // Suppression de l'événement
    const deletedEvent = await prisma.event.delete({
      where: { id: eventId }
    })

    // Revalidation du cache
    revalidatePath('/admin/evenements')
    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)

    // Émettre un événement SSE
    emitAdminEventEvent('event:deleted', {
      id: deletedEvent.id,
      title: deletedEvent.title,
      slug: deletedEvent.slug,
      status: deletedEvent.status,
      category: deletedEvent.category,
      updatedAt: deletedEvent.updatedAt.toISOString()
    })

    // Logging de l'action
    await logAdminAction(
      user.id,
      'DELETE',
      'event',
      eventId,
      { title: deletedEvent.title }
    )

    return NextResponse.json({ 
      message: 'Événement supprimé avec succès',
      deletedEvent
    })
  } catch (error: any) {
    console.error('DELETE event error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'événement' },
      { status: 500 }
    )
  }
})
