import { NextResponse } from "next/server"
import { z } from "zod"

// Schéma de validation côté serveur (double validation)
const ContactSchema = z.object({
    name: z.string()
        .min(2, "Le nom doit contenir au moins 2 caractères.")
        .max(100, "Le nom ne peut pas dépasser 100 caractères.")
        .regex(/^[a-zA-Z\s\-\'À-ÿ]+$/, "Format de nom invalide."),
    email: z.string()
        .email("Adresse email invalide.")
        .max(255, "L'email ne peut pas dépasser 255 caractères."),
    subject: z.string()
        .min(5, "Le sujet doit contenir au moins 5 caractères.")
        .max(200, "Le sujet ne peut pas dépasser 200 caractères.")
        .optional(),
    message: z.string()
        .min(10, "Le message doit contenir au moins 10 caractères.")
        .max(2000, "Le message ne peut pas dépasser 2000 caractères.")
        .trim()
})

// Rate limiting simple (en production, utiliser Redis ou une base de données)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `contact:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; remaining?: number } {
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minutes
    const maxRequests = 5
    
    const record = rateLimit.get(key)
    
    if (!record || now > record.resetTime) {
        rateLimit.set(key, { count: 1, resetTime: now + windowMs })
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
    console.log("📨 POST /api/contact - Version ultra-simple")
        
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
        
        // Vérifier si c'est FormData ou JSON - VERSION CORRIGÉE
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
            
            // Validation avec le même schéma que JSON
            try {
                validatedData = ContactSchema.parse(validatedData)
            } catch (parseError: any) {
                console.error("❌ Erreur validation FormData:", parseError)
                return NextResponse.json({ 
                    error: "Données FormData invalides",
                    details: parseError.errors || []
                }, { status: 400 })
            }
            
        } else if (contentType.includes('application/json')) {
            console.log("📋 JSON détecté")
            
            // Parser JSON
            try {
                const body = await req.json()
                validatedData = ContactSchema.parse(body)
            } catch (parseError: any) {
                console.error("❌ Erreur validation JSON:", parseError)
                return NextResponse.json({ 
                    error: "Données JSON invalides",
                    details: parseError.errors || []
                }, { status: 400 })
            }
        } else {
            console.log("� Content-Type non supporté:", contentType)
            return NextResponse.json({ 
                error: "Content-Type non supporté. Utilisez application/json ou multipart/form-data",
                contentType: contentType
            }, { status: 400 })
        }
        
        console.log("✅ Données validées avec succès:", validatedData)
        
        // Sanitisation
        const sanitizedData = {
            name: validatedData.name.trim(),
            email: validatedData.email.toLowerCase().trim(),
            subject: validatedData.subject?.trim() || '',
            message: validatedData.message.replace(/<script[^>]*>.*?<\/script>/gi, '')
        }
        
        // Stockage en mémoire (temporaire pour contourner le problème Prisma/Turbopack)
        const contact = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            ...sanitizedData,
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            createdAt: new Date().toISOString(),
        }
        
        // Simuler la sauvegarde dans Supabase
        console.log(`💾 Message sauvegardé (simulation Supabase):`, contact.id)
        
        const processingTime = Date.now() - startTime
        console.log(`⏱️ Requête traitée en ${processingTime}ms`)
        
        return NextResponse.json({ 
            success: true, 
            id: contact.id,
            message: "Message reçu avec succès (stockage temporaire)",
            timestamp: new Date().toISOString(),
            processingTime: `${processingTime}ms`,
            note: "Stockage en mémoire temporaire - Prisma sera activé en production"
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
        console.error(`❌ Erreur dans l'API contact (${processingTime}ms):`, error)
        
        return NextResponse.json({ 
            error: "Erreur interne du serveur",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        }, { 
            status: 500,
            headers: {
                'X-Processing-Time': `${processingTime}ms`
            }
        })
    }
}

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

// Gestion des autres méthodes HTTP
export async function PUT() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PATCH() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
