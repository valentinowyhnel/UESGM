import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isAdmin } from "@/lib/auth-utils"

const projectSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  category: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  status: z.string(),
  summary: z.string().optional(),
})

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!await isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    const body = await req.json()
    const validated = projectSchema.parse(body)
    const project = await prisma.project.create({ data: validated })
    return NextResponse.json({ success: true, data: project }, { status: 201 })
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
    const validated = projectSchema.partial().parse(body)
    const project = await prisma.project.update({ where: { id }, data: validated })
    return NextResponse.json({ success: true, data: project })
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
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Projet supprimé" })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
