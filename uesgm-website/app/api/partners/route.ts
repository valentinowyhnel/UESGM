import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const

function hasRole(session: any, allowedRoles: string[]) {
  return session?.user?.role && allowedRoles.includes(session.user.role)
}

const PartnerSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  type: z.string(),
  description: z.string().optional(),
  contact: z.string().optional(),
  order: z.number().int().min(0).default(0),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const per = Math.min(50, Math.max(1, Number(searchParams.get('per')) || 10))

    const where: any = { isActive: true }
    if (type) where.type = type

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
    const validated = PartnerSchema.parse(body)

    const partner = await prisma.partner.create({
      data: validated
    })

    return NextResponse.json({ success: true, data: partner }, { status: 201 })
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

    const validated = PartnerSchema.partial().parse(data)
    const partner = await prisma.partner.update({
      where: { id },
      data: validated
    })

    return NextResponse.json({ success: true, data: partner })
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

    await prisma.partner.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Partenaire supprimé' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
