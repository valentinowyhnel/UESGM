import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Schéma de validation
const AntenneSchema = z.object({
  city: z.string().min(2).max(100),
  responsable: z.string().min(2).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
})

// GET - Liste des antennes
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per = Math.min(50, Math.max(1, parseInt(searchParams.get('per') || '10')))

    const where: any = {}
    if (search) {
      where.OR = [
        { city: { contains: search, mode: 'insensitive' } },
        { responsable: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [antennes, total] = await Promise.all([
      prisma.antenne.findMany({
        where,
        orderBy: { city: 'asc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          _count: {
            select: { 
              events: true
            }
          }
        }
      }),
      prisma.antenne.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: antennes,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per),
        hasNext: page * per < total,
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/antennes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer une antenne (admin uniquement)
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
    const antenneData = AntenneSchema.parse(body)

    const antenne = await prisma.antenne.create({
      data: antenneData,
      include: {
        _count: {
          select: { 
            events: true,
          }
        }
      }
    })

    return NextResponse.json(
      { success: true, data: antenne },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur POST /api/antennes:', error)
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

// PUT - Mettre à jour une antenne (admin uniquement)
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
    const validatedData = AntenneSchema.parse(updateData)

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'antenne requis' },
        { status: 400 }
      )
    }

    const antenne = await prisma.antenne.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { 
            events: true,
          }
        }
      }
    })

    return NextResponse.json(
      { success: true, data: antenne }
    )
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/antennes:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Antenne non trouvée' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une antenne (admin uniquement)
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
        { error: 'ID de l\'antenne requis' },
        { status: 400 }
      )
    }

    await prisma.antenne.delete({
      where: { id }
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Antenne supprimée avec succès'
      }
    )
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/antennes:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Antenne non trouvée' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
