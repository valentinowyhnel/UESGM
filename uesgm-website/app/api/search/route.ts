import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all'

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Requête trop courte" }, { status: 400 })
  }

  try {
    const results: any = {}

    // PostgreSQL Full-Text Search implementation
    // Note: This requires the columns to be indexed or uses a sequential scan if not.
    // We use a simplified version that is still very performant in Postgres.

    if (type === 'all' || type === 'events') {
      results.events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          published: true,
        },
        orderBy: {
          startDate: 'desc'
        },
        take: 10,
      })
    }

    if (type === 'all' || type === 'projects') {
      results.projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 10,
      })
    }

    if (type === 'all' || type === 'documents') {
      results.documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isPublished: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
      })
    }

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query,
        type,
        total: (results.events?.length || 0) + (results.projects?.length || 0) + (results.documents?.length || 0),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Search API Error:", error)
    return NextResponse.json({ error: "Erreur lors de la recherche" }, { status: 500 })
  }
}
