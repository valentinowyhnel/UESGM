import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { z } from "zod"

const DocumentCategory = z.enum([
  'ADMINISTRATIF', 'ACADEMIQUE', 'JURIDIQUE', 'RAPPORT',
  'GUIDE', 'LIVRE', 'ARTICLE', 'STATUTS'
])

const DocumentVisibility = z.enum(['PUBLIC', 'MEMBERS_ONLY', 'ADMIN_ONLY'])

const DocumentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  category: DocumentCategory,
  visibility: DocumentVisibility.default('PUBLIC'),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileType: z.string().optional(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  submittedByEmail: z.string().email().optional().or(z.literal('')),
  submittedByName: z.string().optional().or(z.literal('')),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per = Math.min(50, Math.max(1, parseInt(searchParams.get('per') || '10')))
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const session = await getServerSession(authOptions)
    const userRole = session?.user?.role || 'PUBLIC'

    const where: any = {
      isPublished: true,
      OR: [
        { visibility: 'PUBLIC' },
        ...(userRole !== 'PUBLIC' ? [{ visibility: 'MEMBERS_ONLY' }] : []),
        ...(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' ? [{ visibility: 'ADMIN_ONLY' }] : [])
      ]
    }

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
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        }
      }),
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      data: documents,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per),
      },
    })
  } catch (error) {
    console.error('❌ GET /api/documents error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role)) {
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
        createdById: session.user.id,
        published: validated.published, // Alias field
        isPublished: validated.published,
        tags_list: validated.tags, // Alias field
        versions: {
          create: {
            fileUrl: validated.fileUrl,
            version: 1,
            changelog: 'Version initiale'
          }
        }
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.format() }, { status: 400 })
    }
    console.error('❌ POST /api/documents error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
