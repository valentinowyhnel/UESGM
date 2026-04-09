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

const DocumentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().int().positive().optional(),
  published: z.boolean().default(false),
  submittedByEmail: z.string().email().optional(),
  submittedByName: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const per = Math.min(50, Math.max(1, Number(searchParams.get('per')) || 10))
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const publishedOnly = searchParams.get('published') !== 'false'

    const where: any = {}
    if (publishedOnly) where.published = true
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
      }),
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per),
        hasNext: page * per < total,
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/documents:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const validated = DocumentSchema.parse(body)

    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const document = await prisma.document.create({
      data: {
        ...validated,
        slug,
        createdById: (session as any).user.id,
      }
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
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
    if (!hasRole(session, [Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR])) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const validated = DocumentSchema.partial().parse(data)
    const document = await prisma.document.update({
      where: { id },
      data: validated
    })

    return NextResponse.json({ success: true, data: document })
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

    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Document supprimé' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
