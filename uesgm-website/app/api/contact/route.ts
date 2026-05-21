import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ContactRateLimiter } from '@/lib/rate-limit'

const ContactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  subject: z.string().optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    
    // Rate limiting
    const rateLimit = await ContactRateLimiter.checkContact(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { status: 429, headers: rateLimit.headers }
      )
    }

    const body = await req.json()
    const validatedData = ContactSchema.parse(body)

    const message = await prisma.contactMessage.create({
      data: {
        ...validatedData,
        ip,
      }
    })

    // Ici, on pourrait ajouter l'envoi d'email via un service tiers

    return NextResponse.json(
      { success: true, id: message.id },
      { status: 201, headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erreur API Contact:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
