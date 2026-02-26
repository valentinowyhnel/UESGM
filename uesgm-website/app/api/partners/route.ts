import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth/auth-options"
import { hasRequiredRole } from "@/lib/auth/rbac"

const partnerSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  contact: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ success: true, data: partners })
  } catch (error) {
    console.error("GET Partners Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasRequiredRole(session.user?.role, "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = partnerSchema.parse(body)

    const partner = await prisma.partner.create({
      data: validatedData,
    })

    return NextResponse.json({ success: true, data: partner }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST Partner Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
