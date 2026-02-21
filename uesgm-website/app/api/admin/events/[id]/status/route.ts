import { NextRequest, NextResponse } from 'next/server'
import { 
  withAdminAuth, 
  eventStatusSchema, 
  validateStatusTransition, 
  logAdminAction 
} from '@/lib/admin-events-security'
import { prisma } from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { emitAdminEventEvent } from '@/lib/sse'

// PATCH - Changer le statut d'un événement
export const PATCH = withAdminAuth(async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const eventId = params.id
    const body = await req.json()

    // Validation des données
    const validation = eventStatusSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Statut invalide', 
          details: validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const { status } = validation.data

    // Vérifier si l'événement existe dans la base de données
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Valider la transition de statut
    if (!validateStatusTransition(existingEvent.status, status)) {
      return NextResponse.json(
        { 
          error: 'Transition de statut non autorisée',
          details: {
            current: existingEvent.status,
            requested: status,
            allowed: {
              'DRAFT': ['PUBLISHED', 'SCHEDULED', 'ARCHIVED'],
              'PUBLISHED': ['ARCHIVED', 'DRAFT'],
              'SCHEDULED': ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
              'ARCHIVED': []
            }
          }
        },
        { status: 400 }
      )
    }

    // Validation supplémentaire pour la publication
    if (status === 'PUBLISHED') {
      const now = new Date()
      
      // Vérifier que tous les champs requis sont remplis
      if (!existingEvent.title || !existingEvent.description || !existingEvent.location) {
        return NextResponse.json(
          { 
            error: 'Informations incomplètes pour la publication',
            details: 'Titre, description et lieu sont requis pour publier un événement'
          },
          { status: 400 }
        )
      }

      // Vérifier que la date de début est dans le futur (optionnel - peut être commenté si on veut permettre la publication d'événements passés)
      if (existingEvent.startDate <= now) {
        // On autorise mais on avertit
        console.log('⚠️ Publication dun événement dont la date de début est passée')
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = { status }
    
    // Si on publie, définir publishedAt
    if (status === 'PUBLISHED') {
      updateData.publishedAt = new Date()
    } else if (status === 'SCHEDULED') {
      // Pour programmé, utiliser la date de publication si fournie dans le body
      // Sinon, utiliser une date par défaut (24 heures plus tard)
      if (body.publishedAt) {
        updateData.publishedAt = new Date(body.publishedAt)
      } else {
        // Par défaut, programmer pour 24 heures plus tard
        const scheduledDate = new Date()
        scheduledDate.setHours(scheduledDate.getHours() + 24)
        updateData.publishedAt = scheduledDate
      }
    } else if (status === 'DRAFT') {
      // Si on remet en brouillon, clear publishedAt
      updateData.publishedAt = null
    }

    // Mise à jour du statut dans la base de données
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { registrations: true }
        }
      }
    })

    // Revalidation du cache
    revalidatePath('/admin/evenements')
    revalidatePath('/events')
    revalidatePath(`/events/${eventId}`)

    // Émettre un événement SSE pour la mise à jour en temps réel
    // Utiliser 'event:updated' pour tout changement de statut
    emitAdminEventEvent('event:updated', {
      id: updatedEvent.id,
      title: updatedEvent.title,
      slug: updatedEvent.slug,
      status: updatedEvent.status,
      category: updatedEvent.category,
      startDate: updatedEvent.startDate.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString()
    })

    // Logging de l'action
    await logAdminAction(
      user.id,
      'STATUS_CHANGE',
      'event',
      eventId,
      { 
        title: updatedEvent.title,
        oldStatus: existingEvent.status,
        newStatus: status
      }
    )

    // Messages spécifiques selon le statut
    let message = ''
    switch (status) {
      case 'PUBLISHED':
        message = 'Événement publié avec succès'
        break
      case 'SCHEDULED':
        message = 'Événement programmé avec succès'
        break
      case 'ARCHIVED':
        message = 'Événement archivé avec succès'
        break
      case 'DRAFT':
        message = 'Événement remis en brouillon'
        break
    }

    return NextResponse.json({ 
      message,
      event: updatedEvent,
      statusChange: {
        from: existingEvent.status,
        to: status,
        changedAt: new Date()
      }
    })
  } catch (error: any) {
    console.error('PATCH event status error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de statut de l\'événement' },
      { status: 500 }
    )
  }
})
