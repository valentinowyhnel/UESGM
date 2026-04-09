import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import { z } from "zod"

const ExecutiveMemberSchema = z.object({
  name: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
})

export async function GET(req: NextRequest) {
  try {
    const members = await prisma.executiveMember.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('❌ GET /api/executive-members error:', error)
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
    const validated = ExecutiveMemberSchema.parse(body)

    const member = await prisma.executiveMember.create({
      data: {
        ...validated,
        photo: validated.photoUrl // Alias field
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.format() }, { status: 400 })
    }
    console.error('❌ POST /api/executive-members error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
