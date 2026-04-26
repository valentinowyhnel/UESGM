import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isAdmin, getSession } from "@/lib/auth-utils"

const documentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().optional(),
  published: z.boolean().default(false),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = { published: true }
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: documents })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const body = await req.json()
    const validated = documentSchema.parse(body)

    const document = await prisma.document.create({
      data: {
        ...validated,
        submittedByEmail: session.user?.email,
        submittedByName: session.user?.name,
        userId: (session.user as any).id,
      }
    })
    return NextResponse.json({ success: true, data: document }, { status: 201 })
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
    const validated = documentSchema.partial().parse(body)
    const document = await prisma.document.update({ where: { id }, data: validated })
    return NextResponse.json({ success: true, data: document })
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
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Document supprimé" })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
