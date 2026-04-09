import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const globalRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit",
})

export const sensitiveRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@upstash/ratelimit:sensitive",
})

/**
 * Legacy rateLimit function for the middleware
 */
export async function rateLimit(options: { id: string; limit: number; windowMs: number }) {
  const redis = Redis.fromEnv()
  const { id } = options

  const { success } = await sensitiveRateLimit.limit(id)
  return success
}
