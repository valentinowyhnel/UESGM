import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-options"
import { hasRequiredRole } from "@/lib/auth/rbac"

export async function GET() {
  try {
    // Essayer de récupérer depuis le cache Redis
    const cachedStats = await redis.get("uesgm:stats:public")
    if (cachedStats) {
      return NextResponse.json({ success: true, data: cachedStats, cached: true })
    }

    // Sinon agréger les données
    const [eventCount, projectCount, memberCount, documentCount] = await Promise.all([
      prisma.event.count({ where: { published: true } }),
      prisma.project.count(),
      prisma.executiveMember.count(),
      prisma.document.count({ where: { published: true } }),
    ])

    const stats = {
      events: eventCount,
      projects: projectCount,
      members: memberCount,
      documents: documentCount,
    }

    // Mettre en cache pour 5 minutes
    await redis.set("uesgm:stats:public", JSON.stringify(stats), { ex: 300 })

    return NextResponse.json({ success: true, data: stats, cached: false })
  } catch (error) {
    console.error("GET Statistics Error:", error)
    // Fallback if Redis fails
    return NextResponse.json({
        success: true,
        data: { events: 0, projects: 0, members: 0, documents: 0 },
        error: "Redis fallback"
    })
  }
}

export async function POST(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions)
      if (!session || !hasRequiredRole(session.user?.role, "ADMIN")) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }

      const { key, value } = await req.json()

      const stat = await prisma.statistics.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })

      // Invalider le cache public
      await redis.del("uesgm:stats:public")

      return NextResponse.json({ success: true, data: stat })
    } catch (error) {
      console.error("POST Statistics Error:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }
}
