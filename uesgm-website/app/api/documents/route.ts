import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-utils'
import { z } from 'zod'
import { hasRequiredRole } from '@/lib/auth/rbac'

const DocumentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().optional(),
  published: z.boolean().default(false),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const publishedOnly = searchParams.get('published') !== 'false'

  try {
    const documents = await prisma.document.findMany({
      where: {
        ...(publishedOnly ? { published: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(documents)
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
    const data = DocumentSchema.parse(body)

    const document = await prisma.document.create({
      data: {
        ...data,
        userId: session.user.id,
        submittedByName: session.user.name,
        submittedByEmail: session.user.email,
      }
    })
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }
}
