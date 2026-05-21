import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-utils'
import { z } from 'zod'
import { hasRequiredRole } from '@/lib/auth/rbac'

const PartnerSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  logoUrl: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contact: z.string().optional(),
})

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(partners)
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
    const data = PartnerSchema.parse(body)

    const partner = await prisma.partner.create({
      data
    })
    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }
}
