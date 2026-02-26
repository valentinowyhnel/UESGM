import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth/auth-options"
import { hasRequiredRole } from "@/lib/auth/rbac"

const projectSchema = z.object({
  title: z.string().min(3),
  category: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  status: z.string(),
  summary: z.string().optional(),
})

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error("GET Projects Error:", error)
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
    const validatedData = projectSchema.parse(body)

    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .trim()

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        slug,
      },
    })

    return NextResponse.json({ success: true, data: project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST Project Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
