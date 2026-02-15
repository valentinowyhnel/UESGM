import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, validateAdminData, logAdminAction } from '@/lib/admin-security'
import { prisma } from '@/lib/prisma'

// GET - Récupérer tous les projets
export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('GET projects error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    )
  }
})

// POST - Créer un nouveau projet
export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const user = (req as any).user

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
        shortDesc: body.shortDesc || body.description.substring(0, 200), // Utiliser les 200 premiers caractères de la description si non fourni
        category: body.category,
        status: body.status || 'PLANNED',
        progress: body.progress || 0,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
