import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const StatUpdateSchema = z.object({
  key: z.string().min(1).max(50),
  value: z.string().min(1).max(255),
})

// GET - Statistiques du site
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const detailed = searchParams.get('detailed') === 'true'
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    const isAdmin = session && userRole && ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)

    // Récupérer les statistiques de la table Statistics
    const statistics = await prisma.statistics.findMany()
    const statsMap = statistics.reduce((acc: any, stat) => {
      acc[stat.key] = stat.value
      return acc
    }, {})

    // Comptes en temps réel (pour l'admin ou si detailed est vrai)
    const realTimeCounts = detailed ? await Promise.all([
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.document.count({ where: { isPublished: true } }),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.antenne.count({ where: { isActive: true } }),
      prisma.newsletter.count({ where: { isActive: true } }),
      prisma.contactMessage.count({ where: { status: 'PENDING' } }),
    ]) : []

    const stats: any = {
      // Statistiques stockées (publiques)
      ...statsMap,
      
      // Statistiques temps réel (si demandé)
      ...(detailed ? {
        realTime: {
          publishedEvents: realTimeCounts[0],
          publishedProjects: realTimeCounts[1],
          publishedDocuments: realTimeCounts[2],
          activePartners: realTimeCounts[3],
          activeAntennes: realTimeCounts[4],
          activeNewsletterSubscribers: realTimeCounts[5],
          pendingContactMessages: realTimeCounts[6],
        }
      } : {}),
      
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/statistics:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Mettre à jour une statistique (admin uniquement)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { key, value } = StatUpdateSchema.parse(body)

    const stat = await prisma.statistics.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json({
      success: true,
      data: stat,
    })
  } catch (error: any) {
    console.error('❌ Erreur POST /api/statistics:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
