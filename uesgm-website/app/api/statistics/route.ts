import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const [
      totalMembers,
      totalEvents,
      totalProjects,
      totalDocuments,
      totalAntennes
    ] = await Promise.all([
      prisma.user.count({ where: { role: "MEMBER" } }),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.document.count({ where: { isPublished: true } }),
      prisma.antenne.count({ where: { isActive: true } })
    ])

    const stats = {
      totalMembers,
      totalEvents,
      totalProjects,
      totalDocuments,
      totalAntennes,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
