# Documentation Complète de l'API UESGM

Cette documentation détaille les points de terminaison de l'API pour le site de l'Union des Étudiants et Stagiaires Gabonais au Maroc (UESGM).

## Authentification
L'authentification est gérée par NextAuth.js. Les rôles disponibles sont :
- `SUPER_ADMIN`
- `ADMIN`
- `MODERATOR`
- `MEMBER`
- `PUBLIC`

---

## Endpoints Publics

### 1. Contact
**POST** `/api/contact`
- Body: `{ name, email, subject?, message }`
- Validation: Zod schema (min/max length, email format)
- Rate Limit: 5 requêtes / 15 min par IP

### 2. Recherche Globale
**GET** `/api/search?q=[query]&type=[optional_type]`
- Types: `event`, `project`, `document`, `partner`
- Retourne les résultats agrégés.

### 3. Événements (Liste)
**GET** `/api/events?page=1&limit=10&category=[category]&status=[status]&search=[query]`
- Retourne uniquement les événements publiés.

### 4. Projets (Liste)
**GET** `/api/projects?page=1&limit=10&category=[category]&status=[status]&search=[query]`
- Retourne uniquement les projets publiés.

### 5. Documents (Liste)
**GET** `/api/documents?page=1&limit=10&category=[category]&search=[query]`
- Filtre automatiquement par visibilité selon le rôle de l'utilisateur (PUBLIC par défaut).

---

## Endpoints Admin (Exigent un rôle ADMIN ou SUPER_ADMIN)

### 1. Création d'Événement
**POST** `/api/events`
- Body: `{ title, description, date, location, category, ... }`

### 2. Création de Projet
**POST** `/api/projects`
- Body: `{ title, description, category, status, ... }`

### 3. Gestion des Documents & Versionnage
**POST** `/api/documents`
- Crée un nouveau document ou une nouvelle version si le `slug` existe déjà.

### 4. Statistiques Flexibles
**POST** `/api/statistics`
- Body: `{ key, value }`
- Permet de mettre à jour des métriques spécifiques.

### 5. Upload de Fichiers (Signed URL)
**POST** `/api/upload`
- Body: `{ fileName, fileType, folder? }`
- Retourne une `signedUrl` pour l'upload direct vers Supabase Storage.

---

## Sécurité & Performance
- **Rate Limiting**: Implémenté via Redis (Upstash) sur les routes sensibles.
- **Headers de Sécurité**: CSP, HSTS, XSS Protection configurés dans le middleware.
- **Validation**: Double validation (Client avec Zod/React Hook Form, Serveur avec Zod).
- **Monitoring**: Intégration Sentry pour le tracking des erreurs.
