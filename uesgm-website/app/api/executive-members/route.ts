import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const ExecutiveMemberSchema = z.object({
  name: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  photo: z.string().url().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

const QuerySchema = z.object({
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

    const members = await prisma.executiveMember.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: members,
    })
  } catch (error: any) {
    console.error('❌ GET /api/executive-members error:', error)
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
    const data = ExecutiveMemberSchema.parse(body)

    const member = await prisma.executiveMember.create({ data })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    console.error('❌ POST /api/executive-members error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
