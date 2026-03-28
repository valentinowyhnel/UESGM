# 📚 Documentation Complète de l'API UESGM

## 🎯 Vue d'Ensemble

L'API UESGM est une API REST complète pour la gestion de l'Union des Étudiants Gabonais au Maroc. Elle fournit des endpoints pour gérer les événements, projets, documents, membres, partenaires, et bien plus.

**Base URL**: `https://uesgm.ma/api` (production) ou `http://localhost:3000/api` (développement)

**Format**: Toutes les réponses sont au format JSON

**Authentification**: NextAuth.js avec sessions JWT

---

## 🔐 Authentification

### Endpoints d'Authentification

#### `POST /api/auth/signin`
Connexion d'un utilisateur

**Body:**
```json
{
  "email": "user@uesgm.ma",
  "password": "password123"
}
```

**Réponse (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@uesgm.ma",
    "name": "Nom Utilisateur",
    "role": "ADMIN"
  },
  "session": "jwt_token"
}
```

#### `POST /api/auth/signout`
Déconnexion d'un utilisateur

**Réponse (200):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

## 📊 Statistiques

### `GET /api/statistics`

Récupère les statistiques du site

**Query Parameters:**
- `detailed` (boolean, optionnel): Si `true`, retourne des statistiques détaillées (admin uniquement)

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEvents": 50,
      "publishedEvents": 45,
      "upcomingEvents": 12,
      "totalProjects": 25,
      "publishedProjects": 20,
      "totalDocuments": 100,
      "publishedDocuments": 85,
      "totalPartners": 15,
      "totalAntennes": 9
    },
    "engagement": {
      "totalNewsletterSubscribers": 500,
      "activeNewsletterSubscribers": 450,
      "totalContactMessages": 200,
      "unreadContactMessages": 5
    },
    "lastUpdated": "2024-01-15T10:00:00Z"
  },
  "meta": {
    "isAdmin": false,
    "detailed": false,
    "generatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Permissions**: Public (statistiques de base), Admin (statistiques détaillées)

---

## 📅 Événements

### `GET /api/events`

Liste tous les événements avec pagination et filtres

**Query Parameters:**
- `page` (number, défaut: 1): Numéro de page
- `per` (number, défaut: 10, max: 50): Nombre d'éléments par page
- `category` (string, optionnel): Filtrer par catégorie
- `status` (enum: 'upcoming' | 'past' | 'all', défaut: 'all'): Statut de l'événement
- `search` (string, optionnel): Recherche textuelle
- `published` (enum: 'true' | 'false' | 'all', défaut: 'true'): Filtrer par statut de publication

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_id",
      "title": "Journée d'Intégration 2026",
      "description": "Description de l'événement",
      "date": "2026-09-15T10:00:00Z",
      "location": "Rabat",
      "category": "Intégration",
      "imageUrl": "https://...",
      "isPast": false,
      "published": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 50,
    "pages": 5,
    "hasNext": true
  }
}
```

**Permissions**: Public

---

### `POST /api/events`

Crée un nouvel événement

**Body:**
```json
{
  "title": "Nouvel Événement",
  "description": "Description de l'événement",
  "date": "2026-09-15T10:00:00Z",
  "location": "Rabat",
  "category": "Intégration",
  "imageUrl": "https://...",
  "published": false
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "event_id",
    "title": "Nouvel Événement",
    ...
  }
}
```

**Permissions**: MODERATOR, ADMIN, SUPER_ADMIN

---

### `PUT /api/events`

Met à jour un événement existant

**Body:**
```json
{
  "id": "event_id",
  "title": "Titre modifié",
  "description": "Description modifiée",
  ...
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "event_id",
    ...
  }
}
```

**Permissions**: MODERATOR, ADMIN, SUPER_ADMIN

---

### `DELETE /api/events?id={event_id}`

Supprime un événement

**Query Parameters:**
- `id` (string, requis): ID de l'événement

**Réponse (200):**
```json
{
  "success": true,
  "message": "Événement supprimé avec succès"
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

## 🚀 Projets

### `GET /api/projects`

Liste tous les projets avec pagination et filtres

**Query Parameters:**
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 50)
- `status` (string, optionnel)
- `category` (string, optionnel)
- `published` (enum: 'true' | 'false' | 'all', défaut: 'true')
- `search` (string, optionnel)

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "project_id",
      "title": "Guide de l'Étudiant 2026",
      "description": "Description du projet",
      "status": "IN_PROGRESS",
      "category": "Éducation",
      "imageUrl": "https://...",
      "progress": 50,
      "published": true,
      "slug": "guide-etudiant-2026",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true
  }
}
```

**Permissions**: Public

---

### `POST /api/projects`

Crée un nouveau projet

**Body:**
```json
{
  "title": "Nouveau Projet",
  "description": "Description du projet",
  "status": "IN_PROGRESS",
  "category": "Éducation",
  "imageUrl": "https://...",
  "published": false
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "project_id",
    ...
  }
}
```

**Permissions**: MODERATOR, ADMIN, SUPER_ADMIN

---

### `PUT /api/projects`

Met à jour un projet existant

**Body:**
```json
{
  "id": "project_id",
  "title": "Titre modifié",
  "status": "COMPLETED",
  ...
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "project_id",
    ...
  }
}
```

**Permissions**: MODERATOR, ADMIN, SUPER_ADMIN

---

### `DELETE /api/projects?id={project_id}`

Supprime un projet

**Query Parameters:**
- `id` (string, requis): ID du projet

**Réponse (200):**
```json
{
  "success": true,
  "message": "Projet supprimé avec succès"
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

## 📄 Documents

### `GET /api/documents`

Liste tous les documents avec pagination et filtres

**Query Parameters:**
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 50)
- `category` (string, optionnel)
- `published` (enum: 'true' | 'false' | 'all', défaut: 'true')
- `search` (string, optionnel)

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "document_id",
      "title": "Statuts de l'UESGM",
      "description": "Description du document",
      "category": "STATUTS",
      "fileUrl": "https://...",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "downloads": 500,
      "tags": ["statuts", "réglementation"],
      "published": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true
  }
}
```

**Permissions**: Public

---

### `POST /api/documents`

Ajoute un nouveau document

**Body:**
```json
{
  "title": "Nouveau Document",
  "description": "Description du document",
  "category": "STATUTS",
  "fileUrl": "https://...",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "tags": ["tag1", "tag2"],
  "published": false
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "document_id",
    ...
  }
}
```

**Permissions**: MODERATOR, ADMIN, SUPER_ADMIN

---

### `PUT /api/documents`

Met à jour un document existant

**Body:**
```json
{
  "id": "document_id",
  "title": "Titre modifié",
  "published": true
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "document_id",
    ...
  }
}
```

**Permissions**: MODERATOR, ADMIN, SUPER_ADMIN

---

### `DELETE /api/documents?id={document_id}`

Supprime un document

**Query Parameters:**
- `id` (string, requis): ID du document

**Réponse (200):**
```json
{
  "success": true,
  "message": "Document supprimé avec succès"
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

## 🤝 Partenaires

### `GET /api/partners`

Liste tous les partenaires

**Query Parameters:**
- `type` (string, optionnel)
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 50)

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "partner_id",
      "name": "Ambassade du Gabon",
      "logoUrl": "https://...",
      "website": "https://...",
      "type": "INSTITUTIONAL",
      "description": "Description du partenaire",
      "order": 0,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 15,
    "pages": 2,
    "hasNext": true
  }
}
```

**Permissions**: Public

---

### `POST /api/partners`

Ajoute un nouveau partenaire

**Body:**
```json
{
  "name": "Nouveau Partenaire",
  "logoUrl": "https://...",
  "website": "https://...",
  "type": "INSTITUTIONAL",
  "description": "Description du partenaire",
  "order": 0
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "partner_id",
    ...
  }
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

### `PUT /api/partners`

Met à jour un partenaire existant

**Body:**
```json
{
  "id": "partner_id",
  "name": "Nom modifié",
  ...
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "partner_id",
    ...
  }
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

### `DELETE /api/partners?id={partner_id}`

Supprime un partenaire

**Query Parameters:**
- `id` (string, requis): ID du partenaire

**Réponse (200):**
```json
{
  "success": true,
  "message": "Partenaire supprimé avec succès"
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

## 👥 Membres du Bureau Exécutif

### `GET /api/executive-members`

Liste tous les membres du bureau exécutif

**Query Parameters:**
- `published` (boolean, défaut: true): Si `false`, retourne tous les membres (admin)

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "member_id",
      "name": "MINTSA NDONG Emery Désiré",
      "position": "Président",
      "email": "president@uesgm.ma",
      "phone": "+212612345678",
      "photoUrl": "https://...",
      "order": 0,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Permissions**: Public

---

### `POST /api/executive-members`

Ajoute un nouveau membre du bureau

**Body:**
```json
{
  "name": "Nom Complet",
  "position": "Position",
  "email": "email@uesgm.ma",
  "phone": "+212612345678",
  "photoUrl": "https://...",
  "order": 0
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "member_id",
    ...
  }
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

## 📧 Contact

### `POST /api/contact`

Envoie un message de contact

**Body:**
```json
{
  "name": "Nom Complet",
  "email": "email@example.com",
  "subject": "Sujet du message",
  "message": "Contenu du message"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "id": "message_id",
  "message": "Message reçu avec succès !",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Rate Limiting**: 5 requêtes par 10 minutes par IP

**Permissions**: Public

---

## 🔍 Recherche

### `GET /api/search`

Recherche globale dans tous les contenus

**Query Parameters:**
- `query` (string, requis, min: 2, max: 100): Terme de recherche
- `type` (enum: 'all' | 'events' | 'projects' | 'documents' | 'partners', défaut: 'all')

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "projects": [...],
    "documents": [...],
    "partners": [...]
  },
  "query": "recherche",
  "type": "all"
}
```

**Permissions**: Public

---

## 📤 Upload

### `POST /api/upload`

Génère une URL signée pour l'upload d'un fichier

**Body:**
```json
{
  "type": "image",
  "category": "event"
}
```

**Types supportés:**
- `image`, `document`, `profile`, `executive`, `event`, `project`

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "signedUrl": "https://...",
    "fileName": "image/uuid",
    "maxSize": 5242880,
    "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
    "expiresAt": "2024-01-15T11:00:00Z"
  },
  "message": "URL signée générée avec succès"
}
```

**Permissions**: Public (pour images/documents), Authentifié (pour types spécifiques)

---

## 🏥 Health Check

### `GET /api/health`

Vérifie l'état de santé de l'API

**Réponse (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "database": "connected"
}
```

**Permissions**: Public

---

**Dernière mise à jour**: 2024-01-15
**Version API**: 1.1.0
