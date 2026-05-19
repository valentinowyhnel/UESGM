# 🇬🇦 UESGM Website - Documentation Technique

Bienvenue sur le dépôt officiel du site web de l'Union des Étudiants et Stagiaires Gabonais au Maroc (UESGM).

## 🚀 Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Base de Données**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Authentification**: NextAuth.js (Credentials & Google OAuth)
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod + React Hook Form
- **Monitoring**: Sentry
- **CI/CD**: GitHub Actions

## 🛠 Installation & Développement

1. **Pré-requis**
   - Node.js 20+
   - pnpm (recommandé)
   - PostgreSQL (ou instance Supabase)
   - Redis (Upstash recommandé pour le rate limiting)

2. **Installation**
   ```bash
   pnpm install
   ```

3. **Configuration Environnement**
   Créez un fichier `.env` à la racine :
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-random-secret"
   REDIS_URL="redis://:pass@host:port"
   SENTRY_DSN="..."
   ```

4. **Base de Données**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   pnpm prisma db seed
   ```

5. **Lancement**
   ```bash
   pnpm dev
   ```

## 🔒 Sécurité & RBAC

L'API implémente un contrôle d'accès basé sur les rôles (RBAC) :
- `SUPER_ADMIN`: Accès total, suppression de ressources critiques.
- `ADMIN`: Gestion complète du contenu (Événements, Projets, Documents).
- `MODERATOR`: Modération des contenus existants.
- `MEMBER`: Accès aux ressources réservées aux membres.
- `PUBLIC`: Accès en lecture seule aux contenus publics.

Le middleware Next.js force les headers de sécurité (CSP, HSTS, XSS protection) et gère le rate limiting.

## 📡 API Endpoints

- `GET /api/events`: Liste des événements (pagination/filtres).
- `POST /api/contact`: Formulaire de contact (rate-limited).
- `GET /api/search`: Recherche globale plein texte.
- `GET /api/statistics`: Statistiques publiques et détaillées (admin).
- `POST /api/upload`: Génération d'URL signées pour l'upload.

Voir `docs/API-COMPLETE.md` pour la spécification complète.

## 🧪 Tests

- **Unitaires (Jest)**: `pnpm test`
- **E2E (Playwright)**: `pnpm test:e2e`

## 📦 Déploiement

Le projet est configuré pour un déploiement continu sur Vercel. Les migrations Prisma sont exécutées automatiquement lors du build via la pipeline CI/CD.

## 📄 Licence
Copyright © 2024 UESGM. Tous droits réservés.
