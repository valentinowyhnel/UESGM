import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Document schema
const DocumentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['STATUTS', 'RAPPORT', 'GUIDE', 'LIVRE', 'ARTICLE', 'ACADEMIQUE', 'JURIDIQUE', 'ADMINISTRATIF']),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'ADMIN_ONLY']).default('PUBLIC'),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
  submittedByEmail: z.string().email().max(255).optional().or(z.literal('')),
  submittedByName: z.string().max(100).optional().or(z.literal('')),
  antenneIds: z.array(z.string()).optional(),
  changelog: z.string().optional(),
});

const DocumentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  category: z.string().optional(),
  visibility: z.string().optional(),
  isPublished: z.enum(['true', 'false', 'all']).default('all'),
  search: z.string().optional(),
});

// GET - Liste des documents
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = DocumentQuerySchema.parse(Object.fromEntries(searchParams))

    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    const isAdmin = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)

    const where: any = {}

    // Filtres de visibilité pour les utilisateurs non-admin
    if (!isAdmin) {
      where.isPublished = true
      if (session) {
        where.visibility = { in: ['PUBLIC', 'MEMBERS_ONLY'] }
      } else {
        where.visibility = 'PUBLIC'
      }
    } else {
      if (query.isPublished !== 'all') {
        where.isPublished = query.isPublished === 'true'
      }
    }

    if (query.category) where.category = query.category
    if (query.visibility && isAdmin) where.visibility = query.visibility

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.per,
        take: query.per,
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
      success: true,
      data: documents,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per),
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/documents:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un document (admin uniquement)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { antenneIds, changelog, ...docData } = DocumentSchema.parse(body)

    const slug = docData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const document = await prisma.document.create({
      data: {
        ...docData,
        slug,
        createdById: (session.user as any).id,
        versions: {
          create: {
            fileUrl: docData.fileUrl,
            version: 1,
            changelog: changelog || 'Version initiale',
          }
        },
        antennes: antenneIds ? {
          create: antenneIds.map(id => ({ antenneId: id }))
        } : undefined
      }
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Erreur POST /api/documents:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour (nouvelle version si fileUrl change)
export async function PUT(req: Request) {
    try {
      const session = await getServerSession(authOptions)
      const userRole = (session?.user as any)?.role
      if (!session || !userRole || !['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }

      const body = await req.json()
      const { id, antenneIds, changelog, ...updateData } = body
      if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

      const existingDoc = await prisma.document.findUnique({ where: { id } })
      if (!existingDoc) return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })

      const isNewVersion = updateData.fileUrl && updateData.fileUrl !== existingDoc.fileUrl

      const document = await prisma.document.update({
        where: { id },
        data: {
          ...updateData,
          version: isNewVersion ? existingDoc.version + 1 : existingDoc.version,
          versions: isNewVersion ? {
            create: {
              fileUrl: updateData.fileUrl,
              version: existingDoc.version + 1,
              changelog: changelog || 'Mise à jour du fichier',
            }
          } : undefined
        }
      })

      return NextResponse.json({ success: true, data: document })
    } catch (error: any) {
      console.error('❌ Erreur PUT /api/documents:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
