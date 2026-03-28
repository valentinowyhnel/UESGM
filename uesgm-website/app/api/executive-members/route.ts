import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
} as const

function hasRole(session: any, allowedRoles: string[]) {
  return session?.user?.role && allowedRoles.includes(session.user.role)
}

const ExecutiveMemberSchema = z.object({
  name: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  photoUrl: z.string().url().optional(),
  bio: z.string().optional(),
  order: z.number().int().min(0).default(0),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const publishedOnly = searchParams.get('published') !== 'false'

    const where: any = {}
    if (publishedOnly) where.isActive = true

    const members = await prisma.executiveMember.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: members,
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/executive-members:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const validated = ExecutiveMemberSchema.parse(body)

    const member = await prisma.executiveMember.create({
      data: validated
    })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const validated = ExecutiveMemberSchema.partial().parse(data)
    const member = await prisma.executiveMember.update({
      where: { id },
      data: validated
    })

    return NextResponse.json({ success: true, data: member })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    await prisma.executiveMember.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Membre supprimé' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
