import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') // Optional: event, project, document, partner

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results: any = {}

    // Global search using simplified Prisma contains (Postgres full-text search would use raw query)
    const [events, projects, documents, partners] = await Promise.all([
      (!type || type === 'event') ? prisma.event.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      }) : [],
      (!type || type === 'project') ? prisma.project.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      }) : [],
      (!type || type === 'document') ? prisma.document.findMany({
        where: {
          isPublished: true,
          visibility: 'PUBLIC',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      }) : [],
      (!type || type === 'partner') ? prisma.partner.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: 'insensitive' }
        },
        take: 5
      }) : []
    ])

    return NextResponse.json({
      events,
      projects,
      documents,
      partners
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Erreur lors de la recherche" }, { status: 500 })
  }
}
