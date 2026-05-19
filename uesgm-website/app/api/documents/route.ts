import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { Role, DocumentCategory, DocumentVisibility } from "@prisma/client"
import { requireRole } from "@/lib/auth/requireRole"

const documentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional().nullable(),
  category: z.nativeEnum(DocumentCategory),
  visibility: z.nativeEnum(DocumentVisibility).default(DocumentVisibility.PUBLIC),
  canDownload: z.boolean().default(true),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  fileType: z.string().optional().nullable(),
  mimeType: z.string(),
  published: z.boolean().default(false),
  submittedByEmail: z.string().email().optional().nullable(),
  submittedByName: z.string().optional().nullable(),
  tags_prompt: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per") || "10")
    const category = searchParams.get("category") as DocumentCategory | null
    const publishedOnly = searchParams.get("published") === "true"
    const search = searchParams.get("search")

    const where: any = {}
    if (category) where.category = category
    if (publishedOnly) where.published = true
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
        include: {
          tags: true,
          antennes: { include: { antenne: true } }
        }
      }),
      prisma.document.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    })
  } catch (error) {
    console.error("GET /api/documents error:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response, session } = await requireRole(Role.ADMIN)
  if (!authorized) return response

  try {
    const body = await request.json()
    const validatedData = documentSchema.parse(body)

    const slug = validatedData.title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "") + "-" + Date.now().toString().slice(-4)

    const document = await prisma.document.create({
      data: {
        ...validatedData,
        isPublished: validatedData.published, // Backward compatibility
        slug,
        createdById: (session!.user as any).id
      }
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/documents error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la création" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { authorized, response } = await requireRole(Role.ADMIN)
  if (!authorized) return response

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 })

    const validatedData = documentSchema.partial().parse(data)

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...validatedData,
        isPublished: validatedData.published !== undefined ? validatedData.published : undefined
      }
    })

    return NextResponse.json({ success: true, data: document })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("PUT /api/documents error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { authorized, response } = await requireRole(Role.SUPER_ADMIN)
  if (!authorized) return response

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 })

    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Document supprimé" })
  } catch (error) {
    console.error("DELETE /api/documents error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
