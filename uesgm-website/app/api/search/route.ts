import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const SearchSchema = z.object({
  query: z.string().min(2).max(100),
  type: z.enum(['all', 'events', 'projects', 'documents', 'partners']).default('all'),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { query, type } = SearchSchema.parse({
      query: searchParams.get('query'),
      type: searchParams.get('type') || 'all',
    })

    const results: any = {}

    if (type === 'all' || type === 'events') {
      results.events = await prisma.event.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 10
      })
    }

    if (type === 'all' || type === 'projects') {
      results.projects = await prisma.project.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 10
      })
    }

    if (type === 'all' || type === 'documents') {
      results.documents = await prisma.document.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 10
      })
    }

    if (type === 'all' || type === 'partners') {
      results.partners = await prisma.partner.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: 10
      })
    }

    return NextResponse.json({
      success: true,
      data: results,
      query,
      type
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Requête invalide", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
