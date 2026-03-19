import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ContactRateLimiter } from "@/lib/rate-limit"

const ContactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Format d'email invalide"),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères").max(200).optional().nullable(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  
  try {
    // Rate Limiting
    const rateLimit = await ContactRateLimiter.checkContact(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { status: 429, headers: rateLimit.headers }
      )
    }

    const body = await req.json()
    const validatedData = ContactSchema.parse(body)

    const message = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject || "Sans objet",
        message: validatedData.message,
        ip: ip,
      }
    })

    // TODO: Send notification email (SendGrid/Supabase SMTP)
    // console.log("Notification email would be sent to contact@uesgm.ma")

    return NextResponse.json(
      { success: true, id: message.id, message: "Votre message a été envoyé avec succès." },
      { status: 201, headers: rateLimit.headers }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }
    console.error("❌ Error in /api/contact:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi du message." },
      { status: 500 }
    )
  }
}
