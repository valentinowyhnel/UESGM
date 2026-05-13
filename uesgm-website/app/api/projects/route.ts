import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createProjectSchema, projectFilterSchema } from "@/lib/validation-schemas"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/projects - List projects with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validation = projectFilterSchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json({ error: "Paramètres invalides", details: validation.error.format() }, { status: 400 })
    }
    
    const { page, limit, category, status, search } = validation.data
    const skip = (page - 1) * limit

    const where: any = {
      isPublished: true
    }
    
    if (category) where.category = category as any
    if (status) where.status = status as any
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true, image: true }
          },
          tags: true
        }
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/projects - Create new project (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const result = createProjectSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.format() }, { status: 400 })
    }
    
    const data = result.data
    const slug = data.slug || data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    
    const project = await prisma.project.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        shortDesc: data.shortDesc || "",
        category: data.category as any,
        status: data.status as any,
        progress: data.progress,
        imageUrl: data.imageUrl,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isPublished: data.isPublished,
        published: data.isPublished,
        createdById: session.user.id
      }
    })
    
    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    console.error("Error creating project:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Un projet avec ce slug existe déjà" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
