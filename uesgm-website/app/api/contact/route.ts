import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10).max(2000),
})

// Rate limiting store (In-memory fallback if Redis is not available)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string) {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000 // 10 minutes
  const maxRequests = 5
  const key = `contact:${ip}`
  
  const record = rateLimitStore.get(key)
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }
  
  if (record.count >= maxRequests) return { allowed: false }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rl = checkRateLimit(ip)
    
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requêtes. Réessayez dans 10 minutes." }, { status: 429 })
    }

    const body = await req.json()
    const validated = ContactSchema.parse(body)

    const message = await prisma.contactMessage.create({
      data: {
        ...validated,
        ip,
      }
    })

    // Here we would typically send an email notification
    // e.g., await sendEmail({ to: 'contact@uesgm.ma', subject: validated.subject, body: validated.message })

    return NextResponse.json({
      success: true,
      id: message.id,
      message: "Message reçu avec succès !"
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
