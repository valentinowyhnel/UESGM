import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const searchSchema = z.object({
  query: z.string().min(2),
  type: z.enum(["all", "events", "projects", "documents", "partners"]).default("all"),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const { query, type } = searchSchema.parse({
      query: searchParams.get("query"),
      type: searchParams.get("type") || "all"
    })

    const results: any = {}

    if (type === "all" || type === "events") {
      results.events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          published: true,
        },
        take: 5,
      })
    }

    if (type === "all" || type === "projects") {
      results.projects = await prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      })
    }

    if (type === "all" || type === "documents") {
      results.documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          published: true,
        },
        take: 5,
      })
    }

    if (type === "all" || type === "partners") {
      results.partners = await prisma.partner.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 5,
      })
    }

    return NextResponse.json({
      success: true,
      data: results,
      query,
      type
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Paramètres invalides", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
