import { z } from "zod"

/**
 * Strong Password Policy Schema
 * - Min 12 characters
 * - Uppercase, Lowercase, Number, Special character
 */
export const passwordSchema = z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^a-zA-Z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial")

export function validatePassword(password: string) {
    return passwordSchema.safeParse(password).success
}
