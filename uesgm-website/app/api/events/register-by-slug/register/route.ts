import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schéma de validation pour l'inscription
const EventRegistrationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z.string().email('Adresse email invalide'),
  eventId: z.string().min(1, 'ID de l\'événement requis')
})

// Mock data pour les inscriptions (remplacera par Prisma plus tard)
let mockRegistrations: any[] = [
  {
    id: 'reg-1',
    eventId: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'reg-2',
    eventId: '1',
    name: 'Marie Curie',
    email: 'marie.curie@email.com',
    createdAt: '2024-01-21T14:30:00Z'
  }
]

// Mock data pour les événements (même données que dans les autres routes)
const mockEvents = [
  {
    id: '1',
    title: 'Journée d\'Intégration UESGM 2024',
    slug: 'journee-integration-uesgm-2024',
    status: 'PUBLISHED',
    maxAttendees: 150,
    startDate: '2024-03-15T09:00:00Z',
    location: 'Université Omar Bongo, Libreville'
  },
  {
    id: '2',
    title: 'Conférence sur les Sciences Médicales',
    slug: 'conference-sciences-medicales',
    status: 'PUBLISHED',
    maxAttendees: 200,
    startDate: '2024-02-20T14:00:00Z',
    location: 'Faculté de Médecine, Libreville'
  }
]

// Service pour les inscriptions
const registrationService = {
  getByEventId: (eventId: string) => {
    return mockRegistrations.filter(reg => reg.eventId === eventId)
  },

  add: (registration: any) => {
    const newRegistration = {
      id: `reg-${Date.now()}`,
      ...registration,
      createdAt: new Date().toISOString()
    }
    mockRegistrations.push(newRegistration)
    return newRegistration
  },

  checkEmailExists: (eventId: string, email: string) => {
    return mockRegistrations.some(reg => reg.eventId === eventId && reg.email === email)
  }
}

// POST - S'inscrire à un événement
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug

    // Trouver l'événement par slug
    const event = mockEvents.find(e => e.slug === slug && e.status === 'PUBLISHED')
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé ou non publié' },
        { status: 404 }
      )
    }

    // Vérifier si l'événement est dans le futur
    const eventDate = new Date(event.startDate)
    if (eventDate <= new Date()) {
      return NextResponse.json(
        { error: 'Impossible de s\'inscrire à un événement passé' },
        { status: 400 }
      )
    }

    // Vérifier si l'événement a atteint sa capacité maximale
    const currentRegistrations = registrationService.getByEventId(event.id)
    if (event.maxAttendees && currentRegistrations.length >= event.maxAttendees) {
      return NextResponse.json(
        { error: 'L\'événement a atteint sa capacité maximale' },
        { status: 400 }
      )
    }

    const body = await req.json()
    
    // Validation des données
    const validation = EventRegistrationSchema.safeParse({
      ...body,
      eventId: event.id
    })
    
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

    const { name, email } = validation.data

    // Vérifier si l'email est déjà inscrit
    if (registrationService.checkEmailExists(event.id, email)) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cet événement' },
        { status: 409 }
      )
    }

    // Créer l'inscription
    const registration = registrationService.add({
      name,
      email,
      eventId: event.id
    })

    console.log(`✅ Nouvelle inscription: ${name} (${email}) pour l'événement ${event.title}`)

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie',
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        eventId: registration.eventId,
        createdAt: registration.createdAt
      },
      event: {
        title: event.title,
        startDate: event.startDate,
        location: event.location
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur POST /api/events/[slug]/register:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'inscription' },
      { status: 500 }
    )
  }
}

// GET - Récupérer les inscriptions pour un événement (admin uniquement)
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug

    // Trouver l'événement par slug
    const event = mockEvents.find(e => e.slug === slug)
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les inscriptions
    const registrations = registrationService.getByEventId(event.id)

    return NextResponse.json({
      success: true,
      data: registrations,
      count: registrations.length,
      maxAttendees: event.maxAttendees,
      available: event.maxAttendees ? event.maxAttendees - registrations.length : null
    })

  } catch (error: any) {
    console.error('❌ Erreur GET /api/events/[slug]/register:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
