import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { ContactRateLimiter } from "@/lib/rate-limit"

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(5000),
})

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    const limitResult = await ContactRateLimiter.checkContact(ip)
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { success: false, error: limitResult.message },
        { status: 429, headers: limitResult.headers }
      )
    }

    const body = await request.json()
    const validatedData = contactSchema.parse(body)
    
    const message = await prisma.contactMessage.create({
      data: {
        ...validatedData,
        ip,
        userAgent: request.headers.get('user-agent'),
      }
    })

    // Placeholder for email notification
    console.log(`New contact message from ${validatedData.email}: ${validatedData.subject}`)

    return NextResponse.json(
      {
        success: true, 
        id: message.id,
        message: "Message reçu avec succès et sauvegardé !",
        timestamp: new Date().toISOString()
      },
      { status: 201, headers: limitResult.headers }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/contact error:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
