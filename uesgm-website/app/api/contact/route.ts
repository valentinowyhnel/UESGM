import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schéma de validation avec Zod
const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide"),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères").max(200).optional().or(z.literal('')),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000)
})

// Rate limiting simple (Amélioration possible avec Redis comme demandé)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `contact:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; remaining?: number } {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 5
  
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req)
    const rateLimitResult = checkRateLimit(rateLimitKey)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: "Trop de requêtes. Veuillez réessayer dans 15 minutes." 
      }, { 
        status: 429,
        headers: {
          'Retry-After': '900'
        }
      })
    }
    
    // Parser les données
    const body = await req.json()
    
    // Validation avec Zod
    const validation = contactSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ 
        error: "Données invalides",
        details: validation.error.format()
      }, { status: 400 })
    }
    
    const { name, email, subject, message } = validation.data

    // Insérer avec Prisma
    const data = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || "Sans objet",
        message,
        ip: rateLimitKey.split(':')[1]
      }
    })

    // Logique d'envoi d'email pourrait être ajoutée ici

    const processingTime = Date.now() - startTime
    
    return NextResponse.json({ 
      success: true,
      id: data.id,
      message: "Message reçu avec succès !"
    }, { 
      status: 201,
      headers: {
        'X-Processing-Time': `${processingTime}ms`
      }
    })

  } catch (error: any) {
    console.error("❌ Erreur API contact:", error)
    return NextResponse.json({
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}
