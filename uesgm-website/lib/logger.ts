import * as Sentry from "@sentry/nextjs"

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || "")
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || "")
    Sentry.captureMessage(message, "warning")
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || "")
    Sentry.captureException(error || new Error(message))
  },
  trackMetric: (name: string, value: number, tags?: Record<string, string>) => {
    // This could send to Datadog or Prometheus
    console.log(`[METRIC] ${name}: ${value}`, tags || "")
  }
}
