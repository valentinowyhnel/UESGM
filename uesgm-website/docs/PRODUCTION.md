# Production Considerations for UESGM Website

## Database & RLS (Row Level Security)

### Supabase RLS
If Supabase RLS is enabled, ensure that the Prisma server operations use the `service_role` key via the `SUPABASE_KEY` environment variable.
**Never** expose the `service_role` key to the frontend.

### PgBouncer
For high-concurrency environments, use a Postgres role for Prisma with sufficient rights and enable PgBouncer for connection pooling. Update `DATABASE_URL` to point to the PgBouncer endpoint.

### Migrations
Always run `pnpm exec prisma migrate deploy` in the CI/CD pipeline or manually before deploying to production. Avoid using `migrate dev` in production as it can lead to data loss.

### Backups
1. **Daily Backups**: Configure daily `pg_dump` to a secure storage bucket (e.g., AWS S3 or Google Cloud Storage).
2. **Retention**: Maintain a 30-day retention policy.
3. **Restore Testing**: Test restoration procedures monthly.

## Security

### Rate Limiting
The middleware uses Redis-backed (or LRU cache fallback) rate limiting. Monitor for excessive `429 Too Many Requests` responses and adjust `RATE_LIMIT_GLOBAL` or specific endpoint limits as needed.

### Security Headers
Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and other headers are managed in `middleware.ts`. Review the CSP policy regularly to ensure it matches the needs of third-party integrations (Sentry, Google Analytics, etc.).

## Monitoring & Observability

### Sentry
Sentry is used for both client-side and server-side error tracking. Ensure `SENTRY_DSN` is set in production.

### Logging
Ensure logs are forwarded to a log aggregator (e.g., Winston -> Datadog or Papertrail) for auditing and troubleshooting.

## CI/CD Pipeline
The repository includes a GitHub Actions workflow in `.github/workflows/ci-cd.yml` that handles linting, testing, building, and prepared deployment steps.
