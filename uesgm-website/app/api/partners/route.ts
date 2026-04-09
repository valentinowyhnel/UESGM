import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const PartnerType = {
  INSTITUTIONAL: 'INSTITUTIONAL',
  PRIVATE: 'PRIVATE',
  ASSOCIATION: 'ASSOCIATION'
} as const

const PartnerSchema = z.object({
  name: z.string().min(2).max(100),
  logo: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  type: z.nativeEnum(PartnerType),
  description: z.string().max(1000).optional().nullable(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  type: z.nativeEnum(PartnerType).optional(),
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
      where.isActive = true
    }
    if (query.type) where.type = query.type

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy: { order: 'asc' },
        skip: (query.page - 1) * query.per,
        take: query.per,
      }),
      prisma.partner.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: partners,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per),
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/partners error:', error)
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
    const data = PartnerSchema.parse(body)

    const partner = await prisma.partner.create({ data })

    return NextResponse.json({ success: true, data: partner }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    console.error('❌ POST /api/partners error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
