import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-utils'
import { z } from 'zod'
import { hasRequiredRole } from '@/lib/auth/rbac'

const MemberSchema = z.object({
  name: z.string().min(2),
  position: z.string(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  bio: z.string().optional(),
  order: z.number().default(0),
})

export async function GET() {
  try {
    const members = await prisma.executiveMember.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !hasRequiredRole(session.user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = MemberSchema.parse(body)

    const member = await prisma.executiveMember.create({
      data
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }
}
