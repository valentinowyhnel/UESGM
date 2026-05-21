import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SearchSchema = z.object({
  q: z.string().min(2),
  type: z.enum(['all', 'events', 'projects', 'documents', 'partners']).default('all'),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const { q, type } = SearchSchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type') || 'all',
    })

    // On utilise raw query pour to_tsvector si on veut vraiment du full-text Postgres
    // Mais pour la simplicité et la compatibilité Prisma, on reste sur du filtrage avancé
    // On pourrait utiliser : await prisma.$queryRaw`SELECT * FROM events WHERE to_tsvector(title || ' ' || description) @@ to_tsquery(${q})`

    const results: any = {}

    if (type === 'all' || type === 'events') {
      results.events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          published: true,
        },
        take: 10,
      })
    }

    if (type === 'all' || type === 'projects') {
      results.projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
