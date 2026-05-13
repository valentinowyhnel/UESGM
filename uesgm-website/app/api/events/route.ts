import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createEventSchema, updateEventSchema, eventFilterSchema } from "@/lib/validation-schemas"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/events - List events with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validation = eventFilterSchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json({ error: "Paramètres invalides", details: validation.error.format() }, { status: 400 })
    }
    
    const { page, limit, category, status, search } = validation.data
    const skip = (page - 1) * limit

    const where: any = {
      published: true // Public endpoint only shows published events by default
    }
    
    if (category) where.category = category
    if (status) where.status = status
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
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          createdBy: {
            select: { name: true, image: true }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    return NextResponse.json({
      events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/events - Create new event (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const result = createEventSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.format() }, { status: 400 })
    }
    
    const data = result.data
    const slug = data.slug || data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    
    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        location: data.location,
        startDate: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        category: data.category as any,
        imageUrl: data.imageUrl,
        maxAttendees: data.maxParticipants,
        published: data.isPublished,
        status: data.isPublished ? 'PUBLISHED' : 'DRAFT',
        createdById: session.user.id
      }
    })
    
    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    console.error("Error creating event:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Un événement avec ce slug existe déjà" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
