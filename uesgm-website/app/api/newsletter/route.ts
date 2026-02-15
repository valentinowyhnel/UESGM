import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Schéma de validation
const NewsletterSchema = z.object({
  email: z.string().email().max(255),
})

// GET - Liste des abonnés (admin uniquement)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per = Math.min(50, Math.max(1, parseInt(searchParams.get('per') || '10')))
    const active = searchParams.get('active')

    const where: any = {}
    if (active !== null) {
      where.isActive = active === 'true'
    }

    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        select: {
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
        }
      }),
      prisma.newsletter.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: subscribers,
      pagination: {
        page,
        per,
        total,
        pages: Math.ceil(total / per),
        hasNext: page * per < total,
      },
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/newsletter:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - S'abonner à la newsletter
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = NewsletterSchema.parse(body)

    // Vérifier si l'email est déjà abonné
    const existingSubscriber = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          { error: 'Cet email est déjà abonné à la newsletter' },
          { status: 400 }
        )
      } else {
        // Réactiver l'abonnement
        const subscriber = await prisma.newsletter.update({
          where: { email },
          data: { isActive: true }
        })

        return NextResponse.json(
          { 
            success: true, 
            data: subscriber,
            message: 'Abonnement réactivé avec succès'
          }
        )
      }
    }

    // Créer un nouvel abonnement
    const subscriber = await prisma.newsletter.create({
      data: {
        email,
        isActive: true,
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        data: subscriber,
        message: 'Abonnement à la newsletter réussi !'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Erreur POST /api/newsletter:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Email invalide', details: error.errors },
        { status: 400 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Cet email est déjà abonné à la newsletter' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Se désabonner de la newsletter
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis pour se désabonner' },
        { status: 400 }
      )
    }

    const subscriber = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Aucun abonnement trouvé pour cet email' },
        { status: 404 }
      )
    }

    // Désactiver l'abonnement (au lieu de supprimer pour garder l'historique)
    await prisma.newsletter.update({
      where: { email },
      data: { isActive: false }
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Désabonnement réussi. Vous ne recevrez plus nos newsletters.'
      }
    )
  } catch (error) {
    console.error('❌ Erreur DELETE /api/newsletter:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour le statut d'un abonné (admin uniquement)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { email, isActive } = body

    if (!email || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Email et statut isActive requis' },
        { status: 400 }
      )
    }

    const subscriber = await prisma.newsletter.update({
      where: { email },
      data: { isActive }
    })

    return NextResponse.json(
      { 
        success: true, 
        data: subscriber,
        message: `Abonné ${isActive ? 'activé' : 'désactivé'} avec succès`
      }
    )
  } catch (error: any) {
    console.error('❌ Erreur PUT /api/newsletter:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Abonné non trouvé' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
