import { compare, hash } from "bcryptjs"

const PIN_SALT_ROUNDS = 10

/**
 * Validate the security PIN against the environment variable
 */
export async function validateSecurityPin(pin: string): Promise<boolean> {
    const masterPin = process.env.SUPER_ADMIN_PIN
    if (!masterPin) return false

    // The PIN in .env can be plain text for simplicity in this demo, 
    // or hashed for maximum security. Here we compare directly for the portal.
    return pin === masterPin
}

/**
 * Helper to check if a string is a valid 6-digit PIN
 */
export function isValidPinFormat(pin: string): boolean {
    return /^\d{6}$/.test(pin)
}
