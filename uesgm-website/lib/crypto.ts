import bcrypt from "bcryptjs"
import crypto from "crypto"

const SALT_ROUNDS = 12
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // Must be 32 bytes hex
const IV_LENGTH = 16

/**
 * Hash a password using bcrypt with 12 rounds
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) return text // Fallback if no key, but should warn

    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag().toString('hex')

    return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export function decrypt(data: string): string {
    if (!ENCRYPTION_KEY) return data

    try {
        const [ivHex, authTagHex, encryptedText] = data.split(':')
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (err) {
        console.error("Decryption failed:", err)
        return "[DECRYPTION_ERROR]"
    }
}
