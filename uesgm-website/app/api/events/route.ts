import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth/auth-options"

// Schémas de validation
const EventStatus = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED', 'CANCELLED'])
const EventCategory = z.enum(['INTEGRATION', 'ACADEMIC', 'SOCIAL', 'CULTURAL', 'SPORT', 'OTHER'])

const CreateEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(5),
  location: z.string().min(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  category: EventCategory.default('OTHER'),
  status: EventStatus.default('DRAFT'),
  maxAttendees: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  category: EventCategory.optional(),
  search: z.string().optional(),
  status: z.enum(['upcoming', 'past', 'all']).default('upcoming')
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    const now = new Date()
    const where: any = {
      isPublished: true, // Ou status: 'PUBLISHED'
    }

    if (query.status === 'upcoming') {
      where.startDate = { gte: now }
    } else if (query.status === 'past') {
      where.startDate = { lt: now }
    }

    if (query.category) {
      where.category = query.category
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: query.status === 'past' ? 'desc' : 'asc' },
        skip: (query.page - 1) * query.per,
        take: query.per,
        include: {
          _count: {
            select: { registrations: true }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    return NextResponse.json({
      data: events,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per)
      }
    })
  } catch (error) {
    console.error("❌ GET /api/events error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const validated = CreateEventSchema.parse(body)

    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const event = await prisma.event.create({
      data: {
        ...validated,
        slug,
        createdById: session.user.id,
        published: validated.status === 'PUBLISHED',
        isPast: validated.startDate < new Date(),
        date: validated.startDate // Alias field
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.format() }, { status: 400 })
    }
    console.error("❌ POST /api/events error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
