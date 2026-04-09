import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Roles consistent with prisma schema
const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER',
  PUBLIC: 'PUBLIC'
} as const

// Helper to check roles
function hasRole(session: any, allowedRoles: string[]) {
  return session?.user?.role && allowedRoles.includes(session.user.role)
}

// Schema for creating/updating events
const EventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string().or(z.date()),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isPast: z.boolean().default(false),
  published: z.boolean().default(false),
})

// GET - List events with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const per = Math.min(50, Math.max(1, Number(searchParams.get('per')) || 10))
    const category = searchParams.get('category')
    const status = searchParams.get('status') // upcoming, past, all
    const search = searchParams.get('search')
    const publishedOnly = searchParams.get('published') !== 'false'

    const where: any = {}
    
    if (publishedOnly) {
      where.published = true
    }
    
    if (category) {
      where.category = category
    }

    if (status === 'upcoming') {
      where.date = { gte: new Date() }
    } else if (status === 'past') {
      where.date = { lt: new Date() }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          _count: {
            select: { attendees: true }
          }
        }
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per),
        hasNext: page * per < total,
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/events:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Create event (Admin+)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const validated = EventSchema.parse(body)

    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const event = await prisma.event.create({
      data: {
        ...validated,
        date: new Date(validated.date),
        slug,
        createdById: (session as any).user.id,
      }
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erreur POST /api/events:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Update event (Admin+)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const validated = EventSchema.partial().parse(data)
    
    const updateData: any = { ...validated }
    if (validated.date) updateData.date = new Date(validated.date)

    const event = await prisma.event.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: event })
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/events:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Delete event (Admin+)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Événement supprimé' })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/events:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
