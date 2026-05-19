import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/requireRole"

const memberSchema = z.object({
  name: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  facebook: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("published") !== "false"

    const where: any = {}
    if (activeOnly) where.isActive = true

    const members = await prisma.executiveMember.findMany({
      where,
      orderBy: { order: "asc" }
    })

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error("GET /api/executive-members error:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response } = await requireRole(Role.ADMIN)
  if (!authorized) return response

  try {
    const body = await request.json()
    const validatedData = memberSchema.parse(body)

    const member = await prisma.executiveMember.create({
      data: {
        ...validatedData,
        photo: validatedData.photoUrl // Backward compatibility
      }
    })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("POST /api/executive-members error:", error)
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

    const validatedData = memberSchema.partial().parse(data)

    const member = await prisma.executiveMember.update({
      where: { id },
      data: {
        ...validatedData,
        photo: validatedData.photoUrl !== undefined ? validatedData.photoUrl : undefined
      }
    })

    return NextResponse.json({ success: true, data: member })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Données invalides", details: error.errors }, { status: 400 })
    }
    console.error("PUT /api/executive-members error:", error)
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

    await prisma.executiveMember.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Membre supprimé" })
  } catch (error) {
    console.error("DELETE /api/executive-members error:", error)
    return NextResponse.json({ success: false, error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
