import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/requireRole"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isDetailed = searchParams.get("detailed") === "true"

    let adminData = {}
    if (isDetailed) {
      const { authorized } = await requireRole(Role.ADMIN)
      if (authorized) {
        const [subscribers, messages] = await Promise.all([
          prisma.newsletter.count(),
          prisma.contactMessage.count({ where: { processed: false } })
        ])
        adminData = {
          engagement: {
            totalNewsletterSubscribers: subscribers,
            unreadContactMessages: messages
          }
        }
      }
    }

    const [events, projects, documents, partners, antennes] = await Promise.all([
      prisma.event.count({ where: { published: true } }),
      prisma.project.count({ where: { published: true } }),
      prisma.document.count({ where: { published: true } }),
      prisma.partner.count({ where: { isActive: true } }),
      prisma.antenne.count({ where: { isActive: true } })
    ])

    const data = {
      overview: {
        totalEvents: events,
        totalProjects: projects,
        totalDocuments: documents,
        totalPartners: partners,
        totalAntennes: antennes
      },
      ...adminData,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        isAdmin: isDetailed,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("GET /api/statistics error:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response } = await requireRole(Role.ADMIN)
  if (!authorized) return response

  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Clé et valeur requises" }, { status: 400 })
    }

    const statistic = await prisma.statistics.upsert({
      where: { key },
      update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
      create: {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }
    })

    return NextResponse.json({ success: true, data: statistic })
  } catch (error) {
    console.error("POST /api/statistics error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}
