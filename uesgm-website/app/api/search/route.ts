import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['all', 'event', 'project', 'document', 'partner']).default('all'),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const result = SearchQuerySchema.safeParse({
      q: searchParams.get('q'),
      type: searchParams.get('type') || 'all',
      limit: searchParams.get('limit') || '20',
    })

    if (!result.success) {
      return NextResponse.json({ error: "Requête invalide", details: result.error.format() }, { status: 400 })
    }

    const { q, type, limit } = result.data

    const searchPromises: Promise<any>[] = []

    if (type === 'all' || type === 'event') {
      searchPromises.push(prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
          ],
          status: 'PUBLISHED'
        },
        take: limit,
        select: { id: true, title: true, slug: true, startDate: true, imageUrl: true, category: true }
      }).then(res => res.map(item => ({ ...item, type: 'event' }))))
    }

    if (type === 'all' || type === 'project') {
      searchPromises.push(prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { shortDesc: { contains: q, mode: 'insensitive' } },
          ],
          isPublished: true
        },
        take: limit,
        select: { id: true, title: true, slug: true, status: true, imageUrl: true, category: true }
      }).then(res => res.map(item => ({ ...item, type: 'project' }))))
    }

    if (type === 'all' || type === 'document') {
      searchPromises.push(prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          isPublished: true,
          visibility: 'PUBLIC'
        },
        take: limit,
        select: { id: true, title: true, slug: true, category: true, fileUrl: true, fileType: true }
      }).then(res => res.map(item => ({ ...item, type: 'document' }))))
    }

    if (type === 'all' || type === 'partner') {
      searchPromises.push(prisma.partner.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          isActive: true
        },
        take: limit,
        select: { id: true, name: true, type: true, logo: true, website: true }
      }).then(res => res.map(item => ({ ...item, type: 'partner' }))))
    }

    const searchResults = await Promise.all(searchPromises)
    const flattenedResults = searchResults.flat().sort((a, b) => {
      // Simple ranking: if title contains the exact query, it comes first
      const aTitle = (a.title || a.name || '').toLowerCase()
      const bTitle = (b.title || b.name || '').toLowerCase()
      const query = q.toLowerCase()

      const aContains = aTitle.includes(query)
      const bContains = bTitle.includes(query)

      if (aContains && !bContains) return -1
      if (!aContains && bContains) return 1
      return 0
    }).slice(0, limit)

    return NextResponse.json({
      success: true,
      query: q,
      count: flattenedResults.length,
      data: flattenedResults
    })

  } catch (error) {
    console.error('❌ Erreur GET /api/search:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
