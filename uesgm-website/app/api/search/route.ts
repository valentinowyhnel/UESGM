import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const SearchQuerySchema = z.object({
  query: z.string().min(2).max(100),
  type: z.enum(['all', 'events', 'projects', 'documents', 'partners', 'antennes', 'executive-members']).default('all'),
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(20).default(10),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { query, type, page, per } = SearchQuerySchema.parse({
      query: searchParams.get('query'),
      type: searchParams.get('type') || 'all',
      page: searchParams.get('page') || 1,
      per: searchParams.get('per') || 10,
    })

    const results: any = {}
    let total = 0

    // Search Events
    if (type === 'all' || type === 'events') {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          status: 'PUBLISHED',
        },
        take: per,
      })
      results.events = events
      total += events.length
    }

    // Search Projects
    if (type === 'all' || type === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        take: per,
      })
      results.projects = projects
      total += projects.length
    }

    // Search Documents
    if (type === 'all' || type === 'documents') {
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        take: per,
      })
      results.documents = documents
      total += documents.length
    }

    return NextResponse.json({
      success: true,
      data: results,
      query,
      type,
      total,
    })
  } catch (error: any) {
    console.error('❌ Erreur GET /api/search:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Requête invalide', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
