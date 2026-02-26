import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Check cache
    const cacheKey = `uesgm:search:${query.toLowerCase()}`
    const cachedResult = await redis.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json({ success: true, data: cachedResult, cached: true })
    }

    // Parallel search across multiple tables
    const [events, projects, documents, partners] = await Promise.all([
      prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          published: true,
        },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          published: true,
        },
        take: 5,
      }),
      prisma.partner.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        take: 5,
      }),
    ])

    const results = [
      ...events.map(e => ({ type: "event", id: e.id, title: e.title, slug: e.slug, date: e.date })),
      ...projects.map(p => ({ type: "project", id: p.id, title: p.title, slug: p.slug })),
      ...documents.map(d => ({ type: "document", id: d.id, title: d.title, url: d.fileUrl })),
      ...partners.map(p => ({ type: "partner", id: p.id, title: p.name, website: p.website })),
    ]

    // Cache for 30 minutes
    await redis.set(cacheKey, JSON.stringify(results), { ex: 1800 })

    return NextResponse.json({ success: true, data: results, cached: false })
  } catch (error) {
    console.error("Search Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
