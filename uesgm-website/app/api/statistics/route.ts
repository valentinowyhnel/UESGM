import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Aggregated public stats
    const [counts, flexibleStats] = await Promise.all([
      Promise.all([
        prisma.user.count({ where: { role: 'MEMBER' } }),
        prisma.antenne.count({ where: { isActive: true } }),
        prisma.event.count({ where: { published: true } }),
        prisma.project.count({ where: { isPublished: true } }),
        prisma.document.count({ where: { isPublished: true } })
      ]),
      prisma.statistics.findMany()
    ])

    const statsObj: any = {
      totalMembers: counts[0],
      totalAntennes: counts[1],
      totalEvents: counts[2],
      totalProjects: counts[3],
      totalDocuments: counts[4]
    }

    // Map flexible stats (key/value)
    flexibleStats.forEach(stat => {
      if (stat.key) statsObj[stat.key] = stat.value
    })

    // Admin only data could be added here if session.user.role === 'ADMIN'

    return NextResponse.json(statsObj)
  } catch (error) {
    console.error("Statistics error:", error)
    return NextResponse.json({ error: "Erreur lors du calcul des statistiques" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const stat = await prisma.statistics.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    })

    return NextResponse.json(stat)
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
