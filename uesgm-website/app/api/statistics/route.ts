import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const isAuthorized = session && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)

  try {
    const stats = {
      overview: {
        totalEvents: await prisma.event.count(),
        totalProjects: await prisma.project.count(),
        totalDocuments: await prisma.document.count(),
        totalPartners: await prisma.partner.count(),
        totalAntennes: await prisma.antenne.count(),
      },
      engagement: isAuthorized ? {
        totalNewsletterSubscribers: await prisma.newsletter.count(),
        totalContactMessages: await prisma.contactMessage.count(),
      } : null,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
