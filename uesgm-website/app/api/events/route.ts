import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import type { DefaultSession } from "next-auth"

// Définition locale des rôles utilisateur
const UserRole = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  MEMBER: 'MEMBER'
} as const

// Définition des enums pour les statuts et catégories d'événements
const EventStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  SCHEDULED: 'SCHEDULED'
} as const

type EventStatus = typeof EventStatus[keyof typeof EventStatus]

const EventCategory = {
  INTEGRATION: 'INTEGRATION',
  ACADEMIC: 'ACADEMIC',
  SOCIAL: 'SOCIAL',
  CULTURAL: 'CULTURAL'
} as const

type EventCategory = typeof EventCategory[keyof typeof EventCategory]

// Schema for creating/updating events
const CreateEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(5),
  location: z.string().min(3),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  category: z.nativeEnum(EventCategory).optional(),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  maxAttendees: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  antenneId: z.string().optional(),
})

// Interface pour les événements publics
type PublicEvent = {
  id: string
  title: string
  slug: string
  description: string
  location: string
  imageUrl: string | null
  category: EventCategory
  status: EventStatus
  startDate: Date
  endDate: Date | null
  maxAttendees: number | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  _count?: {
    attendees: number
  }
}

// Schéma de validation pour les requêtes publiques
const PublicEventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  category: z.nativeEnum(EventCategory).optional(),
  search: z.string().optional(),
  status: z.enum(['upcoming', 'past', 'all']).default('upcoming')
})

// Type pour l'utilisateur authentifié
type AuthenticatedUser = {
  id: string
  email: string
  name: string
  role: keyof typeof UserRole
}

// Les types d'authentification sont définis dans types/next-auth.d.ts

// GET - Récupérer les événements
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = PublicEventQuerySchema.parse({
      page: Number(searchParams.get('page')) || 1,
      per: Number(searchParams.get('per')) || 10,
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      status: searchParams.get('status') || 'upcoming',
    })

    const where: any = {
      status: EventStatus.PUBLISHED, // Uniquement les événements publiés
    }
    
    // Filtre par statut
    if (query.status !== 'all') {
      const now = new Date()
      if (query.status === 'upcoming') {
        where.startDate = { gte: now }
      } else if (query.status === 'past') {
        where.startDate = { lt: now }
      }
    }
    
    // Filtres additionnels
    if (query.category) where.category = query.category
    
    // Recherche textuelle
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: query.status === 'past' ? 'desc' : 'asc' },
        skip: (query.page - 1) * query.per,
        take: query.per,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: { registrations: true }
          }
        }
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per),
        hasNext: query.page * query.per < total,
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/events:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Création d'événement (admin uniquement)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as (DefaultSession & { user: AuthenticatedUser }) | null
    const userRole = session?.user?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const eventData = CreateEventSchema.parse(body)

    // Générer un slug unique
    const slug = eventData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startDate: new Date(eventData.startDate),
        endDate: eventData.endDate ? new Date(eventData.endDate) : null,
        category: eventData.category || EventCategory.INTEGRATION,
        status: eventData.status,
        maxAttendees: eventData.maxAttendees,
        imageUrl: eventData.imageUrl || null,
        slug,
        createdById: session.user.id,
        publishedAt: eventData.status === EventStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json(
      { success: true, data: event },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur POST /api/events:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mise à jour d'un événement (admin uniquement)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as (DefaultSession & { user: AuthenticatedUser }) | null
    const userRole = session?.user?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, ...updateFields } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'événement requis' },
        { status: 400 }
      )
    }

    const updateSchema = CreateEventSchema.partial()
    const validatedData = updateSchema.parse(updateFields)

    // Préparer les données de mise à jour
    const updateData: any = { ...validatedData }
    
    // Convertir les dates si elles sont présentes
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate)
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate)
    
    // Si l'événement est publié, définir publishedAt
    if (updateData.status === 'PUBLISHED' && !updateData.publishedAt) {
      updateData.publishedAt = new Date()
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json(
      { success: true, data: event },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/events:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Suppression d'un événement (admin uniquement)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as (DefaultSession & { user: AuthenticatedUser }) | null
    const userRole = session?.user?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'événement requis' },
        { status: 400 }
      )
    }

    await prisma.event.delete({
      where: { id }
    })

    return NextResponse.json(
      { success: true, message: 'Événement supprimé avec succès' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/events:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}