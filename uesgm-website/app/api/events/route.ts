import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import type { DefaultSession } from "next-auth"

// Enum types match prisma/client
const EventStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED'
} as const

const EventCategory = {
  INTEGRATION: 'INTEGRATION',
  ACADEMIC: 'ACADEMIC',
  SOCIAL: 'SOCIAL',
  CULTURAL: 'CULTURAL',
  SPORT: 'SPORT',
  OTHER: 'OTHER'
} as const

const CreateEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(5),
  location: z.string().min(3),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  category: z.nativeEnum(EventCategory),
  status: z.nativeEnum(EventStatus).default('DRAFT'),
  maxAttendees: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  published: z.boolean().default(false),
})

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  category: z.nativeEnum(EventCategory).optional(),
  search: z.string().optional(),
  status: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  admin: z.coerce.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse({
      page: searchParams.get('page'),
      per: searchParams.get('per'),
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status'),
      admin: searchParams.get('admin'),
    })

    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes((session.user as any).role)

    const where: any = {}
    
    if (!query.admin || !isAdmin) {
      where.published = true
      where.status = 'PUBLISHED'
    }

    if (query.status !== 'all') {
      const now = new Date()
      if (query.status === 'upcoming') {
        where.startDate = { gte: now }
      } else {
        where.startDate = { lt: now }
      }
    }

    if (query.category) where.category = query.category
    
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
          createdBy: { select: { name: true, email: true } },
          _count: { select: { registrations: true } }
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
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/events error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = CreateEventSchema.parse(body)
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

    const event = await prisma.event.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        slug,
        createdById: (session.user as any).id,
        publishedAt: data.published ? new Date() : null,
      }
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    console.error('❌ POST /api/events error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
