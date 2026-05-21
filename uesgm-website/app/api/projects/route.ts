import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-utils'
import { z } from 'zod'
import { hasRequiredRole } from '@/lib/auth/rbac'

const ProjectSchema = z.object({
  title: z.string().min(3),
  summary: z.string().optional(),
  category: z.string().optional(),
  status: z.string(),
  progress: z.number().min(0).max(100).default(0),
})

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
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
    const data = ProjectSchema.parse(body)
    const slug = data.title.toLowerCase().replace(/ /g, '-') + '-' + Date.now()

    const project = await prisma.project.create({
      data: { ...data, slug }
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }
}
