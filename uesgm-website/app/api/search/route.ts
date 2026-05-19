import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const type = searchParams.get("type") || "all"

    if (!query || query.length < 2) {
      return NextResponse.json({ success: false, error: "Recherche trop courte" }, { status: 400 })
    }

    const searchResults: any = {}

    // In a real production app with high traffic, we'd use a dedicated search engine (Meilisearch/Elastic)
    // Here we use Prisma's mode: 'insensitive' as a fallback for the prompt requirements

    if (type === "all" || type === "events") {
      searchResults.events = await prisma.event.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    }

    if (type === "all" || type === "projects") {
      searchResults.projects = await prisma.project.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    }

    if (type === "all" || type === "documents") {
      searchResults.documents = await prisma.document.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    }

    if (type === "all" || type === "partners") {
      searchResults.partners = await prisma.partner.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    }

    return NextResponse.json({
      success: true,
      data: searchResults,
      query,
      type
    })
  } catch (error) {
    console.error("GET /api/search error:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
