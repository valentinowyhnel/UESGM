import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createContactMessageSchema } from "@/lib/validation-schemas"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  const isAllowed = await rateLimit({
    id: `contact:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  })

  if (!isAllowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez réessayer plus tard." },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const validatedData = createContactMessageSchema.parse(body)

    const message = await prisma.contactMessage.create({
      data: {
        ...validatedData,
        ip,
        userAgent: req.headers.get("user-agent")
      }
    })

    // Simuler l'envoi d'un email
    console.log(`[EMAIL SIMULATION] New contact message from ${validatedData.email}: ${validatedData.subject}`)

    return NextResponse.json({ success: true, id: message.id }, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
