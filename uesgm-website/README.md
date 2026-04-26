# UESGM Website - Documentation Technique

## Vue d'ensemble
Site web institutionnel pour l'Union des Étudiants et Stagiaires Gabonais au Maroc (UESGM).
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Handlers + Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentification**: NextAuth.js avec RBAC
- **Rate Limiting**: Redis (Upstash)
- **Monitoring**: Sentry

## Installation & Développement

1. **Pré-requis**
   - Node.js 20+
   - pnpm (recommandé)

2. **Installation des dépendances**
   ```bash
   pnpm install
   ```

3. **Configuration**
   - Copiez `.env.example` vers `.env`
   - Remplissez les variables (DATABASE_URL, UPSTASH_REDIS_*, SENTRY_DSN, etc.)

4. **Base de Données**
   - Générez le client Prisma :
     ```bash
     pnpm prisma generate
     ```
   - Poussez le schéma :
     ```bash
     pnpm prisma db push
     ```
   - Seed les données :
     ```bash
     pnpm prisma db seed
     ```

5. **Lancement**
   ```bash
   pnpm dev
   ```

## Architecture Backend

- **API Routes**: Situées dans `app/api/`. Toutes les routes sont protégées par validation Zod.
- **RBAC**: Les rôles (SUPER_ADMIN, ADMIN, MODERATOR, MEMBER, PUBLIC) sont gérés via NextAuth et vérifiés dans le middleware et les API handlers.
- **Rate Limiting**: Implémenté dans `middleware.ts` en utilisant Upstash Redis pour limiter les abus sur les routes sensibles (/api/contact, /api/auth).
- **Upload**: Système d'URL signées vers Supabase Storage (`/api/upload`).

## Tests

- **Unitaires (Jest)**: `pnpm test`
- **E2E (Playwright)**: `pnpm test:e2e`

## Déploiement

Le site est optimisé pour un déploiement sur **Vercel**.
Le pipeline CI/CD via **GitHub Actions** (`.github/workflows/ci-cd.yml`) assure le linting, les tests et le build à chaque push sur main/staging.

## Easter Egg
Un Easter Egg est caché sur le site. Essayez le code suivant :
`↑ ↑ ↓ ↓ ← → ← → B A`
