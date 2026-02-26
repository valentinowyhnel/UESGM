import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth/auth-options"
import { hasRequiredRole } from "@/lib/auth/rbac"

const documentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().optional(),
  published: z.boolean().default(false),
})

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const where: any = {
      published: true,
    }

    if (query.category) {
      where.category = query.category
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.per,
        take: query.per,
      }),
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: documents,
      meta: {
        total,
        page: query.page,
        per: query.per,
        totalPages: Math.ceil(total / query.per),
      }
    })
  } catch (error) {
    console.error("GET Documents Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasRequiredRole(session.user?.role, "MEMBER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = documentSchema.parse(body)

    const document = await prisma.document.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        submittedByEmail: session.user.email,
        submittedByName: session.user.name,
      },
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST Document Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
