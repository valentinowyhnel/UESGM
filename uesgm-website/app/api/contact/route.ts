import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { contactSchema } from "@/lib/validation-schemas"
import { rateLimit } from "@/lib/rate-limit"
import DOMPurify from "isomorphic-dompurify"

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    // 1. Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const isAllowed = await rateLimit({
      id: `contact:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000 // 5 requests per 15 minutes
    })
    
    if (!isAllowed) {
      return NextResponse.json({ 
        error: "Trop de requêtes. Veuillez réessayer dans 15 minutes." 
      }, { 
        status: 429
      })
    }
    
    // 2. Parse and Validate body
    const body = await req.json()
    const result = contactSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Données invalides",
        details: result.error.format()
      }, { 
        status: 400
      })
    }

    const { name, email, subject, message } = result.data

    // 3. Sanitize inputs (XSS protection)
    const sanitizedMessage = DOMPurify.sanitize(message)
    const sanitizedSubject = subject ? DOMPurify.sanitize(subject) : null

    // 4. Save to Database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        ip,
        userAgent: req.headers.get('user-agent')
      }
    })

    // 5. Mock Email Notification (Production would use SendGrid/Resend/etc)
    console.log(`[MAIL] Nouveau message de contact de ${name} (${email}): ${subject}`)

    const processingTime = Date.now() - startTime
    
    return NextResponse.json({ 
      success: true,
      id: contactMessage.id,
      message: "Votre message a été envoyé avec succès.",
      processingTime: `${processingTime}ms`
    }, { 
      status: 201
    })

  } catch (error: any) {
    console.error("Error in /api/contact:", error)
    return NextResponse.json({
      error: "Une erreur est survenue lors de l'envoi du message."
    }, {
      status: 500
    })
  }
}

// Ensure only POST is allowed
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}
