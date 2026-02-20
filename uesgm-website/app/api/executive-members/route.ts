import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schéma de validation amélioré
const ExecutiveMemberSchema = z.object({
  name: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  photo: z.string().url().optional(),
  order: z.number().int().min(0).default(0),
})

// GET - Liste des membres du bureau exécutif
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const published = searchParams.get('published') !== 'false'

    const members = await prisma.executiveMember.findMany({
      where: published ? {} : {}, // Tous les membres pour l'admin
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: members,
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/executive-members:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Ajouter un membre (admin uniquement)
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
    const memberData = ExecutiveMemberSchema.parse(body)

    const member = await prisma.executiveMember.create({
      data: memberData,
    })

    return NextResponse.json(
      { success: true, data: member },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur POST /api/executive-members:', error)
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

// PUT - Mettre à jour un membre (admin uniquement)
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
        { error: 'ID du membre requis' },
        { status: 400 }
      )
    }

    const updateSchema = ExecutiveMemberSchema.partial()
    const validatedData = updateSchema.parse(updateData)

    const member = await prisma.executiveMember.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(
      { success: true, data: member }
    )
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/executive-members:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Membre non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un membre (admin uniquement)
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
        { error: 'ID du membre requis' },
        { status: 400 }
      )
    }

    await prisma.executiveMember.delete({
      where: { id }
    })

    return NextResponse.json(
      { success: true, message: 'Membre supprimé avec succès' }
    )
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/executive-members:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Membre non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
