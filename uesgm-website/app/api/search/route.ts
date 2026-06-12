import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const [events, projects, documents, partners] = await Promise.all([
      prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } }
          ],
          status: "PUBLISHED"
        },
        take: 5
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } }
          ],
          isPublished: true
        },
        take: 5
      }),
      prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } }
          ],
          isPublished: true
        },
        take: 5
      }),
      prisma.partner.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
          isActive: true
        },
        take: 5
      })
    ])

    const results = [
      ...events.map(e => ({ id: e.id, title: e.title, type: "event", url: `/evenements/${e.slug}` })),
      ...projects.map(p => ({ id: p.id, title: p.title, type: "project", url: `/projets/${p.slug}` })),
      ...documents.map(d => ({ id: d.id, title: d.title, type: "document", url: `/bibliotheque/${d.slug}` })),
      ...partners.map(p => ({ id: p.id, title: p.name, type: "partner", url: p.website || "#" }))
    ]

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
