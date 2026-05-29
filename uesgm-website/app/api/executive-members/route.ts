import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createExecutiveMemberSchema } from "@/lib/validation-schemas"
import { z } from "zod"

export async function GET() {
  try {
    const members = await prisma.executiveMember.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validated = createExecutiveMemberSchema.parse(body)
    const member = await prisma.executiveMember.create({
      data: validated as any
    })
    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 })
  }
}
