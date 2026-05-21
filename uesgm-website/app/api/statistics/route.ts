import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [eventsCount, projectsCount, documentsCount, partnersCount] = await Promise.all([
      prisma.event.count({ where: { published: true } }),
      prisma.project.count(),
      prisma.document.count({ where: { published: true } }),
      prisma.partner.count(),
    ])

    const stats = await prisma.statistics.findMany()
    const customStats = stats.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    return NextResponse.json({
      aggregates: {
        events: eventsCount,
        projects: projectsCount,
        documents: documentsCount,
        partners: partnersCount,
      },
      custom: customStats
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
