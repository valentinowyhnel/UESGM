import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ContactRateLimiter } from "@/lib/rate-limit"
import DOMPurify from "isomorphic-dompurify"

// Schéma de validation avec Zod
const contactSchema = z.object({
  name: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom est trop long")
    .regex(/^[a-zA-Z\s\-\'À-ÿ]+$/, "Format de nom invalide"),
  email: z.string().email("Email invalide").max(255),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères").max(200).optional().or(z.literal('')),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
})

function getIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0] : 'unknown'
}

// Refuser les requêtes GET - FORCER POST SEULEMENT
export async function GET(req: Request) {
  console.log("🚫 GET /api/contact - REQUÊTE REFUSÉE - FORCER POST SEULEMENT")
  return NextResponse.json({ 
    error: "Méthode GET non autorisée. Utilisez POST uniquement.",
    method: "POST",
    endpoint: "/api/contact",
    timestamp: new Date().toISOString(),
    debug: "Le formulaire doit utiliser POST - vérifiez les attributs method='POST' et onSubmit"
  }, { 
    status: 405,
    headers: {
      'Allow': 'POST',
      'Content-Type': 'application/json'
    }
  })
}

export async function POST(req: Request) {
  const startTime = Date.now()
  const ip = getIP(req)
  
  try {
    console.log(`📨 POST /api/contact - From: ${ip}`)
    
    // Rate limiting
    const rateLimitResult = await ContactRateLimiter.checkContact(ip)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: rateLimitResult.message
      }, { 
        status: 429,
        headers: rateLimitResult.headers
      })
    }
    
    // Parser les données
    const contentType = req.headers.get('content-type') || ''
    let rawData: any
    
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject') || '',
        message: formData.get('message')
      }
    } else if (contentType.includes('application/json')) {
      rawData = await req.json()
    } else {
      return NextResponse.json({ 
        error: "Content-Type non supporté"
      }, { status: 400 })
    }
    
    // Validation des données avec Zod
    const result = contactSchema.safeParse(rawData)
    if (!result.success) {
      return NextResponse.json({ 
        error: "Données invalides",
        details: result.error.format()
      }, { status: 400 })
    }

    const { name, email, subject, message } = result.data

    // Assainissement (Sanitization)
    const cleanMessage = DOMPurify.sanitize(message)
    const cleanSubject = subject ? DOMPurify.sanitize(subject) : null

    // Insérer avec Prisma
    const data = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        subject: cleanSubject,
        message: cleanMessage,
        ip: ip,
        userAgent: req.headers.get('user-agent')
      }
    })

    const processingTime = Date.now() - startTime
    
    return NextResponse.json({ 
      success: true,
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
    console.error(`❌ Erreur API contact:`, error)
    return NextResponse.json({
      error: "Erreur interne du serveur"
    }, { status: 500 })
  }
}

// Gestion des autres méthodes HTTP
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
