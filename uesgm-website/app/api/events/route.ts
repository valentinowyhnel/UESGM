import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createEventSchema, updateEventSchema } from "@/lib/validation-schemas"
import { z } from "zod"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const published = searchParams.get('published')

  try {
    const events = await prisma.event.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(status === 'upcoming' && { startDate: { gte: new Date() } }),
        ...(status === 'past' && { startDate: { lt: new Date() } }),
        ...(published === 'true' && { published: true }),
      },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des événements" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role === 'MEMBER') {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validatedData = createEventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.date),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        createdById: session.user.id,
        slug: validatedData.slug || validatedData.title.toLowerCase().replace(/ /g, '-'),
      } as any
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur lors de la création de l'événement" }, { status: 500 })
  }
}
