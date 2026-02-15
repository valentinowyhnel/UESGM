import { LRUCache } from 'lru-cache'

// Rate limiting production-grade pour les contacts
const contactCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 1000, // Max 1000 IPs
  ttl: 1000 * 60 * 15, // 15 minutes
})

const dailyCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24 heures
})

interface RateLimitResult {
  allowed: boolean
  remaining?: number
  resetTime?: number
}

export class ContactRateLimiter {
  static async checkShortTerm(ip: string): Promise<RateLimitResult> {
    const now = Date.now()
    const key = `contact:${ip}`
    const record = contactCache.get(key)

    if (!record || now > record.resetTime) {
      const newRecord = {
        count: 1,
        resetTime: now + (10 * 60 * 1000) // 10 minutes
      }
      contactCache.set(key, newRecord)
      return { allowed: true, remaining: 4, resetTime: newRecord.resetTime }
    }

    if (record.count >= 5) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    contactCache.set(key, record)
    return { allowed: true, remaining: 5 - record.count, resetTime: record.resetTime }
  }

  static async checkDaily(ip: string): Promise<RateLimitResult> {
    const now = Date.now()
    const key = `daily:${ip}`
    const record = dailyCache.get(key)

    if (!record || now > record.resetTime) {
      const newRecord = {
        count: 1,
        resetTime: now + (24 * 60 * 60 * 1000) // 24 heures
      }
      dailyCache.set(key, newRecord)
      return { allowed: true, remaining: 19, resetTime: newRecord.resetTime }
    }

    if (record.count >= 20) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    dailyCache.set(key, record)
    return { allowed: true, remaining: 20 - record.count, resetTime: record.resetTime }
  }

  static async checkContact(ip: string): Promise<{
    allowed: boolean
    headers: Record<string, string>
    message?: string
  }> {
    const shortLimit = await this.checkShortTerm(ip)
    const dailyLimit = await this.checkDaily(ip)

    if (!shortLimit.allowed) {
      return {
        allowed: false,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(shortLimit.resetTime!).toUTCString(),
          'Retry-After': Math.ceil((shortLimit.resetTime! - Date.now()) / 1000).toString()
        },
        message: "Trop de messages. Veuillez réessayer dans 10 minutes."
      }
    }

    if (!dailyLimit.allowed) {
      return {
        allowed: false,
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(dailyLimit.resetTime!).toUTCString(),
          'Retry-After': Math.ceil((dailyLimit.resetTime! - Date.now()) / 1000).toString()
        },
        message: "Limite quotidienne atteinte. Veuillez réessayer demain."
      }
    }

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': shortLimit.remaining!.toString(),
        'X-RateLimit-Reset': new Date(shortLimit.resetTime!).toUTCString()
      }
    }
  }
}

/**
 * Basic Rate Limiter (legacy)
 */
export async function rateLimit(options: {
    id: string;
    limit: number;
    windowMs: number;
}) {
    const { id, limit, windowMs } = options
    const key = `ratelimit_${id}`
    const currentUsage = (contactCache.get(key) as { count: number; resetTime: number } | undefined)?.count || 0

    if (currentUsage >= limit) {
        return false
    }

    const record = { count: currentUsage + 1, resetTime: Date.now() + windowMs }
    contactCache.set(key, record, { ttl: windowMs })
    return true
}

export const SecurityLimits = {
    LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },
    FORMS: { limit: 10, windowMs: 60 * 60 * 1000 },
    API_GLOBAL: { limit: 100, windowMs: 60 * 60 * 1000 },
}
