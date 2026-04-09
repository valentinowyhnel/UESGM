import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import type { DefaultSession } from "next-auth"

const DocumentCategory = {
  ADMINISTRATIF: 'ADMINISTRATIF',
  ACADEMIQUE: 'ACADEMIQUE',
  JURIDIQUE: 'JURIDIQUE',
  RAPPORT: 'RAPPORT',
  GUIDE: 'GUIDE',
  LIVRE: 'LIVRE',
  ARTICLE: 'ARTICLE',
  STATUTS: 'STATUTS'
} as const

const DocumentVisibility = {
  PUBLIC: 'PUBLIC',
  MEMBERS_ONLY: 'MEMBERS_ONLY',
  ADMIN_ONLY: 'ADMIN_ONLY'
} as const

const DocumentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.nativeEnum(DocumentCategory),
  visibility: z.nativeEnum(DocumentVisibility).default('PUBLIC'),
  canDownload: z.boolean().default(true),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  fileType: z.string().optional().nullable(),
  published: z.boolean().default(false),
})

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  category: z.nativeEnum(DocumentCategory).optional(),
  search: z.string().optional(),
  admin: z.coerce.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes((session.user as any).role)

    const where: any = {}

    if (!query.admin || !isAdmin) {
      where.published = true
      where.visibility = 'PUBLIC'
    }

    if (query.category) where.category = query.category

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { some: { name: { contains: query.search, mode: 'insensitive' } } } }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.per,
        take: query.per,
        include: {
          createdBy: { select: { name: true, email: true } },
          tags: true
        }
      }),
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per),
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/documents error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = DocumentSchema.parse(body)
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()

    const document = await prisma.document.create({
      data: {
        ...data,
        slug,
        createdById: (session.user as any).id,
      }
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    console.error('❌ POST /api/documents error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
