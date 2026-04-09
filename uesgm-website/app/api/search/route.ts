import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    if (!q || q.length < 2) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 })
    }

    // Full-text search using Postgres to_tsvector with ranking
    const [events, projects, documents, partners] = await Promise.all([
      prisma.$queryRaw`
        SELECT *, ts_rank(to_tsvector('french', title || ' ' || description), plainto_tsquery('french', ${q})) as rank
        FROM "events"
        WHERE to_tsvector('french', title || ' ' || description) @@ plainto_tsquery('french', ${q})
          AND "published" = true
        ORDER BY rank DESC
        LIMIT 5
      `,
      prisma.$queryRaw`
        SELECT *, ts_rank(to_tsvector('french', title || ' ' || description), plainto_tsquery('french', ${q})) as rank
        FROM "projects"
        WHERE to_tsvector('french', title || ' ' || description) @@ plainto_tsquery('french', ${q})
          AND "isPublished" = true
        ORDER BY rank DESC
        LIMIT 5
      `,
      prisma.$queryRaw`
        SELECT *, ts_rank(to_tsvector('french', title || ' ' || description), plainto_tsquery('french', ${q})) as rank
        FROM "documents"
        WHERE to_tsvector('french', title || ' ' || description) @@ plainto_tsquery('french', ${q})
          AND "isPublished" = true
          AND "visibility" = 'PUBLIC'
        ORDER BY rank DESC
        LIMIT 5
      `,
      prisma.$queryRaw`
        SELECT *, ts_rank(to_tsvector('french', name || ' ' || COALESCE(description, '')), plainto_tsquery('french', ${q})) as rank
        FROM "partners"
        WHERE to_tsvector('french', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('french', ${q})
          AND "isActive" = true
        ORDER BY rank DESC
        LIMIT 5
      `,
    ])

    return NextResponse.json({
      events,
      projects,
      documents,
      partners,
    })
  } catch (error) {
    console.error('❌ GET /api/search error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
