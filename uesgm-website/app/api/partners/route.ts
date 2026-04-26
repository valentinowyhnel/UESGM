import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isAdmin } from "@/lib/auth-utils"

const partnerSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  contact: z.string().optional(),
})

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: partners })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    const body = await req.json()
    const validated = partnerSchema.parse(body)
    const partner = await prisma.partner.create({ data: validated })
    return NextResponse.json({ success: true, data: partner }, { status: 201 })
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
    const validated = partnerSchema.partial().parse(body)
    const partner = await prisma.partner.update({ where: { id }, data: validated })
    return NextResponse.json({ success: true, data: partner })
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
    await prisma.partner.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Partenaire supprimé" })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
