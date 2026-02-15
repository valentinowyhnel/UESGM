import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, validateAdminData, logAdminAction } from '@/lib/admin-security'
import { prisma } from '@/lib/prisma'

// PUT - Mettre à jour un projet
export const PUT = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const projectId = params.id
    const body = await req.json()
    const user = (req as any).user

    // Vérifier si le projet existe
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    // Validation des données
    const validation = validateAdminData(body, 'project')
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }

    // Mise à jour du projet
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        updatedAt: new Date()
      }
    })

    // Log de l'action
    await logAdminAction(
      user.id,
      'update',
      'project',
      projectId,
      { 
        oldData: existingProject,
        newData: body
      }
    )

    return NextResponse.json({ project: updatedProject })
  } catch (error: any) {
    console.error('PUT project error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un projet avec ce titre existe déjà' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du projet' },
      { status: 500 }
    )
  }
})

// DELETE - Supprimer un projet (super admin uniquement)
export const DELETE = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const projectId = params.id
    const user = (req as any).user

    // Vérifier si l'utilisateur est super admin
    if ((user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Seul un super administrateur peut supprimer un projet' },
        { status: 403 }
      )
    }

    // Vérifier si le projet existe
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    // Suppression du projet
    await prisma.project.delete({
      where: { id: projectId }
    })

    // Log de l'action
    await logAdminAction(
      user.id,
      'delete',
      'project',
      projectId,
      { 
        deletedProject: existingProject
      }
    )

    return NextResponse.json({ 
      message: 'Projet supprimé avec succès',
      deletedProject: existingProject
    })
  } catch (error: any) {
    console.error('DELETE project error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du projet' },
      { status: 500 }
    )
  }
})
