import * as Sentry from "@sentry/nextjs";

/**
 * UESGM Monitoring Configuration
 * Sentry is used for error tracking and performance monitoring.
 * In a real production setup, ensure SENTRY_DSN is set in environment variables.
 */

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initMonitoring() {
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      environment: process.env.NODE_ENV,
    });
    console.log("📊 Monitoring initialized with Sentry");
  } else {
    console.log("ℹ️ Monitoring disabled (Dev mode or missing DSN)");
  }
}

/**
 * Custom Metric Logger (Placeholder for Prometheus/Datadog)
 */
export function logMetric(name: string, value: number, tags: Record<string, string> = {}) {
  // Logic to push to Datadog or Prometheus Pushgateway
  if (process.env.NODE_ENV === 'production') {
    // console.log(`[METRIC] ${name}: ${value}`, tags);
  }
}
