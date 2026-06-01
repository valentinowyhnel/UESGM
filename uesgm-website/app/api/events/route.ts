import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createEventSchema, paginationSchema } from "@/lib/validation-schemas"
import { requireRole } from "@/lib/auth/requireRole"
import { Role, EventStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const status = searchParams.get("status") || "PUBLISHED"

    const where: any = {
      status: status as any
    }

    if (category) {
      where.category = category
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: "desc" },
        include: {
          _count: {
            select: { registrations: true }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    return NextResponse.json({
      events,
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
    const validatedData = createEventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        ...validatedData,
        slug: validatedData.slug || validatedData.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
        createdById: auth.user.id
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
