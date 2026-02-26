import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { contactRateLimit } from "@/lib/rate-limit"

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(5000),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const { success, limit, reset, remaining } = await contactRateLimit.limit(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      )
    }

    // 2. Validation
    const body = await req.json()
    const validatedData = contactSchema.parse(body)

    // 3. Save to DB
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject || "No Subject",
        message: validatedData.message,
        ip: ip,
      }
    })

    // 4. Send Notification (Mock for now)
    console.log(`Notification email would be sent to contact@uesgm.ma for message ${contactMessage.id}`)

    return NextResponse.json(
      { ok: true, id: contactMessage.id },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        }
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("Contact API Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
