import { NextRequest, NextResponse } from 'next/server'
import { 
  withAdminAuth, 
  eventStatusSchema, 
  validateStatusTransition, 
  logAdminAction 
} from '@/lib/admin-events-security'

// Interface pour les événements (même définition que dans les autres routes)
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

// Mock data pour les événements (même données que dans les autres routes)
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

// Service pour gérer les événements (même logique que dans les autres routes)
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
  }
}

// PATCH - Changer le statut d'un événement
export const PATCH = withAdminAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const eventId = params.id
    const body = await req.json()

    // Validation des données
    const validation = eventStatusSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Statut invalide', 
          details: validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const { status } = validation.data

    // Vérifier si l'événement existe
    const existingEvent = eventService.getById(eventId)
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Valider la transition de statut
    if (!validateStatusTransition(existingEvent.status, status)) {
      return NextResponse.json(
        { 
          error: 'Transition de statut non autorisée',
          details: {
            current: existingEvent.status,
            requested: status,
            allowed: {
              'DRAFT': ['PUBLISHED', 'ARCHIVED'],
              'PUBLISHED': ['ARCHIVED'],
              'ARCHIVED': []
            }
          }
        },
        { status: 400 }
      )
    }

    // Validation supplémentaire pour la publication
    if (status === 'PUBLISHED') {
      const now = new Date()
      
      // Vérifier que la date de début est dans le futur
      if (existingEvent.startDate <= now) {
        return NextResponse.json(
          { 
            error: 'Impossible de publier un événement dont la date de début est passée',
            details: 'La date de début doit être dans le futur pour publier un événement'
          },
          { status: 400 }
        )
      }

      // Vérifier que tous les champs requis sont remplis
      if (!existingEvent.title || !existingEvent.description || !existingEvent.location) {
        return NextResponse.json(
          { 
            error: 'Informations incomplètes pour la publication',
            details: 'Titre, description et lieu sont requis pour publier un événement'
          },
          { status: 400 }
        )
      }
    }

    // Mise à jour du statut
    const updatedEvent = eventService.update(eventId, { status })
    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Logging de l'action
    await logAdminAction(
      user.id,
      'STATUS_CHANGE',
      'event',
      eventId,
      { 
        title: updatedEvent.title,
        oldStatus: existingEvent.status,
        newStatus: status
      }
    )

    // Messages spécifiques selon le statut
    let message = ''
    switch (status) {
      case 'PUBLISHED':
        message = 'Événement publié avec succès'
        break
      case 'ARCHIVED':
        message = 'Événement archivé avec succès'
        break
      case 'DRAFT':
        message = 'Événement remis en brouillon'
        break
    }

    return NextResponse.json({ 
      message,
      event: updatedEvent,
      statusChange: {
        from: existingEvent.status,
        to: status,
        changedAt: new Date()
      }
    })
  } catch (error: any) {
    console.error('PATCH event status error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de statut de l\'événement' },
      { status: 500 }
    )
  }
})
