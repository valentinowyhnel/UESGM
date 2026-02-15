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

// Stockage temporaire en mémoire (remplace la base de données)
const messages: any[] = []

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
        console.log("📨 Requête POST reçue sur /api/contact")
        
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
        
        // Vérification du content-type
        const contentType = req.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
            return NextResponse.json({ 
                error: "Content-Type doit être application/json" 
            }, { status: 400 })
        }
        
        // Parser et valider le body
        let body
        try {
            body = await req.json()
        } catch (parseError) {
            return NextResponse.json({ 
                error: "JSON invalide dans le corps de la requête" 
            }, { status: 400 })
        }
        
        console.log("📋 Données brutes reçues:", body)
        
        // Validation avec Zod
        const validatedData = ContactSchema.parse(body)
        console.log("✅ Données validées avec succès:", validatedData)
        
        // Sanitisation supplémentaire
        const sanitizedData = {
            name: validatedData.name.trim(),
            email: validatedData.email.toLowerCase().trim(),
            subject: validatedData.subject?.trim() || '',
            message: validatedData.message.replace(/<script[^>]*>.*?<\/script>/gi, '') // Protection XSS basique
        }
        
        // Simulation de sauvegarde (remplace la connexion Prisma)
        const contactId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const contact = {
            id: contactId,
            ...sanitizedData,
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        
        // Stockage en mémoire
        messages.push(contact)
        
        console.log("💾 Message sauvegardé en mémoire:", contact)
        console.log(`📊 Total des messages en mémoire: ${messages.length}`)
        
        const processingTime = Date.now() - startTime
        console.log(`⏱️ Requête traitée en ${processingTime}ms`)
        
        return NextResponse.json({ 
            success: true, 
            id: contact.id,
            message: "Message reçu avec succès et sauvegardé (mode temporaire)",
            timestamp: new Date().toISOString(),
            processingTime: `${processingTime}ms`,
            storage: "memory",
            totalMessages: messages.length
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
        
        // Gestion des erreurs Zod
        if (error.name === 'ZodError') {
            return NextResponse.json({ 
                error: "Données invalides", 
                details: (error as any).errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }, { status: 400 })
        }
        
        // Gestion des erreurs de parsing JSON
        if (error instanceof SyntaxError) {
            return NextResponse.json({ 
                error: "Format JSON invalide" 
            }, { status: 400 })
        }
        
        // Erreur serveur générique
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
    return NextResponse.json({ 
        error: "Method not allowed. Please use POST for form submission.",
        allowedMethods: ["POST"],
        documentation: "/api/contact (POST only)"
    }, { 
        status: 405,
        headers: {
            'Allow': 'POST'
        }
    })
}

// Endpoint pour voir les messages stockés (pour débogage)
export async function PATCH(req: Request) {
    return NextResponse.json({ 
        messages: messages,
        total: messages.length,
        storage: "memory",
        note: "Ceci est un stockage temporaire en mémoire. En production, utilisez une vraie base de données."
    })
}

// Gestion des autres méthodes HTTP
export async function PUT() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
