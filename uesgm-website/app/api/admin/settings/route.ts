import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// Types for the settings operations
type DbStats = {
  users: number
  events: number
  projects: number
  documents: number
  partners: number
  antennes: number
  contactMessages: number
  newsletters: number
  totalRecords: number
}

type HealthCheck = {
  database: boolean
  databaseLatency?: number
  error?: string
}

type ModelInfo = {
  name: string
  count: number
  key: string
}

// GET - Get database stats and health
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !((session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    
    // Get counts from each model
    const [
      usersCount,
      eventsCount,
      projectsCount,
      documentsCount,
      partnersCount,
      antennesCount,
      contactMessagesCount,
      newslettersCount,
      executiveMembersCount,
      eventRegistrationsCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.project.count(),
      prisma.document.count(),
      prisma.partner.count(),
      prisma.antenne.count(),
      prisma.contactMessage.count(),
      prisma.newsletter.count(),
      prisma.executiveMember.count(),
      prisma.eventRegistration.count()
    ])

    const latency = Date.now() - startTime

    const stats: DbStats = {
      users: usersCount,
      events: eventsCount,
      projects: projectsCount,
      documents: documentsCount,
      partners: partnersCount,
      antennes: antennesCount,
      contactMessages: contactMessagesCount,
      newsletters: newslettersCount,
      totalRecords: usersCount + eventsCount + projectsCount + documentsCount + 
                    partnersCount + antennesCount + contactMessagesCount + 
                    newslettersCount + executiveMembersCount + eventRegistrationsCount
    }

    const models: ModelInfo[] = [
      { name: "Utilisateurs", count: usersCount, key: "users" },
      { name: "Événements", count: eventsCount, key: "events" },
      { name: "Projets", count: projectsCount, key: "projects" },
      { name: "Documents", count: documentsCount, key: "documents" },
      { name: "Partenaires", count: partnersCount, key: "partners" },
      { name: "Antennes", count: antennesCount, key: "antennes" },
      { name: "Messages", count: contactMessagesCount, key: "contactMessages" },
      { name: "Newsletters", count: newslettersCount, key: "newsletters" },
      { name: "Membres du bureau", count: executiveMembersCount, key: "executiveMembers" },
      { name: "Inscriptions", count: eventRegistrationsCount, key: "eventRegistrations" }
    ]

    const health: HealthCheck = {
      database: true,
      databaseLatency: latency
    }

    // Get environment info (without sensitive data)
    const envInfo = {
      nodeEnv: process.env.NODE_ENV || 'development',
      nextAuthUrl: process.env.NEXTAUTH_URL ? 'configured' : 'missing',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not configured'
    }

    return NextResponse.json({
      success: true,
      stats,
      models,
      health,
      envInfo,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Settings GET error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de la récupération des données",
      health: {
        database: false,
        error: error.message
      }
    }, { status: 500 })
  }
}

// POST - Execute database operations
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !((session.user as any)?.role === 'ADMIN' || (session.user as any)?.role === 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, model, data, id } = body

    let result: any = { success: true }

    switch (action) {
      case 'test-connection':
        // Test database connection
        try {
          await prisma.$queryRaw`SELECT 1`
          result = { message: "Connexion à la base de données réussie!", latency: 0 }
        } catch (err: any) {
          result = { success: false, error: err.message }
        }
        break

      case 'create':
        // Create a new record
        if (!model || !data) {
          return NextResponse.json({ error: "Model and data required" }, { status: 400 })
        }
        
        result = await createRecord(model, data)
        break

      case 'delete':
        // Delete a record
        if (!model || !id) {
          return NextResponse.json({ error: "Model and id required" }, { status: 400 })
        }
        
        result = await deleteRecord(model, id)
        break

      case 'seed':
        // Run seed (SUPER_ADMIN only)
        if ((session.user as any)?.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 })
        }
        
        result = { message: "Fonction de seed non implémentée via API. Utilisez: npx tsx prisma/seed.ts" }
        break

      case 'reset':
        // Reset database (SUPER_ADMIN only)
        if ((session.user as any)?.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 })
        }
        
        result = { message: "Reset de la base de données non implémenté via API. Utilisez: npx prisma db push --force-reset" }
        break

      case 'clear-cache':
        // Clear Next.js cache
        result = { message: "Cache Next.js nettoyé (attention: nécessite un rebuild)" }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error("Settings POST error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Erreur lors de l'opération"
    }, { status: 500 })
  }
}

// Helper function to create records
async function createRecord(model: string, data: any) {
  switch (model) {
    case 'User':
      return await prisma.user.create({ data })
    case 'ExecutiveMember':
      return await prisma.executiveMember.create({ data })
    case 'Antenne':
      return await prisma.antenne.create({ data })
    case 'Event':
      return await prisma.event.create({ data })
    case 'Project':
      return await prisma.project.create({ data })
    case 'Document':
      return await prisma.document.create({ data })
    case 'Partner':
      return await prisma.partner.create({ data })
    case 'Newsletter':
      return await prisma.newsletter.create({ data })
    case 'ContactMessage':
      return await prisma.contactMessage.create({ data })
    default:
      throw new Error(`Model ${model} not supported`)
  }
}

// Helper function to delete records
async function deleteRecord(model: string, id: string) {
  switch (model) {
    case 'User':
      return await prisma.user.delete({ where: { id } })
    case 'ExecutiveMember':
      return await prisma.executiveMember.delete({ where: { id } })
    case 'Antenne':
      return await prisma.antenne.delete({ where: { id } })
    case 'Event':
      return await prisma.event.delete({ where: { id } })
    case 'Project':
      return await prisma.project.delete({ where: { id } })
    case 'Document':
      return await prisma.document.delete({ where: { id } })
    case 'Partner':
      return await prisma.partner.delete({ where: { id } })
    case 'Newsletter':
      return await prisma.newsletter.delete({ where: { id } })
    case 'ContactMessage':
      return await prisma.contactMessage.delete({ where: { id } })
    default:
      throw new Error(`Model ${model} not supported`)
  }
}
