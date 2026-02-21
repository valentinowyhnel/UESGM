import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schéma de validation pour la mise à jour
const UpdateEventSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(5).max(2000).optional(),
  date: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  category: z.enum(['INTEGRATION', 'ACADEMIC', 'SOCIAL', 'CULTURAL', 'SPORT', 'OTHER']).optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  published: z.boolean().optional(),
  antenneIds: z.array(z.string()).optional(),
})

// GET - Récupérer un événement par ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        antennes: {
          include: {
            antenne: { select: { id: true, city: true, name: true } }
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est admin pour voir les événements non publiés
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    const isAdmin = session && userRole && ['ADMIN', 'SUPER_ADMIN'].includes(userRole)

    // Vérifier si l'événement est accessible:
    // - Publié (status = PUBLISHED)
    // - Programmée dont la date de publication est passée
    // - Ou admin
    const now = new Date()
    const isPublished = event.status === 'PUBLISHED' || 
      (event.status === 'SCHEDULED' && event.publishedAt && event.publishedAt <= now)
    
    if (!isPublished && !isAdmin) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/events/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un événement (admin uniquement)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { antenneIds, date, ...updateData } = UpdateEventSchema.parse(body)

    // Préparer les données de mise à jour
    const updatePayload: any = { ...updateData }
    
    // Ajouter startDate si date est fournie
    if (date) {
      updatePayload.startDate = new Date(date)
    }

    // Gérer la relation many-to-many avec les antennes
    if (antenneIds) {
      updatePayload.antennes = {
        set: antenneIds.map((antenneId: string) => ({ id: antenneId }))
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: updatePayload,
      include: {
        antennes: {
          include: {
            antenne: { select: { id: true, city: true, name: true } }
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json(
      { success: true, data: event },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/events/[id]:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un événement (admin uniquement)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params

    await prisma.event.delete({
      where: { id }
    })

    return NextResponse.json(
      { success: true, message: 'Événement supprimé avec succès' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/events/[id]:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Suspendre/Activer un événement (admin uniquement)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { published } = z.object({ published: z.boolean() }).parse(body)

    const event = await prisma.event.update({
      where: { id },
      data: { publishedAt: published ? new Date() : null },
      include: {
        antennes: {
          include: {
            antenne: { select: { id: true, city: true, name: true } }
          }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        data: event,
        message: published ? 'Événement publié' : 'Événement suspendu'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur PATCH /api/events/[id]:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
