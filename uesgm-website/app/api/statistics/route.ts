import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      totalEvents,
      totalProjects,
      totalDocuments,
      totalPartners,
      stats
    ] = await Promise.all([
      prisma.event.count({ where: { published: true } }),
      prisma.project.count(),
      prisma.document.count({ where: { published: true } }),
      prisma.partner.count(),
      prisma.statistics.findMany()
    ])

    const overview = {
      totalEvents,
      totalProjects,
      totalDocuments,
      totalPartners,
    }

    // Convert fixed stats from database
    const dynamicStats = stats.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        overview,
        ...dynamicStats,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Statistics API Error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
