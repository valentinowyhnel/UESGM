import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const detailed = searchParams.get('detailed') === 'true'
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

    const [
      totalEvents,
      totalProjects,
      totalDocuments,
      totalPartners,
      totalAntennes,
      totalNewsletter,
      totalContact,
    ] = await Promise.all([
      prisma.event.count({ where: { published: true } }),
      prisma.project.count({ where: { published: true } }),
      prisma.document.count({ where: { published: true } }),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.antenne.count({ where: { isActive: true } }),
      prisma.newsletter.count({ where: { isActive: true } }),
      prisma.contactMessage.count(),
    ])

    const stats: any = {
      overview: {
        totalEvents,
        publishedEvents: totalEvents, // simplified
        upcomingEvents: await prisma.event.count({ where: { published: true, date: { gte: new Date() } } }),
        totalProjects,
        publishedProjects: totalProjects,
        totalDocuments,
        publishedDocuments: totalDocuments,
        totalPartners,
        totalAntennes,
      },
      engagement: {
        totalNewsletterSubscribers: totalNewsletter,
        activeNewsletterSubscribers: totalNewsletter,
        totalContactMessages: totalContact,
        unreadContactMessages: await prisma.contactMessage.count({ where: { processed: false } }),
      },
      lastUpdated: new Date().toISOString(),
    }

    if (detailed && isAdmin) {
      // Add detailed stats for admin if needed
      stats.detailed = {
        raw: await prisma.statistics.findMany()
      }
    }

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        isAdmin,
        detailed,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/statistics:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
