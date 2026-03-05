import { Ratelimit } from "@upstash/ratelimit";
import redis from "./redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const globalRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1000, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/global",
});

export const contactRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.tokenBucket(5, "15 m", 1),
    analytics: true,
    prefix: "@upstash/ratelimit/contact",
});

export const authRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    analytics: true,
    prefix: "@upstash/ratelimit/auth",
});

export const uploadRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/upload",
});
