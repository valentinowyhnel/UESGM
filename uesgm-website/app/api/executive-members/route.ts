import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isAdmin } from "@/lib/auth-utils"

const memberSchema = z.object({
  name: z.string().min(2),
  position: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  order: z.number().int().default(0),
})

export async function GET() {
  try {
    const members = await prisma.executiveMember.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    const body = await req.json()
    const validated = memberSchema.parse(body)
    const member = await prisma.executiveMember.create({ data: validated })
    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })
    const body = await req.json()
    const validated = memberSchema.partial().parse(body)
    const member = await prisma.executiveMember.update({ where: { id }, data: validated })
    return NextResponse.json({ success: true, data: member })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })
    await prisma.executiveMember.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Membre supprimé" })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
