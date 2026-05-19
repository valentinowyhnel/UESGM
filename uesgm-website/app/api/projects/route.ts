import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { Role, ProjectStatus, ProjectCategory } from "@prisma/client"
import { requireRole } from "@/lib/auth/requireRole"
import { sanitizeHtml } from "@/lib/sanitize"

const projectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  shortDesc: z.string().max(255),
  summary: z.string().max(500).optional().nullable(),
  category: z.nativeEnum(ProjectCategory),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNED),
  progress: z.number().int().min(0).max(100).default(0),
  imageUrl: z.string().url().optional().nullable(),
  startDate: z.string().transform((str) => str ? new Date(str) : null).optional().nullable(),
  endDate: z.string().transform((str) => str ? new Date(str) : null).optional().nullable(),
  published: z.boolean().default(false),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per") || "10")
    const status = searchParams.get("status") as ProjectStatus | null
    const category = searchParams.get("category") as ProjectCategory | null
    const publishedOnly = searchParams.get("published") === "true"

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (publishedOnly) where.published = true

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { updatedAt: "desc" },
        include: {
          tags: true,
          milestones: true
        }
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    })
  } catch (error) {
    console.error("GET /api/projects error:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response, session } = await requireRole(Role.ADMIN)
  if (!authorized) return response

  try {
    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    const slug = validatedData.title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "") + "-" + Date.now().toString().slice(-4)

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        description: sanitizeHtml(validatedData.description),
        isPublished: validatedData.published, // Backward compatibility
        slug,
        createdById: (session!.user as any).id
      }
    })

    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/projects error:", error)
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

    const validatedData = projectSchema.partial().parse(data)

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...validatedData,
        description: validatedData.description ? sanitizeHtml(validatedData.description) : undefined,
        isPublished: validatedData.published !== undefined ? validatedData.published : undefined
      }
    })

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("PUT /api/projects error:", error)
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

    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Projet supprimé" })
  } catch (error) {
    console.error("DELETE /api/projects error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
