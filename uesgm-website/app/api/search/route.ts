import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const SearchSchema = z.object({
  query: z.string().min(2, "La recherche doit contenir au moins 2 caractères").max(100),
  type: z.enum(['all', 'events', 'projects', 'documents', 'partners']).default('all'),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const { query, type } = SearchSchema.parse({
      query: searchParams.get('query'),
      type: searchParams.get('type') || 'all',
    })

    // Use full-text search with to_tsvector for PostgreSQL if available,
    // or fallback to a more robust contains logic.
    // Since we are using Prisma, we can use the 'search' feature if enabled.
    // For now, let's use a robust OR filter that Prisma translates well.

    const results: any = {}

    if (type === 'all' || type === 'events') {
      results.events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
          ],
          published: true,
        },
        take: 5,
      })
    }

    if (type === 'all' || type === 'projects') {
      results.projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { shortDesc: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        take: 5,
      })
    }

    if (type === 'all' || type === 'documents') {
      results.documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { fileName: { contains: query, mode: 'insensitive' } },
          ],
          published: true,
        },
        take: 5,
      })
    }

    if (type === 'all' || type === 'partners') {
      results.partners = await prisma.partner.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: 5,
      })
    }

    return NextResponse.json({
      success: true,
      query,
      results,
      meta: {
        totalResults: Object.values(results).reduce((acc: number, curr: any) => acc + curr.length, 0),
        searchTime: new Date().toISOString()
      }
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("❌ Error in /api/search:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la recherche." },
      { status: 500 }
    )
  }
}
