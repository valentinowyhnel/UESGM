import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ContactRateLimiter } from "@/lib/rate-limit"

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide"),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères").max(200).optional().or(z.literal('')),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    
    // Rate limiting
    const rateLimitResult = await ContactRateLimiter.checkContact(ip)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429, headers: rateLimitResult.headers }
      )
    }

    const body = await req.json()
    const validatedData = contactSchema.parse(body)

    const message = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject || "Sans sujet",
        message: validatedData.message,
        ip: ip,
      },
    })

    return NextResponse.json(
      { success: true, id: message.id, message: "Message envoyé avec succès !" },
      { status: 201, headers: rateLimitResult.headers }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("Contact API Error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
