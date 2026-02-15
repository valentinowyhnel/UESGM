import { NextResponse } from "next/server"
import { ContactServiceV2, ContactSchema } from "@/lib/contact-service-v2"
import { ContactRateLimiter } from "@/lib/rate-limit"

// Helper pour extraire l'IP client
function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const clientIP = req.headers.get('x-client-ip')
  
  return forwarded?.split(',')[0]?.trim() || 
         realIP || 
         clientIP || 
         'unknown'
}

// Helper pour extraire le User-Agent
function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown'
}

// Helper pour extraire le pays (optionnel, via API)
async function getCountryFromIP(ip: string): Promise<string | undefined> {
  if (ip === 'unknown') return undefined
  
  try {
    // Simulation - en production, utiliser une vraie API comme ipapi.co
    // const response = await fetch(`https://ipapi.co/${ip}/json/`)
    // const data = await response.json()
    // return data.country_name
    
    // Pour la démo, on retourne un pays aléatoire
    const countries = ['Maroc', 'France', 'Gabon', 'Sénégal', 'Côte d\'Ivoire']
    return countries[Math.floor(Math.random() * countries.length)]
  } catch {
    return undefined
  }
}

// GET method - Refuser explicitement
export async function GET() {
  return NextResponse.json({
    error: "Méthode GET non autorisée",
    method: "POST",
    endpoint: "/api/contact-v2"
  }, { 
    status: 405,
    headers: {
      'Allow': 'POST',
      'Content-Type': 'application/json'
    }
  })
}

// POST method - Pipeline production-grade
export async function POST(req: Request) {
  const startTime = Date.now()
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.info("📨 POST /api/contact-v2 - Pipeline production", { requestId })

    // 1️⃣ Rate limiting
    const clientIP = getClientIP(req)
    const rateLimitResult = await ContactRateLimiter.checkContact(clientIP)
    
    if (!rateLimitResult.allowed) {
      console.warn("🚫 Rate limit dépassé", { 
        requestId, 
        ip: clientIP, 
        message: rateLimitResult.message 
      })
      
      return NextResponse.json({
        error: rateLimitResult.message,
        requestId,
        retryAfter: rateLimitResult.headers['Retry-After']
      }, { 
        status: 429,
        headers: rateLimitResult.headers
      })
    }

    // 2️⃣ Parser et valider les données
    let rawData: any
    
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      try {
        rawData = await req.json()
      } catch (error) {
        console.error("❌ JSON parsing error:", { requestId, error })
        return NextResponse.json({
          error: "JSON invalide",
          requestId
        }, { status: 400 })
      }
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded') || !contentType) {
      try {
        // Essayer d'abord de parser comme JSON (pour URLSearchParams)
        try {
          const text = await req.text()
          console.log("📋 Texte brut reçu:", text)
          
          // Parser manuellement les données form-urlencoded
          const params = new URLSearchParams(text)
          const data: Record<string, string> = {}
          
          for (const [key, value] of params.entries()) {
            data[key] = value
          }
          
          rawData = {
            name: data.name || '',
            email: data.email || '',
            subject: data.subject || '',
            message: data.message || '',
            company: data.company || '' // Honeypot
          }
          
          console.log("📋 Données parsées (URLSearchParams):", rawData)
        } catch (textError) {
          // Si ça échoue, essayer FormData
          const formData = await req.formData()
          const data: Record<string, string> = {}
          
          for (const [key, value] of formData.entries()) {
            data[key] = value.toString()
          }
          
          rawData = {
            name: data.name || '',
            email: data.email || '',
            subject: data.subject || '',
            message: data.message || '',
            company: data.company || '' // Honeypot
          }
          
          console.log("📋 Données parsées (FormData):", rawData)
        }
      } catch (error) {
        console.error("❌ FormData parsing error:", { requestId, error })
        return NextResponse.json({
          error: "Erreur lecture formulaire",
          requestId
        }, { status: 400 })
      }
    } else {
      return NextResponse.json({
        error: "Content-Type non supporté",
        requestId,
        supported: ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']
      }, { status: 400 })
    }

    // 3️⃣ Honeypot detection (anti-bot ultra efficace)
    if (rawData.company && rawData.company.toString().trim() !== '') {
      console.warn("🕸️ Honeypot déclenché - Bot détecté", { 
        requestId, 
        ip: clientIP,
        honeypotValue: rawData.company 
      })
      
      // Simuler un succès pour ne pas alerter le bot
      return NextResponse.json({
        success: true,
        message: "Message reçu avec succès",
        requestId
      }, { status: 200 })
    }

    // 4️⃣ Validation Zod (côté serveur - obligatoire)
    const validationResult = ContactSchema.safeParse(rawData)
    
    if (!validationResult.success) {
      console.warn("❌ Validation échouée", { 
        requestId, 
        errors: validationResult.error.issues,
        data: { email: rawData.email, name: rawData.name }
      })
      
      return NextResponse.json({
        error: "Données invalides",
        details: validationResult.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        })),
        requestId
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // 5️⃣ Extraction métadonnées
    const userAgent = getUserAgent(req)
    const country = await getCountryFromIP(clientIP)
    
    const metadata = {
      ip: clientIP,
      userAgent,
      country
    }

    console.info("✅ Données validées", {
      requestId,
      email: validatedData.email,
      name: validatedData.name,
      metadata
    })

    // 6️⃣ Pipeline de traitement
    const result = await ContactServiceV2.submitMessage(validatedData, metadata)

    const processingTime = Date.now() - startTime
    console.info(`⏱️ Requête traitée en ${processingTime}ms`, { requestId })

    // 7️⃣ Réponse succès avec headers de rate limiting
    return NextResponse.json({
      success: true,
      id: result.id,
      message: result.message,
      spamScore: result.spamScore,
      isSpam: result.isSpam,
      requestId,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    }, {
      status: 201,
      headers: {
        ...rateLimitResult.headers,
        'X-Processing-Time': `${processingTime}ms`,
        'X-Request-ID': requestId
      }
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    
    console.error("❌ Erreur pipeline contact:", {
      requestId,
      error: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`
    })

    // En production, envoyer à Sentry
    // Sentry.captureException(error, { extra: { requestId } })

    return NextResponse.json({
      error: "Erreur interne du serveur",
      message: "Une erreur est survenue lors du traitement de votre message",
      requestId,
      processingTime: `${processingTime}ms`
    }, {
      status: 500,
      headers: {
        'X-Processing-Time': `${processingTime}ms`,
        'X-Request-ID': requestId
      }
    })
  }
}

// Autres méthodes - Refuser
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
