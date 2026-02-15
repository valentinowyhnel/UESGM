import { prisma } from "../lib/prisma"
import bcrypt from "bcryptjs"
import { validatePassword } from "../lib/password-policy"

async function createSuperAdmin() {
    const email = "president@uesgm.ma"
    const password = "UESGM_President_2025_Secret!" // Complies with policy
    const name = "Président UESGM"

    if (!validatePassword(password)) {
        console.error("Le mot de passe ne respecte pas la politique de sécurité.")
        return
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: "SUPER_ADMIN",
                name: name
            },
            create: {
                email,
                password: hashedPassword,
                role: "SUPER_ADMIN",
                name: name
            }
        })
        console.log("Super Admin créé/mis à jour avec succès :", user.email)
    } catch (error) {
        console.error("Erreur lors de la création du Super Admin :", error)
    } finally {
        await prisma.$disconnect()
    }
}

createSuperAdmin()
