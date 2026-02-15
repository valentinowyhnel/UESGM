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
- `status` (enum: 'upcoming' | 'past' | 'all', défaut: 'upcoming'): Statut de l'événement
- `search` (string, optionnel): Recherche textuelle
- `antenneId` (string, optionnel): Filtrer par antenne
- `published` (enum: 'true' | 'false' | 'all', défaut: 'all'): Filtrer par statut de publication

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
      "image": "https://...",
      "images": ["https://..."],
      "isPast": false,
      "published": true,
      "antennes": [
        { "id": "antenne_id", "city": "Rabat" }
      ],
      "_count": {
        "EventRegistration": 150
      },
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
  "image": "https://...",
  "images": ["https://..."],
  "published": false,
  "antenneId": "antenne_id"
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

**Permissions**: ADMIN, SUPER_ADMIN

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

**Permissions**: ADMIN, SUPER_ADMIN

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

### `POST /api/events/[id]/register`

Inscription à un événement

**Body:**
```json
{
  "fullName": "Nom Complet",
  "email": "email@example.com",
  "phone": "+212612345678",
  "city": "Rabat",
  "establishment": "Université Mohammed V"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "registration_id",
    "eventId": "event_id",
    "fullName": "Nom Complet",
    "email": "email@example.com",
    "Event": {
      "title": "Journée d'Intégration",
      "date": "2026-09-15T10:00:00Z",
      "location": "Rabat"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "message": "Inscription réussie !"
}
```

**Permissions**: Public

---

### `GET /api/events/[id]/register`

Liste les inscriptions à un événement

**Query Parameters:**
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 50)

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "registration_id",
      "fullName": "Nom Complet",
      "email": "email@example.com",
      "phone": "+212612345678",
      "city": "Rabat",
      "establishment": "Université Mohammed V",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true
  }
}
```

**Permissions**: Public (pour voir les inscriptions de son propre événement)

---

### `DELETE /api/events/[id]/register?email={email}`

Annule une inscription à un événement

**Query Parameters:**
- `email` (string, requis): Email de l'inscription

**Réponse (200):**
```json
{
  "success": true,
  "message": "Inscription annulée avec succès"
}
```

**Permissions**: Public

---

## 🚀 Projets

### `GET /api/projects`

Liste tous les projets avec pagination et filtres

**Query Parameters:**
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 50)
- `status` (enum: 'IN_PROGRESS' | 'COMPLETED' | 'PLANNED' | 'all', défaut: 'all')
- `category` (string, optionnel)
- `city` (string, optionnel)
- `featured` (enum: 'true' | 'false' | 'all', défaut: 'all')
- `published` (enum: 'true' | 'false' | 'all', défaut: 'all')
- `search` (string, optionnel)
- `year` (number, optionnel)

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
      "city": "Rabat",
      "image": "https://...",
      "coverImage": "https://...",
      "coverColor": "#3B82F6",
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2026-12-31T23:59:59Z",
      "isFeatured": true,
      "published": true,
      "year": 2026,
      "gallery": ["https://..."],
      "tools": ["React", "Next.js"],
      "team": {...},
      "timeline": {...},
      "partners": {...},
      "slug": "guide-etudiant-2026",
      "favoriteCount": 50,
      "shareCount": 25,
      "supportCount": 100,
      "_count": {
        "ProjectAuditLog": 5
      },
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
  "city": "Rabat",
  "image": "https://...",
  "coverImage": "https://...",
  "coverColor": "#3B82F6",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "isFeatured": false,
  "published": false,
  "year": 2026,
  "gallery": ["https://..."],
  "tools": ["React", "Next.js"],
  "team": {...},
  "timeline": {...},
  "partners": {...}
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

**Permissions**: ADMIN, SUPER_ADMIN

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

**Permissions**: ADMIN, SUPER_ADMIN

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
- `category` (enum: 'STATUTS' | 'RAPPORTS' | 'GUIDES' | 'LIVRES' | 'ARTICLES' | 'PROJETS_SCIENTIFIQUES' | 'all', défaut: 'all')
- `published` (enum: 'true' | 'false' | 'all', défaut: 'all')
- `search` (string, optionnel)
- `tags` (string, optionnel): Tags séparés par des virgules
- `antenneId` (string, optionnel)

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
      "antennes": [
        { "id": "antenne_id", "city": "Rabat" }
      ],
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
  "published": false,
  "antenneIds": ["antenne_id1", "antenne_id2"]
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

**Permissions**: ADMIN, SUPER_ADMIN

---

### `PUT /api/documents`

Met à jour un document existant

**Body:**
```json
{
  "id": "document_id",
  "title": "Titre modifié",
  "published": true,
  "antenneIds": ["antenne_id1"]
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

**Permissions**: ADMIN, SUPER_ADMIN

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
- `type` (enum: 'INSTITUTIONAL' | 'PRIVATE', optionnel)
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
      "logo": "https://...",
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
  "logo": "https://...",
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

## 📍 Antennes

### `GET /api/antennes`

Liste toutes les antennes

**Query Parameters:**
- `search` (string, optionnel): Recherche par ville, responsable, ou adresse
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 50)

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "antenne_id",
      "city": "Rabat",
      "responsable": "Nom Responsable",
      "email": "rabat@uesgm.ma",
      "phone": "+212612345678",
      "address": "Adresse complète",
      "_count": {
        "events": 10,
        "documents": 5
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 9,
    "pages": 1,
    "hasNext": false
  }
}
```

**Permissions**: Public

---

### `POST /api/antennes`

Crée une nouvelle antenne

**Body:**
```json
{
  "city": "Nouvelle Ville",
  "responsible": "Nom Responsable",
  "email": "ville@uesgm.ma",
  "phone": "+212612345678",
  "address": "Adresse complète"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "antenne_id",
    ...
  }
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

### `PUT /api/antennes`

Met à jour une antenne existante

**Body:**
```json
{
  "id": "antenne_id",
  "city": "Ville modifiée",
  ...
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "antenne_id",
    ...
  }
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

### `DELETE /api/antennes?id={antenne_id}`

Supprime une antenne

**Query Parameters:**
- `id` (string, requis): ID de l'antenne

**Réponse (200):**
```json
{
  "success": true,
  "message": "Antenne supprimée avec succès"
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
      "photo": "https://...",
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
  "photo": "https://...",
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
  "message": "Message reçu avec succès et sauvegardé dans Supabase !",
  "timestamp": "2024-01-15T10:00:00Z",
  "processingTime": "150ms",
  "database": "Supabase PostgreSQL"
}
```

**Rate Limiting**: 5 requêtes par 15 minutes par IP

**Permissions**: Public

---

## 🔍 Recherche

### `GET /api/search`

Recherche globale dans tous les contenus

**Query Parameters:**
- `query` (string, requis, min: 2, max: 100): Terme de recherche
- `type` (enum: 'all' | 'events' | 'projects' | 'documents' | 'partners' | 'antennes' | 'executive-members', défaut: 'all')
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 20)
- `filters.category` (string, optionnel)
- `filters.status` (string, optionnel)
- `filters.published` (string, optionnel)
- `filters.city` (string, optionnel)

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "projects": [...],
    "documents": [...],
    "partners": [...],
    "antennes": [...],
    "executiveMembers": [...],
    "total": 150
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
  "category": "event",
  "eventId": "event_id",
  "projectId": "project_id",
  "memberId": "member_id"
}
```

**Types supportés:**
- `image`: Images générales (max 5MB)
- `document`: Documents PDF, Word (max 50MB)
- `profile`: Photos de profil (max 2MB)
- `executive`: Photos des membres du bureau (max 2MB)
- `event`: Images d'événements (max 10MB)
- `project`: Images de projets (max 10MB)

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "signedUrl": "https://...",
    "fileName": "image/uuid_timestamp.jpg",
    "maxSize": 5242880,
    "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
    "expiresAt": "2024-01-15T11:00:00Z"
  },
  "message": "URL signée générée avec succès"
}
```

**Permissions**: Public (pour images/documents), Authentifié (pour autres types)

---

### `PUT /api/upload`

Confirme l'upload d'un fichier et l'enregistre dans la base de données

**Body:**
```json
{
  "fileId": "uuid",
  "fileName": "image/uuid_timestamp.jpg",
  "fileSize": 1024000,
  "mimeType": "image/jpeg",
  "type": "image",
  "category": "event",
  "eventId": "event_id",
  "title": "Titre du fichier",
  "description": "Description",
  "tags": ["tag1", "tag2"]
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "document_id",
    ...
  },
  "message": "Fichier uploadé avec succès"
}
```

**Permissions**: Authentifié

---

### `GET /api/upload`

Liste les fichiers uploadés (admin uniquement)

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
      "id": "document_id",
      "title": "Titre",
      "category": "STATUTS",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "downloads": 50,
      "published": true,
      "submittedByEmail": "user@uesgm.ma",
      "submittedByName": "Nom",
      "createdAt": "2024-01-15T10:00:00Z"
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

**Permissions**: ADMIN, SUPER_ADMIN

---

## 📬 Newsletter

### `GET /api/newsletter`

Liste les abonnés à la newsletter (admin uniquement)

**Query Parameters:**
- `active` (boolean, optionnel): Filtrer par statut actif
- `page` (number, défaut: 1)
- `per` (number, défaut: 10, max: 50)

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "subscriber_id",
      "email": "email@example.com",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per": 10,
    "total": 500,
    "pages": 50,
    "hasNext": true
  }
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

### `POST /api/newsletter`

S'abonne à la newsletter

**Body:**
```json
{
  "email": "email@example.com"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Inscription à la newsletter réussie"
}
```

**Permissions**: Public

---

### `DELETE /api/newsletter?email={email}`

Se désabonne de la newsletter

**Query Parameters:**
- `email` (string, requis): Email à désabonner

**Réponse (200):**
```json
{
  "success": true,
  "message": "Désabonnement réussi"
}
```

**Permissions**: Public

---

### `PUT /api/newsletter`

Met à jour le statut d'un abonné (admin uniquement)

**Body:**
```json
{
  "email": "email@example.com",
  "isActive": false
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Statut mis à jour"
}
```

**Permissions**: ADMIN, SUPER_ADMIN

---

## 🏥 Health Check

### `GET /api/health`

Vérifie l'état de santé de l'API et de la base de données

**Réponse (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "database": {
    "status": "connected",
    "responseTime": "15ms"
  },
  "environment": "production",
  "version": "1.0.0"
}
```

**Permissions**: Public

---

## ⚠️ Codes d'Erreur

### Codes HTTP Standards

- `200 OK`: Requête réussie
- `201 Created`: Ressource créée avec succès
- `400 Bad Request`: Données invalides
- `401 Unauthorized`: Authentification requise
- `403 Forbidden`: Permissions insuffisantes
- `404 Not Found`: Ressource non trouvée
- `409 Conflict`: Conflit (ex: doublon)
- `429 Too Many Requests`: Rate limit dépassé
- `500 Internal Server Error`: Erreur serveur

### Format d'Erreur

```json
{
  "error": "Message d'erreur",
  "code": "ERROR_CODE",
  "details": {
    "field": "message de validation"
  }
}
```

---

## 🔒 Sécurité

### Rate Limiting

- **Contact**: 5 requêtes / 15 minutes par IP
- **Authentification**: 10 requêtes / 15 minutes par IP
- **Upload**: 20 requêtes / heure par utilisateur
- **API générale**: 100 requêtes / heure par IP

### Authentification

L'authentification utilise NextAuth.js avec des sessions JWT. Les tokens sont inclus dans les cookies HTTP-only.

### Headers de Sécurité

Toutes les réponses incluent:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Validation

Toutes les données d'entrée sont validées avec Zod avant traitement.

---

## 📝 Notes de Production

### Variables d'Environnement Requises

```env
# Base de données
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://uesgm.ma
NEXTAUTH_SECRET=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Environnement
NODE_ENV=production
```

### Performance

- Pagination par défaut: 10 éléments par page
- Maximum: 50 éléments par page
- Cache des requêtes fréquentes: 5 minutes
- Optimisation des images: WebP/AVIF automatique

### Monitoring

- Health check: `/api/health`
- Logs structurés: JSON en production
- Métriques: Temps de réponse, taux d'erreur

---

## 🔄 Changelog

### Version 1.0.0 (2024-01-15)
- Version initiale de l'API
- Support complet CRUD pour toutes les ressources
- Authentification NextAuth.js
- Rate limiting global
- Gestion d'erreurs centralisée

---

**Dernière mise à jour**: 2024-01-15
**Version API**: 1.0.0
