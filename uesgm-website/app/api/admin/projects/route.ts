import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, validateAdminData, logAdminAction, sanitizeInput } from '@/lib/admin-security'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// GET - Récupérer tous les projets avec pagination
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    // Sanitize search inputs
    const search = sanitizeInput(searchParams.get('search') || '')
    const status = sanitizeInput(searchParams.get('status') || '')
    const category = sanitizeInput(searchParams.get('category') || '')

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (status) where.status = status
    if (category) where.category = category

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          tags: true
        }
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('GET projects error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    )
  }
})

// Mapping des catégories depuis les valeurs françaises vers les valeurs enum
const projectCategoryLabelToEnum: Record<string, string> = {
  'education': 'EDUCATION',
  'éducation': 'EDUCATION',
  'santé': 'HEALTH',
  'sante': 'HEALTH',
  'health': 'HEALTH',
  'social': 'SOCIAL',
  'digital': 'DIGITAL',
  'technologie': 'DIGITAL',
  'partnership': 'PARTNERSHIP',
  'partenariat': 'PARTNERSHIP',
  'environment': 'ENVIRONMENT',
  'environnement': 'ENVIRONMENT',
  'culture': 'CULTURE',
  'infrastructure': 'INFRASTRUCTURE',
  'sport': 'SPORT',
}

function normalizeProjectCategory(value: string | undefined): string {
  if (!value) return 'EDUCATION'
  // Normaliser les accents et convertir en minuscule
  const normalized = value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .trim()
  return projectCategoryLabelToEnum[normalized] || value.toUpperCase()
}

// POST - Créer un nouveau projet
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const user = (req as any).user

    // Normaliser la catégorie AVANT sanitization (pour préserver les accents français)
    body.category = normalizeProjectCategory(body.category)

    // Sanitize inputs textuels après normalisation
    body.title = sanitizeInput(body.title)
    body.description = sanitizeInput(body.description)
    body.shortDesc = sanitizeInput(body.shortDesc || '')

    // Validation des données
    const validation = validateAdminData(body, 'project')
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }

    // Création du projet
    const project = await prisma.project.create({
      data: {
        title: body.title,
        description: body.description,
        shortDesc: body.shortDesc || body.description.substring(0, 200),
        category: body.category,
        status: body.status || 'PLANNED',
        progress: body.progress || 0,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isPublished: body.isPublished || false,
        imageUrl: body.imageUrl || null,
        createdById: user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Log de l'action
    await logAdminAction(
      user.id,
      'create',
      'project',
      project.id,
      { title: project.title, category: project.category }
    )

    // Revalidation du cache - toujours rafraichir les pages admin
    revalidatePath('/admin/projets')
    if (body.isPublished === true) {
      revalidatePath('/projets')
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    console.error('POST project error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un projet avec ce titre existe déjà' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du projet' },
      { status: 500 }
    )
  }
})
