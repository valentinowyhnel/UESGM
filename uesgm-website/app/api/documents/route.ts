import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createDocumentSchema, documentFilterSchema } from "@/lib/validation-schemas"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/documents - List documents with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validation = documentFilterSchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json({ error: "Paramètres invalides", details: validation.error.format() }, { status: 400 })
    }

    const { page, limit, category, visibility, search } = validation.data
    const skip = (page - 1) * limit

    const session = await getServerSession(authOptions)
    const userRole = session?.user?.role || 'PUBLIC'

    // Visibility logic
    const visibilityFilter: any[] = [{ visibility: 'PUBLIC' }]
    if (userRole === 'MEMBER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      visibilityFilter.push({ visibility: 'MEMBERS_ONLY' })
    }
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      visibilityFilter.push({ visibility: 'ADMIN_ONLY' })
    }

    const where: any = {
      isPublished: true,
      OR: visibilityFilter
    }

    if (category) where.category = category as any
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { some: { name: { contains: search, mode: 'insensitive' } } } }
          ]
        }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true } },
          tags: true,
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        }
      }),
      prisma.document.count({ where })
    ])

    return NextResponse.json({
      documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/documents - Create new document or new version (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const result = createDocumentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.format() }, { status: 400 })
    }

    const data = result.data
    const slug = data.slug || data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    // Check if document exists for versioning
    const existingDoc = await prisma.document.findUnique({
      where: { slug }
    })

    if (existingDoc) {
      // Create new version
      const newVersionNum = existingDoc.version + 1
      const [updatedDoc, version] = await prisma.$transaction([
        prisma.document.update({
          where: { id: existingDoc.id },
          data: {
            version: newVersionNum,
            fileUrl: data.fileUrl,
            fileName: data.fileName || existingDoc.fileName,
            fileSize: data.fileSize || existingDoc.fileSize,
            mimeType: data.mimeType || existingDoc.mimeType,
            updatedAt: new Date()
          }
        }),
        prisma.documentVersion.create({
          data: {
            documentId: existingDoc.id,
            version: newVersionNum,
            fileUrl: data.fileUrl,
            changelog: `Mise à jour vers version ${newVersionNum}`
          }
        })
      ])
      return NextResponse.json({ updatedDoc, version }, { status: 200 })
    } else {
      // Create new document
      const document = await prisma.document.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          category: data.category as any,
          visibility: data.visibility as any,
          canDownload: data.canDownload,
          fileUrl: data.fileUrl,
          fileName: data.fileName || "document",
          fileSize: data.fileSize || 0,
          mimeType: data.mimeType || "application/octet-stream",
          isPublished: data.published,
          published: data.published,
          createdById: session.user.id,
          versions: {
            create: {
              version: 1,
              fileUrl: data.fileUrl,
              changelog: "Version initiale"
            }
          },
          tags: data.tags ? {
            create: data.tags.map(tag => ({ name: tag }))
          } : undefined
        },
        include: { versions: true }
      })
      return NextResponse.json(document, { status: 201 })
    }
  } catch (error: any) {
    console.error("Error handling document:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
