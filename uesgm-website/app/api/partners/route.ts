import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { Role, PartnerType } from "@prisma/client"
import { requireRole } from "@/lib/auth/requireRole"

const partnerSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  type: z.nativeEnum(PartnerType),
  description: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as PartnerType | null
    const activeOnly = searchParams.get("active") === "true"

    const where: any = {}
    if (type) where.type = type
    if (activeOnly) where.isActive = true

    const partners = await prisma.partner.findMany({
      where,
      orderBy: { order: "asc" }
    })

    return NextResponse.json({ success: true, data: partners })
  } catch (error) {
    console.error("GET /api/partners error:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response } = await requireRole(Role.ADMIN)
  if (!authorized) return response

  try {
    const body = await request.json()
    const validatedData = partnerSchema.parse(body)

    const partner = await prisma.partner.create({
      data: {
        ...validatedData,
        logo: validatedData.logoUrl // Backward compatibility
      }
    })

    return NextResponse.json({ success: true, data: partner }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/partners error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la création" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { authorized, response } = await requireRole(Role.ADMIN)
  if (!authorized) return response

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 })

    const validatedData = partnerSchema.partial().parse(data)

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...validatedData,
        logo: validatedData.logoUrl !== undefined ? validatedData.logoUrl : undefined
      }
    })

    return NextResponse.json({ success: true, data: partner })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("PUT /api/partners error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { authorized, response } = await requireRole(Role.SUPER_ADMIN)
  if (!authorized) return response

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 })

    await prisma.partner.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Partenaire supprimé" })
  } catch (error) {
    console.error("DELETE /api/partners error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
