import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ city: string }> }
) {
    try {
        const { city } = await params

        // 1. Fetch Antenne details from the database
        const antenne = await prisma.antenne.findFirst({
            where: {
                city: {
                    equals: city,
                    mode: 'insensitive'
                }
            }
        })

        // 2. Compter les utilisateurs (pas de groupBy par établissement car User n'a pas ce champ)
        const userCount = await prisma.user.count()

        const formattedStats = [
            {
                establishment: 'Total utilisateurs',
                count: userCount
            }
        ]

        return NextResponse.json({
            antenne,
            stats: formattedStats
        })

    } catch (error) {
        console.error("Error fetching antenna stats:", error)
        return NextResponse.json(
            { message: "Erreur lors de la récupération des statistiques." },
            { status: 500 }
        )
    }
}
