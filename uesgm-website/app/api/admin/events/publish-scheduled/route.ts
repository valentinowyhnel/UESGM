import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-events-security'
import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'

// POST - Publier automatiquement les événements programmés
export const POST = withAdminAuth(async (req: NextRequest, user) => {
  try {
    console.log('🔄 Début du job de publication automatique...')
    
    const now = new Date()
    
    // Récupérer les événements programmés qui doivent être publiés
    const eventsToPublish = await prisma.event.findMany({
      where: {
        status: 'SCHEDULED',
        publishedAt: {
          lte: now
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (eventsToPublish.length === 0) {
      console.log('✅ Aucun événement programmé à publier')
      return NextResponse.json({
        success: true,
        message: 'Aucun événement programmé à publier',
        published: []
      })
    }

    // Publier les événements
    const publishedEvents = await Promise.all(
      eventsToPublish.map(async (event: { id: string; title: string }) => {
        const updatedEvent = await prisma.event.update({
          where: { id: event.id },
          data: {
            status: 'PUBLISHED'
          }
        })

        console.log(`📰 Événement publié: ${event.title} (ID: ${event.id})`)
        
        return {
          id: event.id,
          title: event.title,
          publishedAt: updatedEvent.publishedAt
        }
      })
    )

    // Revalidation du cache pour tous les événements publiés
    revalidatePath('/events')
    revalidatePath('/admin/evenements')
    
    // Revalidation individuelle pour chaque événement
    for (const event of publishedEvents) {
      revalidatePath(`/events/${event.id}`)
    }

    console.log(`✅ ${publishedEvents.length} événement(s) publié(s) automatiquement`)

    return NextResponse.json({
      success: true,
      message: `${publishedEvents.length} événement(s) publié(s) avec succès`,
      published: publishedEvents,
      publishedAt: now
    })

  } catch (error: any) {
    console.error('❌ Erreur lors de la publication automatique:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la publication automatique',
        details: error.message 
      },
      { status: 500 }
    )
  }
})

// GET - Vérifier les événements programmés
export const GET = withAdminAuth(async (req: NextRequest, user) => {
  try {
    const now = new Date()
    
    // Récupérer les événements programmés
    const scheduledEvents = await prisma.event.findMany({
      where: {
        status: 'SCHEDULED',
        publishedAt: {
          gt: now
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        publishedAt: 'asc'
      }
    })

    // Récupérer les événements qui devraient être publiés
    const readyToPublish = await prisma.event.findMany({
      where: {
        status: 'SCHEDULED',
        publishedAt: {
          lte: now
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        publishedAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        scheduled: scheduledEvents,
        readyToPublish,
        totalScheduled: scheduledEvents.length,
        totalReady: readyToPublish.length
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification des événements programmés:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification',
        details: error.message 
      },
      { status: 500 }
    )
  }
})
