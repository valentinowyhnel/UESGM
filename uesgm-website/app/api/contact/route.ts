import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ContactRateLimiter } from "@/lib/rate-limit"

// Schéma de validation Zod
const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(10).max(2000),
})

// Refuser les requêtes GET - FORCER POST SEULEMENT
export async function GET(req: Request) {
  return NextResponse.json({ 
    error: "Méthode GET non autorisée. Utilisez POST uniquement.",
  }, { 
    status: 405,
    headers: { 'Allow': 'POST' }
  })
}

export async function POST(req: Request) {
  const startTime = Date.now()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  try {
    // Rate limiting via lib/rate-limit
    const rateLimitResult = await ContactRateLimiter.checkContact(ip)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: rateLimitResult.message
      }, { 
        status: 429,
        headers: rateLimitResult.headers
      })
    }
    
    const body = await req.json()
    const validatedData = ContactSchema.parse(body)
    
    // Insérer avec Prisma
    const data = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        ip: ip,
        userAgent: userAgent,
      }
    })

    // Simulation d'envoi d'email (à implémenter avec un vrai service)
    console.log(`📧 Notification email envoyée à contact@uesgm.ma pour le message ${data.id}`)
    
    const processingTime = Date.now() - startTime

    return NextResponse.json({
      ok: true,
      id: data.id,
      message: "Message reçu avec succès !",
    }, {
      status: 201,
      headers: {
        ...rateLimitResult.headers,
        'X-Processing-Time': `${processingTime}ms`
      }
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error(`❌ Erreur API contact (${processingTime}ms):`, error)
    
    let status = 500
    let message = "Erreur interne du serveur"
    let details: any = undefined

    if (error instanceof z.ZodError) {
      status = 400
      message = "Données invalides"
      details = error.errors
    }

    return NextResponse.json({ 
      error: message,
      details,
      requestId: `req_${Date.now()}`,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    }, { 
      status,
      headers: {
        'X-Processing-Time': `${processingTime}ms`
      }
    })
  }
}

// Gestion des autres méthodes HTTP
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
