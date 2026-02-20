import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schéma de validation amélioré
const ProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(5).max(5000),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'PLANNED']),
  category: z.enum(['ACADEMIC', 'CULTURAL', 'SOCIAL', 'SPORT', 'OTHER']),
  city: z.string().max(100).optional(),
  image: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  coverColor: z.string().max(20).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isFeatured: z.boolean().default(false),
  published: z.boolean().default(false),
  year: z.number().int().min(2000).max(2030).optional(),
  gallery: z.array(z.string().url()).optional(),
  tools: z.array(z.string()).optional(),
  team: z.any().optional(),
  timeline: z.any().optional(),
  partners: z.any().optional(),
  submittedByEmail: z.string().email().max(255).optional(),
  submittedByName: z.string().max(100).optional(),
})

const ProjectQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'PLANNED', 'all']).default('all'),
  category: z.string().optional(),
  city: z.string().optional(),
  featured: z.enum(['true', 'false', 'all']).default('all'),
  published: z.enum(['true', 'false', 'all']).default('all'),
  search: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2030).optional(),
})

// GET - Liste des projets
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = ProjectQuerySchema.parse(Object.fromEntries(searchParams))

    const where: any = {}
    
    // Filtres
    if (query.status !== 'all') where.status = query.status
    if (query.category) where.category = query.category
    if (query.city) where.city = query.city
    if (query.year) where.year = query.year
    
    if (query.featured !== 'all') {
      where.isFeatured = query.featured === 'true'
    }
    
    if (query.published !== 'all') {
      where.published = query.published === 'true'
    }
    
    // Recherche textuelle
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: [
          { isPublished: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (query.page - 1) * query.per,
        take: query.per,
        include: {
          _count: {
            select: { auditLogs: true }
          }
        }
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per),
        hasNext: query.page * query.per < total,
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/projects:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un projet (admin uniquement)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const projectData = ProjectSchema.parse(body)

    // Générer un slug unique
    const slug = projectData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const project = await prisma.project.create({
      data: {
        ...projectData,
        category: projectData.category as any, // Conversion du type pour correspondre à ProjectCategory
        slug,
        shortDesc: projectData.description.substring(0, 200), // Utilise les 200 premiers caractères de la description
        createdBy: {
          connect: { id: (session.user as any).id }
        },
        startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
        endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
      },
      include: {
        _count: {
          select: { auditLogs: true }
        }
      }
    })

    // Créer un log d'audit avec un ID unique
    await prisma.projectAuditLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: project.id,
        action: 'CREATED',
        actorId: (session.user as any).id,
        actorEmail: session.user.email || '',
        snapshot: project,
      }
    })

    return NextResponse.json(
      { success: true, data: project },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur POST /api/projects:', error)
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

// PUT - Mise à jour d'un projet (admin uniquement)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du projet requis' },
        { status: 400 }
      )
    }

    const updateSchema = ProjectSchema.partial()
    const validatedData = updateSchema.parse(updateData)

    // Préparer les données de mise à jour
    const updatePayload: any = { ...validatedData };
    
    // Convertir la catégorie si elle est présente
    if (updatePayload.category) {
      updatePayload.category = updatePayload.category as any;
    }
    
    // Gérer les dates
    if (updatePayload.startDate) {
      updatePayload.startDate = new Date(updatePayload.startDate);
    }
    if (updatePayload.endDate) {
      updatePayload.endDate = new Date(updatePayload.endDate);
    }

    const project = await prisma.project.update({
      where: { id },
      data: updatePayload,
      include: {
        _count: {
          select: { auditLogs: true }
        }
      }
    })

    // Créer un log d'audit avec un ID unique
    await prisma.projectAuditLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: project.id,
        action: 'UPDATED',
        actorId: (session.user as any).id,
        actorEmail: session.user.email || '',
        snapshot: project,
      }
    })

    return NextResponse.json(
      { success: true, data: project },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/projects:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Suppression d'un projet (admin uniquement)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
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
        { error: 'ID du projet requis' },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json(
      { success: true, message: 'Projet supprimé avec succès' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/projects:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}