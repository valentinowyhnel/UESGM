import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schéma de validation pour l'inscription
const RegistrationSchema = z.object({
  name: z.string().min(2).max(100),  // Changé de fullName à name pour correspondre au modèle Prisma
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  establishment: z.string().max(200).optional(),
})

// POST - Inscription à un événement
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const body = await req.json()
    const registrationData = RegistrationSchema.parse(body)

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que l'événement n'est pas passé
    if (event.startDate && new Date(event.startDate) < new Date()) {
      return NextResponse.json(
        { error: 'Impossible de s\'inscrire à un événement passé' },
        { status: 400 }
      )
    }

    // Vérifier que l'email n'est pas déjà inscrit
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_email: {
          eventId,
          email: registrationData.email
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cet événement' },
        { status: 400 }
      )
    }

    // Créer l'inscription avec uniquement les champs requis du schéma
    const { name, email } = registrationData;
    const registration = await prisma.eventRegistration.create({
      data: {
        name,
        email,
        eventId,
      },
      include: {
        event: {
          select: {
            title: true,
            startDate: true,  // Utilisation de startDate au lieu de date
            location: true
          }
        }
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        data: registration,
        message: 'Inscription réussie !'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur POST /api/events/[id]/register:', error)
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

// GET - Liste des inscrits à un événement (admin uniquement)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Compter le nombre total d'inscrits
    const total = await prisma.eventRegistration.count({
      where: { eventId }
    })

    // Récupérer la liste paginée des inscrits
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des inscrits:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des inscrits' },
      { status: 500 }
    )
  }
}

// DELETE - Annuler une inscription
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis pour annuler une inscription' },
        { status: 400 }
      )
    }

    // Vérifier que l'inscription existe
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        id: registrationId,
        email
      },
      include: {
        event: {  // Utilisation de 'event' en minuscule comme défini dans le schéma
          select: {
            startDate: true  // Utilisation de startDate au lieu de date
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscription non trouvée ou email incorrect' },
        { status: 404 }
      )
    }

    // Vérifier que l'événement n'a pas encore eu lieu
    if (registration.event.startDate && new Date(registration.event.startDate) < new Date()) {
      return NextResponse.json(
        { error: 'Impossible d\'annuler une inscription à un événement passé' },
        { status: 400 }
      )
    }

    // Supprimer l'inscription
    await prisma.eventRegistration.delete({
      where: {
        id: registrationId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Inscription annulée avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de l\'inscription' },
      { status: 500 }
    )
  }
}
