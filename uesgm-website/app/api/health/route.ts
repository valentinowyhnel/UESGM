import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma-wrapper'

// GET - Health check du système
export async function GET(req: Request) {
  try {
    const startTime = Date.now()
    
    // Vérifier la connexion à la base de données
    let dbStatus = 'connected'
    let dbError = null
    
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error: any) {
      dbStatus = 'disconnected'
      dbError = error.message
    }

    // Vérifier les statistiques de base
    let stats = null
    if (dbStatus === 'connected') {
      try {
        const [users, events, projects, documents] = await Promise.all([
          prisma.user.count(),
          prisma.event.count(),
          prisma.project.count(),
          prisma.document.count(),
        ])
        
        stats = {
          users,
          events,
          projects,
          documents,
        }
      } catch (error) {
        console.error('Stats check failed:', error)
      }
    }

    // Vérifier la mémoire et le CPU
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // Base de données
      database: {
        status: dbStatus,
        error: dbError,
        responseTime: Date.now() - startTime,
      },
      
      // Statistiques
      statistics: stats,
      
      // Performance
      performance: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      },
      
      // Services externes (à implémenter)
      services: {
        supabase: 'connected', // À vérifier avec une vraie requête
        redis: 'not_configured', // À vérifier si Redis est configuré
        email: 'not_configured', // À vérifier avec un service d'email
      }
    }

    // Déterminer le statut global
    const isHealthy = dbStatus === 'connected' && !dbError
    
    return NextResponse.json(health, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/health:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      database: {
        status: 'error',
        error: 'Connection failed',
      },
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  }
}

// HEAD - Health check rapide (pour les load balancers)
export async function HEAD(req: Request) {
  try {
    // Vérification rapide de la base de données
    await prisma.$queryRaw`SELECT 1`
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  }
}
