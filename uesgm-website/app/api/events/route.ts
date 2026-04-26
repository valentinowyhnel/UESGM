import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isAdmin } from "@/lib/auth-utils"

const querySchema = z.object({
  page: z.string().transform(Number).default("1"),
  per: z.string().transform(Number).default("10"),
  category: z.string().optional(),
  status: z.enum(["upcoming", "past", "all"]).default("upcoming"),
  search: z.string().optional(),
  published: z.enum(["true", "false", "all"]).default("true"),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const where: any = {}

    if (query.category) {
      where.category = query.category
    }

    if (query.status === "upcoming") {
      where.date = { gte: new Date() }
    } else if (query.status === "past") {
      where.date = { lt: new Date() }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.published === "true") {
      where.published = true
    } else if (query.published === "false") {
      where.published = false
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (query.page - 1) * query.per,
        take: query.per,
        orderBy: { date: 'asc' },
        include: {
          _count: {
            select: { attendees: true }
          }
        }
      }),
      prisma.event.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per),
        hasNext: query.page * query.per < total
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Paramètres invalides", details: error.errors }, { status: 400 })
    }
    console.error("Events GET API Error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

const eventSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),
  date: z.string().transform(val => new Date(val)),
  location: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  published: z.boolean().default(false),
})

export async function POST(req: Request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = eventSchema.parse(body)

    const event = await prisma.event.create({
      data: validatedData
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("Events POST API Error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const body = await req.json()
    const validatedData = eventSchema.partial().parse(body)

    const event = await prisma.event.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("Events PUT API Error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    await prisma.event.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Événement supprimé" })
  } catch (error) {
    console.error("Events DELETE API Error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
