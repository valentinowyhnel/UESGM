# 📚 Documentation Complète de l'API UESGM (v2.0)

## 🎯 Vue d'Ensemble

L'API UESGM est une API REST complète construite avec Next.js App Router, Prisma ORM, et PostgreSQL (via Supabase). Elle intègre des mécanismes de production avancés tels que le rate limiting via Redis (Upstash), l'authentification RBAC (NextAuth), et la surveillance (Sentry).

**Base URL**: `/api`

---

## 🔐 Authentification & Rôles

### Rôles supportés
- `PUBLIC`: Accès en lecture seule aux contenus publics.
- `MEMBER`: Utilisateur authentifié, peut soumettre des documents.
- `MODERATOR`: Peut modérer certains contenus.
- `ADMIN`: Accès complet à la gestion des contenus.
- `SUPER_ADMIN`: Accès complet incluant la gestion des utilisateurs et les paramètres système.

### Endpoints d'Authentification
Gérés par NextAuth.js à l'adresse `/api/auth/*`.

---

## 📧 Contact

### `POST /api/contact`
Envoie un message de contact.

**Rate Limit**: 5 requêtes / 15 min (via Redis).

**Body**:
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "subject": "Question sur l'adhésion",
  "message": "Bonjour, comment puis-je adhérer ?"
}
```

---

## 📅 Événements

### `GET /api/events` (Public)
Liste les événements avec pagination et filtres.
**Params**: `page`, `per`, `category`, `status` (upcoming|past|all), `search`, `published`.

### `POST /api/events` (Admin+)
Crée un événement.

### `PUT /api/events?id={id}` (Admin+)
Met à jour un événement.

### `DELETE /api/events?id={id}` (Admin+)
Supprime un événement.

---

## 🚀 Projets

### `GET /api/projects` (Public)
Liste tous les projets.

### `POST /api/projects` (Admin+)
Crée un projet.

---

## 📄 Documents

### `GET /api/documents` (Public)
Liste les documents publiés.

### `POST /api/documents` (MEMBER+)
Soumet un nouveau document.

---

## 👥 Bureau Exécutif

### `GET /api/executive-members` (Public)
Liste les membres du bureau.

---

## 🔍 Recherche & Statistiques

### `GET /api/search?query={q}&type={all|events|...}` (Public)
Recherche globale.

### `GET /api/statistics` (Public)
Récupère les compteurs globaux.

---

## 📤 Upload

### `POST /api/upload` (Authenticated)
Génère une URL signée pour l'upload direct vers Supabase Storage.

**Body**: `{ "filename": "image.jpg", "contentType": "image/jpeg" }`

---

## 🛡️ Sécurité & Performance

- **Rate Limiting**: Implémenté via Upstash Redis dans le middleware.
- **Validation**: Validation stricte des schémas via Zod côté serveur.
- **Headers**: CSP, X-Frame-Options, HSTS configurés.
- **Surveillance**: Intégration Sentry pour le tracking des erreurs.
