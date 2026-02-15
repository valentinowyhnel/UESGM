import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schéma de validation amélioré
const PartnerSchema = z.object({
  name: z.string().min(2).max(100),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  type: z.enum(['INSTITUTIONAL', 'PRIVATE']),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).default(0),
})

// GET - Liste des partenaires
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') as 'INSTITUTIONAL' | 'PRIVATE' | null
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per = Math.min(50, Math.max(1, parseInt(searchParams.get('per') || '10')))

    const where: any = {}
    if (type && ['INSTITUTIONAL', 'PRIVATE'].includes(type)) {
      where.type = type
    }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy: { order: 'asc' },
        skip: (page - 1) * per,
        take: per,
      }),
      prisma.partner.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: partners,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per),
        hasNext: page * per < total,
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/partners:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Ajouter un partenaire (admin uniquement)
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
    const partnerData = PartnerSchema.parse(body)

    const partner = await prisma.partner.create({
      data: partnerData,
    })

    return NextResponse.json(
      { success: true, data: partner },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur POST /api/partners:', error)
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

// PUT - Mise à jour d'un partenaire (admin uniquement)
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
        { error: 'ID du partenaire requis' },
        { status: 400 }
      )
    }

    const updateSchema = PartnerSchema.partial()
    const validatedData = updateSchema.parse(updateData)

    const partner = await prisma.partner.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(
      { success: true, data: partner },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/partners:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Partenaire non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Suppression d'un partenaire (admin uniquement)
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
        { error: 'ID du partenaire requis' },
        { status: 400 }
      )
    }

    await prisma.partner.delete({
      where: { id }
    })

    return NextResponse.json(
      { success: true, message: 'Partenaire supprimé avec succès' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/partners:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Partenaire non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}