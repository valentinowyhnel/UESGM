import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Statistiques du site
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const detailed = searchParams.get('detailed') === 'true'
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    const isAdmin = session && userRole && ['ADMIN', 'SUPER_ADMIN'].includes(userRole)

    // Statistiques de base (publiques)
    const baseStats = await prisma.statistics.findFirst({
      select: {
        totalMembers: true,
        totalAntennes: true,
        totalEvents: true,
        updatedAt: true,
      }
    })

    // Comptes en temps réel
    const [
      totalEvents,
      publishedEvents,
      upcomingEvents,
      totalProjects,
      publishedProjects,
      totalDocuments,
      publishedDocuments,
      totalPartners,
      totalAntennes,
      totalNewsletterSubscribers,
      activeNewsletterSubscribers,
      totalContactMessages,
      unreadContactMessages,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.event.count({ 
        where: { 
          status: 'PUBLISHED',
          startDate: { gte: new Date() }
        } 
      }),
      prisma.project.count(),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.document.count(),
      prisma.document.count({ where: { isPublished: true } }),
      prisma.partner.count(),
      prisma.antenne.count(),
      prisma.newsletter.count(),
      prisma.newsletter.count({ where: { isActive: true } }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: 'PENDING' } }),
    ])

    const stats: any = {
      // Statistiques générales
      overview: {
        totalEvents,
        publishedEvents,
        upcomingEvents,
        totalProjects,
        publishedProjects,
        totalDocuments,
        publishedDocuments,
        totalPartners,
        totalAntennes,
      },
      
      // Engagement
      engagement: {
        totalNewsletterSubscribers,
        activeNewsletterSubscribers,
        totalContactMessages,
        unreadContactMessages,
      },
      
      // Dernière mise à jour
      lastUpdated: baseStats?.updatedAt || new Date(),
    }

    // Statistiques détaillées (admin uniquement)
    if (detailed && isAdmin) {
      const [
        eventsByCategory,
        eventsByMonth,
        projectsByStatus,
        documentsByCategory,
        partnersByType,
        recentActivity,
        monthlyGrowth,
      ] = await Promise.all([
        // Événements par catégorie (publiés uniquement)
        prisma.event.groupBy({
          by: ['category'],
          where: { status: 'PUBLISHED' },
          _count: { id: true },
        }),
        // Événements par mois (12 derniers mois)
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "startDate") as month,
            COUNT(*) as count
          FROM "Event"
          WHERE "status" = 'PUBLISHED'
            AND "startDate" >= NOW() - INTERVAL '1 year'
          GROUP BY DATE_TRUNC('month', "startDate")
          ORDER BY month DESC
          LIMIT 12
        `,
        // Projets par statut
        prisma.project.groupBy({
          by: ['status'],
          where: { isPublished: true },
          _count: { id: true },
        }),
        // Documents par catégorie
        prisma.document.groupBy({
          by: ['category'],
          where: { isPublished: true },
          _count: { id: true },
        }),
        // Partenaires par type
        prisma.partner.groupBy({
          by: ['type'],
          _count: { id: true },
        }),
        // Activité récente (30 derniers jours)
        prisma.contactMessage.findMany({
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            status: true,
            createdAt: true,
          }
        }),
        
        // Croissance mensuelle (6 derniers mois)
        prisma.contactMessage.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          },
          _count: { id: true },
        }),
      ])

      stats.detailed = {
        breakdowns: {
          eventsByCategory,
          projectsByStatus,
          documentsByCategory,
          partnersByType,
        },
        activity: {
          recent: recentActivity,
          monthlyGrowth,
        },
      }
    }

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        isAdmin,
        detailed,
        generatedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/statistics:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
