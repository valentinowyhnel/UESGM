import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""

    try {
        // If no query, return all antennes for selection
        if (!query || query.length < 2) {
            const allAntennes = await prisma.antenne.findMany({
                select: {
                    id: true,
                    city: true,
                },
                orderBy: { city: 'asc' }
            })
            return NextResponse.json(allAntennes)
        }

        // 1. Rechercher par nom d'utilisateur
        const members = await prisma.user.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            select: {
                name: true,
                email: true,
            },
            take: 5
        })

        // 2. Rechercher par ville (antenne)
        const cities = await prisma.antenne.findMany({
            where: {
                city: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            select: {
                city: true,
            },
            take: 5
        })

        // Formater les résultats
        const results = [
            ...cities.map((c: any) => ({ type: 'antenne', name: c.city, city: c.city })),
            ...members.map((m: any) => ({ type: 'membre', name: m.name, email: m.email }))
        ]

        return NextResponse.json({ results })
    } catch (error) {
        console.error("Search error:", error)
        return NextResponse.json({ results: [] }, { status: 500 })
    }
}
