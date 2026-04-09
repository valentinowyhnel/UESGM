import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schéma de validation pour la recherche
const SearchSchema = z.object({
  query: z.string().min(2).max(100),
  type: z.enum(['all', 'events', 'projects', 'documents', 'partners', 'antennes', 'executive-members']).default('all'),
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(20).default(10),
})

// GET - Recherche globale
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const searchQuery = SearchSchema.parse({
      query: searchParams.get('query'),
      type: searchParams.get('type') || 'all',
      page: searchParams.get('page') || 1,
      per: searchParams.get('per') || 10,
    })

    const { query, type, page, per } = searchQuery
    const skip = (page - 1) * per

    const results: any = {}
    let totalResults = 0

    // Recherche dans les événements
    if (type === 'all' || type === 'events') {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
          ],
          status: 'PUBLISHED',
        },
        take: type === 'events' ? per : 5,
        skip: type === 'events' ? skip : 0,
        orderBy: { startDate: 'desc' },
      })
      results.events = events
      totalResults += events.length
    }

    // Recherche dans les projets
    if (type === 'all' || type === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        take: type === 'projects' ? per : 5,
        skip: type === 'projects' ? skip : 0,
        orderBy: { createdAt: 'desc' },
      })
      results.projects = projects
      totalResults += projects.length
    }

    // Recherche dans les documents
    if (type === 'all' || type === 'documents') {
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        take: type === 'documents' ? per : 5,
        skip: type === 'documents' ? skip : 0,
        orderBy: { createdAt: 'desc' },
      })
      results.documents = documents
      totalResults += documents.length
    }

    // Recherche dans les partenaires
    if (type === 'all' || type === 'partners') {
      const partners = await prisma.partner.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: type === 'partners' ? per : 5,
        skip: type === 'partners' ? skip : 0,
        orderBy: { order: 'asc' },
      })
      results.partners = partners
      totalResults += partners.length
    }

    return NextResponse.json({
      success: true,
      query,
      results,
      meta: {
        totalResults,
        page,
        per,
      }
    })
  } catch (error: any) {
    console.error('❌ Erreur GET /api/search:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}
