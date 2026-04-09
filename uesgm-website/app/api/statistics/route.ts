import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

// Cache simple (Redis serait mieux mais on utilise une Map pour le squelette)
const statsCache = new Map<string, { data: any; expires: number }>()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const detailed = searchParams.get('detailed') === 'true'
    const session = await getServerSession(authOptions)
    const isAdmin = session && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(session.user.role)

    // Vérifier le cache
    const cacheKey = detailed && isAdmin ? 'admin-stats' : 'public-stats'
    const cached = statsCache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data)
    }

    const [
      totalEvents,
      totalProjects,
      totalDocuments,
      totalPartners,
      totalAntennes,
      totalMembers
    ] = await Promise.all([
      prisma.event.count({ where: { published: true } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.document.count({ where: { isPublished: true } }),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.antenne.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'MEMBER' } })
    ])

    const stats: any = {
      totalEvents,
      totalProjects,
      totalDocuments,
      totalPartners,
      totalAntennes,
      totalMembers: totalMembers + 150, // + Base fixe
    }

    if (detailed && isAdmin) {
      const [
        pendingMessages,
        pendingRegistrations,
        recentLogs
      ] = await Promise.all([
        prisma.contactMessage.count({ where: { status: 'PENDING' } }),
        prisma.eventRegistration.count({ where: { status: 'PENDING' } }),
        prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } })
      ])
      stats.admin = {
        pendingMessages,
        pendingRegistrations,
        recentLogs
      }
    }

    // Mettre en cache pour 5 minutes
    statsCache.set(cacheKey, { data: stats, expires: Date.now() + 5 * 60 * 1000 })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ GET /api/statistics error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
