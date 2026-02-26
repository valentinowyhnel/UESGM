# UESGM - Union des Étudiants et Stagiaires Gabonais au Maroc

## Architecture Backend
- **Framework**: Next.js 14/15 (App Router)
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js (RBAC: SUPER_ADMIN, ADMIN, MODERATOR, MEMBER, PUBLIC)
- **Rate Limiting**: Redis (Upstash) via `@upstash/ratelimit`
- **Uploads**: Supabase Storage (Signed URLs)
- **Validation**: Zod (Server-side) + React Hook Form (Client-side)
- **Monitoring**: Sentry

## Installation

1. Cloner le repo
2. Installer les dépendances :
   ```bash
   pnpm install
   ```
3. Configurer les variables d'environnement (voir `.env.example`)
4. Générer le client Prisma :
   ```bash
   pnpm prisma generate
   ```
5. Appliquer les migrations ou synchroniser la DB :
   ```bash
   pnpm prisma db push
   ```
6. Lancer le seed :
   ```bash
   pnpm prisma db seed
   ```
7. Lancer en dev :
   ```bash
   pnpm dev
   ```

## API Endpoints

- `POST /api/contact`: Envoi de message de contact (Public, Rate-limited)
- `GET /api/events`: Liste des événements (Public)
- `POST /api/events`: Création d'événement (Admin+)
- `GET /api/partners`: Liste des partenaires
- `GET /api/projects`: Liste des projets
- `GET /api/documents`: Liste des documents (Public)
- `POST /api/documents`: Soumission de document (Member+)
- `GET /api/executive-members`: Liste des membres du bureau
- `GET /api/statistics`: Statistiques agrégées (Cached)
- `GET /api/search`: Recherche globale (Events, Projects, Documents, Partners)
- `POST /api/upload`: Génération d'URL signée pour upload (Admin+)

## Déploiement
- **Plateforme**: Vercel
- **Base de données**: Supabase
- **Redis**: Upstash
- **Migrations**: `pnpm prisma migrate deploy` dans la CI/CD.

## Sécurité
- Headers HSTS, CSP, Permissions-Policy configurés via middleware.
- Rate limiting par IP via Redis.
- Validation stricte des entrées via Zod.
- RBAC intégré à NextAuth et appliqué aux routes API.
