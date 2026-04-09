import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  subject: z.string().min(5).max(200).optional().or(z.literal('')),
  message: z.string().min(10).max(2000),
})

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    const body = await req.json()
    const validated = ContactSchema.parse(body)
    
    // Insérer avec Prisma
    const data = await prisma.contactMessage.create({
      data: {
        name: validated.name,
        email: validated.email,
        subject: validated.subject || null,
        message: validated.message,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
      },
    })
    
    const processingTime = Date.now() - startTime
    
    return NextResponse.json({ 
      success: true,
      id: data.id,
      message: "Message reçu avec succès !",
      timestamp: new Date().toISOString(),
    }, { 
      status: 201,
      headers: {
        'X-Processing-Time': `${processingTime}ms`
      }
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error(`❌ Erreur API contact:`, error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
