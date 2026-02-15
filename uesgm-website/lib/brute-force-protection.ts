import { LRUCache } from 'lru-cache'

const loginAttempsCache = new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 30, // 30 minutes block
})

/**
 * Track failed login attempts for an IP/Email
 */
export function trackFailedAttempt(identifier: string) {
    const attempts = (loginAttempsCache.get(identifier) as number) || 0
    loginAttempsCache.set(identifier, attempts + 1)
    return attempts + 1
}

/**
 * Check if an identifier is currently blocked
 */
export function isBlocked(identifier: string, threshold = 5) {
    const attempts = (loginAttempsCache.get(identifier) as number) || 0
    return attempts >= threshold
}

/**
 * Clear attempts after successful login
 */
export function resetAttempts(identifier: string) {
    loginAttempsCache.delete(identifier)
}
