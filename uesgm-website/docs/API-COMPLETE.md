# Documentation API UESGM

Cette documentation détaille les points de terminaison de l'API UESGM, les rôles requis et les limites de débit.

## Authentification & Rôles

L'authentification est gérée par NextAuth.js. Les rôles disponibles sont :
- `SUPER_ADMIN` (4) : Accès total, gestion des administrateurs.
- `ADMIN` (3) : Gestion du contenu (événements, projets, documents).
- `MODERATOR` (2) : Modération du contenu public.
- `MEMBER` (1) : Accès aux documents réservés aux membres.
- `PUBLIC` (0) : Accès aux ressources publiques.

## Endpoints

### Contact
- `POST /api/contact`
  - Public.
  - Rate limit : 5 requêtes / 15 min par IP.
  - Validation Zod + Sanitization.

### Événements
- `GET /api/events`
  - Public. Supporte la pagination, le filtrage par catégorie et statut.
- `POST /api/events`
  - Requis : `MODERATOR`+.
- `PUT /api/events`
  - Requis : `MODERATOR`+.
- `DELETE /api/events`
  - Requis : `MODERATOR`+.

### Projets
- `GET /api/projects`
  - Public.
- `POST /api/projects`
  - Requis : `MODERATOR`+.

### Documents
- `GET /api/documents`
  - Public (avec filtres de visibilité).
- `POST /api/documents`
  - Requis : `MODERATOR`+. Gère le versioning.

### Uploads
- `POST /api/upload`
  - Requis : `MODERATOR`+. Génère une URL signée Supabase Storage.
- `PUT /api/upload`
  - Requis : `MODERATOR`+. Finalise l'upload et met à jour la base de données.

### Statistiques
- `GET /api/statistics`
  - Public.
- `POST /api/statistics`
  - Requis : `MODERATOR`+. Mise à jour des compteurs.

### Recherche
- `GET /api/search?q=...`
  - Public. Recherche globale sur événements, projets, documents et partenaires.

## Sécurité
- Middleware global pour le rate limiting et les headers de sécurité (CSP, HSTS).
- Validation Zod systématique côté serveur.
- Protection XSS via `isomorphic-dompurify`.
