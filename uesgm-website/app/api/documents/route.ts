import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createDocumentSchema } from "@/lib/validation-schemas"
import { requireRole } from "@/lib/auth/requireRole"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = {
      isPublished: true
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.document.count({ where })
    ])

    return NextResponse.json({
      documents,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(Role.ADMIN)
  if (!auth.authorized) return auth.response

  try {
    const body = await req.json()
    const validatedData = createDocumentSchema.parse(body)

    const document = await prisma.document.create({
      data: {
        ...validatedData,
        slug: validatedData.slug || validatedData.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
        createdById: auth.user.id
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
