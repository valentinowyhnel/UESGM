import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { z } from "zod"

const PartnerSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  type: z.enum(['INSTITUTIONAL', 'PRIVATE', 'ASSOCIATION']),
  contact: z.string().optional(),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per = Math.min(50, Math.max(1, parseInt(searchParams.get('per') || '10')))

    const where: any = { isActive: true }
    if (type) {
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
      data: partners,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per)
      },
    })
  } catch (error) {
    console.error('❌ GET /api/partners error:', error)
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
    const validated = PartnerSchema.parse(body)

    const partner = await prisma.partner.create({
      data: {
        ...validated,
        logo: validated.logoUrl // Alias field
      },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.format() }, { status: 400 })
    }
    console.error('❌ POST /api/partners error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
