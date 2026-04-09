import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth/auth-options"
import { hasRequiredRole } from "@/lib/auth/rbac"

const memberSchema = z.object({
  name: z.string().min(2),
  position: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  order: z.number().int().default(0),
})

export async function GET() {
  try {
    const members = await prisma.executiveMember.findMany({
      orderBy: { order: "asc" },
    })
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error("GET Executive Members Error:", error)
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
    const validatedData = memberSchema.parse(body)

    const member = await prisma.executiveMember.create({
      data: validatedData,
    })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST Executive Member Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
