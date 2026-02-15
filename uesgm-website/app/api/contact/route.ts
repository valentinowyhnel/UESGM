import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Schéma de validation côté serveur
const validateContact = {
  name: (value: string) => {
    if (!value || value.length < 2 || value.length > 100) {
      throw new Error("Le nom doit contenir entre 2 et 100 caractères")
    }
    if (!/^[a-zA-Z\s\-\'À-ÿ]+$/.test(value)) {
      throw new Error("Format de nom invalide")
    }
    return value.trim()
  },
  email: (value: string) => {
    if (!value || !value.includes('@') || value.length > 255) {
      throw new Error("Email invalide")
    }
    return value.toLowerCase().trim()
  },
  subject: (value: string) => {
    if (value && (value.length < 5 || value.length > 200)) {
      throw new Error("Le sujet doit contenir entre 5 et 200 caractères")
    }
    return value?.trim() || ''
  },
  message: (value: string) => {
    if (!value || value.length < 10 || value.length > 2000) {
      throw new Error("Le message doit contenir entre 10 et 2000 caractères")
    }
    return value.replace(/<script[^>]*>.*?<\/script>/gi, '').trim()
  }
}

// Rate limiting simple
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
  
  try {
    console.log("📨 POST /api/contact - Version Supabase Direct")
    
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req)
    const rateLimitResult = checkRateLimit(rateLimitKey)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: "Trop de requêtes. Veuillez réessayer dans 15 minutes." 
      }, { 
        status: 429,
        headers: {
          'Retry-After': '900',
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0'
        }
      })
    }
    
    // Parser les données
    const contentType = req.headers.get('content-type') || ''
    let validatedData: any
    
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      console.log("📋 FormData détecté")
      
      // Parser FormData
      const formData = await req.formData()
      validatedData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string || '',
        message: formData.get('message') as string
      }
      
    } else if (contentType.includes('application/json')) {
      console.log("📋 JSON détecté")
      
      // Parser JSON
      try {
        const body = await req.json()
        validatedData = body
      } catch (parseError: any) {
        console.error("❌ Erreur parsing JSON:", parseError)
        return NextResponse.json({ 
          error: "Erreur lors de l'insertion dans la base de données",
          details: parseError.message
        }, { status: 500 })
      }
    } else {
      console.log("🚫 Content-Type non supporté:", contentType)
      return NextResponse.json({ 
        error: "Content-Type non supporté. Utilisez application/json ou multipart/form-data",
        contentType: contentType
      }, { status: 400 })
    }
    
    // Validation des données
    try {
      const validated = {
        name: validateContact.name(validatedData.name),
        email: validateContact.email(validatedData.email),
        subject: validateContact.subject(validatedData.subject),
        message: validateContact.message(validatedData.message)
      }
      
      console.log("✅ Données validées:", validatedData)
      
      // Insérer avec Prisma
      const data = await prisma.contactMessage.create({
        data: {
          name: validated.name,
          email: validated.email,
          subject: validated.subject,
          message: validated.message,
        },
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          message: true,
          createdAt: true,
        }
      })
      
      console.log("✅ Message inséré avec Prisma:", data)
      
      const processingTime = Date.now() - startTime
      console.log(`⏱️ Requête traitée en ${processingTime}ms`)
      
      return NextResponse.json({ 
        success: true, 
        id: data.id,
        message: "Message reçu avec succès et sauvegardé !",
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        database: "Prisma + Supabase PostgreSQL"
      }, { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          'X-Processing-Time': `${processingTime}ms`
        }
      })
      
    } catch (error: any) {
      const processingTime = Date.now() - startTime
      console.error(`❌ Erreur API contact (${processingTime}ms):`, error)
      
      return NextResponse.json({ 
        error: error.message || "Erreur interne du serveur",
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`
      }, { 
        status: 500,
        headers: {
          'X-Processing-Time': `${processingTime}ms`
        }
      })
    }
  } catch (outerError: any) {
    const processingTime = Date.now() - startTime
    console.error(`❌ Erreur API contact externe (${processingTime}ms):`, outerError)
    
    return NextResponse.json({ 
      error: "Erreur interne du serveur",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    }, { 
      status: 500,
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
