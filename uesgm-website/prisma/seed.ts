import { Pool } from 'pg'
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error("❌ DATABASE_URL is not defined in your .env file")
}

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Initialisation de Prisma avec la configuration standard
const prisma = new PrismaClient({
    datasources: {
        db: { url: connectionString },
    },
})

async function main() {
    const email = "president@uesgm.ma"
    const password = "UESGM_President_2025_Secret!" // Complies with policy (Min 12, Mix chars)
    const name = "Président UESGM"

    console.log("🌱 Démarrage du seeding...")

    const hashedPassword = await bcrypt.hash(password, 12)

    const superAdmin = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: "SUPER_ADMIN", // This must match the Role enum in schema.prisma
            name: name
        },
        create: {
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            name: name
        }
    })

    console.log(`✅ Super Admin par défaut créé/mis à jour : ${superAdmin.email}`)
    console.log(`🔑 Mot de passe : ${password}`)

    // Seeding Antennes
    const antennes = [
        { city: "Casablanca", responsable: "Ahmed Alaoui", email: "casa@uesgm.ma", phone: "+212 600 000 001" },
        { city: "Rabat", responsable: "Fatima Zahra", email: "rabat@uesgm.ma", phone: "+212 600 000 002" },
        { city: "Marrakech", responsable: "Youssef Mansouri", email: "kech@uesgm.ma", phone: "+212 600 000 003" }
    ]

    for (const antenne of antennes) {
        await prisma.antenne.upsert({
            where: { id: `seed-${antenne.city.toLowerCase()}` },
            update: antenne,
            create: { id: `seed-${antenne.city.toLowerCase()}`, ...antenne }
        })
    }
    console.log("✅ Antennes initiales créées.")

    console.log("🚀 Seeding terminé avec succès.")
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seeding :", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
