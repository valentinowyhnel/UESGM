import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPartnerSchema } from "@/lib/validation-schemas"
import { z } from "zod"

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ success: true, data: partners })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role === 'MEMBER') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validated = createPartnerSchema.parse(body)
    const partner = await prisma.partner.create({
      data: validated as any
    })
    return NextResponse.json({ success: true, data: partner }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 })
  }
}
