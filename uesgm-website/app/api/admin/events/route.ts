import { NextRequest, NextResponse } from 'next/server'
import { 
  withAdminAuth, 
  logAdminAction, 
  checkRateLimit,
  validateEventDates 
} from '@/lib/admin-events-security'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Schéma de validation pour la création d'événement
const CreateEventSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  location: z.string().min(2, "Le lieu est requis"),
  category: z.enum(['INTEGRATION', 'ACADEMIC', 'SOCIAL', 'CULTURAL']),
  startDate: z.string().datetime("Date de début invalide"),
  endDate: z.string().datetime().optional(),
  maxAttendees: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  publishMode: z.enum(['NOW', 'SCHEDULED']),
  publishedAt: z.string().datetime().optional(),
  antenneIds: z.array(z.string()).optional()
})

// Schéma de validation pour la mise à jour
const UpdateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  location: z.string().min(2).optional(),
  category: z.enum(['INTEGRATION', 'ACADEMIC', 'SOCIAL', 'CULTURAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxAttendees: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional(),
  publishedAt: z.string().datetime().optional(),
  antenneIds: z.array(z.string()).optional()
})

// GET - Récupérer tous les événements avec pagination et filtres
export const GET = withAdminAuth(async (req: NextRequest, user) => {
  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(`events-list:${user.id}:${clientIP}`, 100, 60000)) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Construction de la clause WHERE
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { attendees: true }
          }
        },
        orderBy: [
          { status: 'asc' },
          { startDate: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.event.count({ where })
    ])

    // Logging de l'action
    await logAdminAction(
      user.id,
      'LIST',
      'events',
      'all',
      { filters: { status, category, search, page, limit }, resultCount: events.length }
    )

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    console.error('GET events error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des événements' },
      { status: 500 }
    )
  }
})

// POST - Créer un nouvel événement
export const POST = withAdminAuth(async (req: NextRequest, user) => {
  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(`events-create:${user.id}:${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Trop de créations d\'événements' },
        { status: 429 }
      )
    }

    const body = await req.json()
    
    // Validation des données
    const validation = CreateEventSchema.safeParse(body)
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

    const { title, description, location, category, startDate, endDate, maxAttendees, imageUrl, publishMode, publishedAt, antenneIds } = validation.data

    // Validation des dates
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : undefined
    if (!validateEventDates(start, end)) {
      return NextResponse.json(
        { error: 'Dates invalides' },
        { status: 400 }
      )
    }

    // Génération du slug unique
    let slug = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    // Vérifier si le slug existe déjà
    const existingSlug = await prisma.event.findFirst({
      where: { slug }
    })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Déterminer le statut et la date de publication
    let status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' = 'DRAFT'
    let finalPublishedAt: Date | null = null

    if (publishMode === 'NOW') {
      status = 'PUBLISHED'
      finalPublishedAt = new Date()
    } else if (publishMode === 'SCHEDULED' && publishedAt) {
      status = 'SCHEDULED'
      finalPublishedAt = new Date(publishedAt)
    }

    // Création de l'événement
    const newEvent = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        location,
        category,
        startDate: start,
        endDate: end,
        maxAttendees,
        imageUrl,
        status,
        publishedAt: finalPublishedAt,
        createdById: user.id,
        antennes: antenneIds && antenneIds.length > 0 ? {
          connect: antenneIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { attendees: true }
        }
      }
    })

    // Revalidation du cache pour mise à jour immédiate
    if (status === 'PUBLISHED') {
      revalidatePath('/events')
      revalidatePath('/admin/evenements')
    }

    // Logging de l'action
    await logAdminAction(
      user.id,
      'CREATE',
      'event',
      newEvent.id,
      { title, category, status, publishMode }
    )

    return NextResponse.json({ 
      success: true,
      event: newEvent,
      message: status === 'PUBLISHED' ? 'Événement créé et publié' : 'Événement créé en brouillon'
    }, { status: 201 })

  } catch (error: any) {
    console.error('POST event error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'événement' },
      { status: 500 }
    )
  }
})

// PUT - Mettre à jour un événement
export const PUT = withAdminAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('id')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'ID de l\'événement requis' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validation = UpdateEventSchema.safeParse(body)
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

    // Vérifier que l'événement existe
    const existingEvent = await prisma.event.findFirst({
      where: { 
        id: eventId,
        createdById: user.id 
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    const updates: any = {}
    const { title, description, location, category, startDate, endDate, maxAttendees, imageUrl, status: newStatus, publishedAt, antenneIds } = validation.data

    // Mise à jour des champs
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (location !== undefined) updates.location = location
    if (category !== undefined) updates.category = category
    if (startDate !== undefined) updates.startDate = new Date(startDate)
    if (endDate !== undefined) updates.endDate = new Date(endDate)
    if (maxAttendees !== undefined) updates.maxAttendees = maxAttendees
    if (imageUrl !== undefined) updates.imageUrl = imageUrl

    // Gestion du statut et de la publication
    if (newStatus) {
      updates.status = newStatus
      
      if (newStatus === 'PUBLISHED') {
        updates.publishedAt = new Date()
      } else if (newStatus === 'SCHEDULED' && publishedAt) {
        updates.publishedAt = new Date(publishedAt)
      }
    }

    // Mise à jour des antennes
    if (antenneIds !== undefined) {
      updates.antennes = {
        set: antenneIds.map(id => ({ id }))
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updates,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { attendees: true }
        }
      }
    })

    // Revalidation du cache si publication
    if (updates.status === 'PUBLISHED' || existingEvent.status !== 'PUBLISHED' && updates.status === 'PUBLISHED') {
      revalidatePath('/events')
      revalidatePath('/admin/evenements')
      revalidatePath(`/events/${eventId}`)
    }

    // Logging de l'action
    await logAdminAction(
      user.id,
      'UPDATE',
      'event',
      eventId,
      { updates: Object.keys(updates) }
    )

    return NextResponse.json({ 
      success: true,
      event: updatedEvent,
      message: 'Événement mis à jour avec succès'
    })

  } catch (error: any) {
    console.error('PUT event error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'événement' },
      { status: 500 }
    )
  }
})

// DELETE - Supprimer un événement
export const DELETE = withAdminAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('id')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'ID de l\'événement requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'événement existe et appartient à l'utilisateur
    const existingEvent = await prisma.event.findFirst({
      where: { 
        id: eventId,
        createdById: user.id 
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    await prisma.event.delete({
      where: { id: eventId }
    })

    // Revalidation du cache
    revalidatePath('/events')
    revalidatePath('/admin/evenements')
    revalidatePath(`/events/${eventId}`)

    // Logging de l'action
    await logAdminAction(
      user.id,
      'DELETE',
      'event',
      eventId,
      { title: existingEvent.title }
    )

    return NextResponse.json({ 
      success: true,
      message: 'Événement supprimé avec succès'
    })

  } catch (error: any) {
    console.error('DELETE event error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'événement' },
      { status: 500 }
    )
  }
})
