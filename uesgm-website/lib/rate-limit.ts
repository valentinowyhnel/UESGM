import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialisation de Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
})

// Création des limiteurs pour différents usages
export const globalRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1000, "1 h"),
  analytics: true,
  prefix: "uesgm:global",
})

export const contactRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: true,
  prefix: "uesgm:contact",
})

export const authRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  analytics: true,
  prefix: "uesgm:auth",
})

export const uploadRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  analytics: true,
  prefix: "uesgm:upload",
})

/**
 * Basic Rate Limiter helper for middleware
 */
export async function rateLimit(options: {
    id: string;
    limit: number;
    windowMs: number;
}) {
    // Si Redis n'est pas configuré, on laisse passer en dev
    if (!process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV !== 'production') {
        return true
    }

    try {
        const ratelimit = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs} ms`),
            prefix: "uesgm:mw",
        })

        const { success } = await ratelimit.limit(options.id)
        return success
    } catch (error) {
        console.error("Rate limiting error:", error)
        // En cas d'erreur Redis, on laisse passer pour ne pas bloquer le site
        return true
    }
}
