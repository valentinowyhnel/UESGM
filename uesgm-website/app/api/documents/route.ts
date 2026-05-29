import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createDocumentSchema } from "@/lib/validation-schemas"
import { z } from "zod"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const documents = await prisma.document.findMany({
      where: {
        ...(category && { category: category as any }),
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: documents })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role === 'MEMBER') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validated = createDocumentSchema.parse(body)
    const document = await prisma.document.create({
      data: {
        ...validated,
        createdById: session.user.id,
        slug: validated.slug || validated.title.toLowerCase().replace(/ /g, '-'),
      } as any
    })
    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
