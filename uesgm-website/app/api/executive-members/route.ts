import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createExecutiveMemberSchema } from "@/lib/validation-schemas"
import { requireRole } from "@/lib/auth/requireRole"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const members = await prisma.executiveMember.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" }
    })
    return NextResponse.json(members)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(Role.ADMIN)
  if (!auth.authorized) return auth.response

  try {
    const body = await req.json()
    const validatedData = createExecutiveMemberSchema.parse(body)

    const member = await prisma.executiveMember.create({
      data: validatedData
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
