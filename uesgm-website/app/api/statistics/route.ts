import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes((session.user as any).role)

    // Basic stats for public
    const [
      totalMembers,
      totalAntennes,
      totalEvents,
      totalProjects,
      totalDocuments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.antenne.count({ where: { isActive: true } }),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.document.count({ where: { published: true } }),
    ])

    const stats: any = {
      totalMembers,
      totalAntennes,
      totalEvents,
      totalProjects,
      totalDocuments,
    }

    if (isAdmin) {
      // Add more detailed stats for admin
      const [
        totalUsers,
        pendingContacts,
        recentLogs,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.contactMessage.count({ where: { status: 'PENDING' } }),
        prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      ])

      stats.admin = {
        totalUsers,
        pendingContacts,
        recentLogs,
      }
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('❌ GET /api/statistics error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
