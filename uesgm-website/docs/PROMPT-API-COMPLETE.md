# 🎯 Prompt Complet pour l'API UESGM

Ce document sert de référence complète pour comprendre, maintenir et étendre l'API du site UESGM.

---

## 📋 Contexte et Objectifs

### Contexte
Le site UESGM (Union des Étudiants Gabonais au Maroc) est une plateforme web complète pour la gestion d'une association étudiante. Le site comprend:

- **Espace Public**: Pages accessibles à tous (accueil, à propos, événements, projets, etc.)
- **Espace Admin**: Interface de gestion réservée aux administrateurs
- **API REST**: Backend complet pour toutes les fonctionnalités

### Objectifs de l'API
1. Fournir des endpoints RESTful pour toutes les ressources
2. Assurer la sécurité avec authentification et rate limiting
3. Valider toutes les données d'entrée
4. Gérer les erreurs de manière centralisée
5. Optimiser les performances avec pagination et cache

---

## 🏗️ Architecture Technique

### Stack Technologique

```
Frontend:
- Next.js 16.1.4 (App Router)
- React 19.2.3
- TypeScript
- Tailwind CSS
- Shadcn/ui

Backend:
- Next.js API Routes
- Prisma ORM 7.3.0
- PostgreSQL (Supabase)
- NextAuth.js 4.24.13

Sécurité:
- Rate Limiting (LRU Cache)
- Validation Zod
- Headers de sécurité HTTP
- Protection XSS
```

### Structure des Fichiers

```
uesgm-website/
├── app/
│   ├── api/                    # Routes API
│   │   ├── events/
│   │   ├── projects/
│   │   ├── documents/
│   │   ├── partners/
│   │   ├── antennes/
│   │   ├── executive-members/
│   │   ├── contact/
│   │   ├── search/
│   │   ├── statistics/
│   │   ├── upload/
│   │   ├── newsletter/
│   │   ├── health/
│   │   └── auth/
│   └── (public)/               # Pages publiques
├── lib/
│   ├── prisma.ts              # Client Prisma
│   ├── auth.ts                # Configuration NextAuth
│   ├── rate-limit.ts          # Rate limiting
│   ├── api-error-handler.ts   # Gestion d'erreurs
│   └── ...
├── middleware.ts              # Middleware global
├── prisma/
│   └── schema.prisma          # Schéma de base de données
└── docs/
    ├── API-COMPLETE.md        # Documentation API
    ├── ENVIRONMENT-VARIABLES.md
    └── PRODUCTION-READY.md
```

---

## 🗄️ Modèle de Données

### Modèles Principaux

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(MEMBER)
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Event
```prisma
model Event {
  id                String              @id @default(cuid())
  title             String
  description       String
  date              DateTime
  location          String?
  image             String?
  category          String?
  isPast            Boolean             @default(false)
  published         Boolean             @default(false)
  images            String[]
  EventRegistration EventRegistration[]
  antennes         Antenne[]           @relation("AntenneToEvent")
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}
```

#### Project
```prisma
model Project {
  id               String            @id @default(cuid())
  title            String
  description      String
  status           ProjectStatus     @default(IN_PROGRESS)
  startDate        DateTime?
  endDate          DateTime?
  image            String?
  isFeatured       Boolean           @default(false)
  published        Boolean           @default(false)
  slug             String            @unique
  category         String?
  city             String?
  coverColor       String?
  coverImage       String?
  favoriteCount    Int               @default(0)
  shareCount       Int               @default(0)
  supportCount     Int               @default(0)
  gallery          String[]
  tools            String[]
  team             Json?
  timeline         Json?
  partners         Json?
  year             Int?
  ProjectAuditLog  ProjectAuditLog[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}
```

#### Document
```prisma
model Document {
  id               String            @id @default(cuid())
  title            String
  description      String?
  category         DocumentCategory
  fileUrl          String
  fileType         String
  fileSize         Int?
  downloads        Int               @default(0)
  tags             String[]
  published        Boolean           @default(false)
  submittedByEmail  String?
  submittedByName  String?
  AntenneDocument  AntenneDocument[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}
```

Voir `prisma/schema.prisma` pour le schéma complet.

---

## 🔌 Endpoints API

### Structure Générale

Tous les endpoints suivent cette structure:

```typescript
// GET - Liste avec pagination
export async function GET(req: Request) {
  // 1. Validation des query parameters
  // 2. Construction des filtres
  // 3. Requête Prisma avec pagination
  // 4. Retour JSON avec pagination
}

// POST - Création (admin uniquement)
export async function POST(req: Request) {
  // 1. Vérification authentification
  // 2. Validation du body avec Zod
  // 3. Création en base
  // 4. Retour JSON
}

// PUT - Mise à jour (admin uniquement)
export async function PUT(req: Request) {
  // 1. Vérification authentification
  // 2. Validation du body avec Zod
  // 3. Mise à jour en base
  // 4. Retour JSON
}

// DELETE - Suppression (admin uniquement)
export async function DELETE(req: Request) {
  // 1. Vérification authentification
  // 2. Récupération de l'ID
  // 3. Suppression en base
  // 4. Retour JSON
}
```

### Pattern de Validation

```typescript
import { z } from 'zod'

// Schéma de validation
const ResourceSchema = z.object({
  field1: z.string().min(5).max(200),
  field2: z.string().email().optional(),
  field3: z.number().int().positive(),
})

// Utilisation
const body = await req.json()
const validatedData = ResourceSchema.parse(body)
```

### Pattern d'Authentification

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
const userRole = (session?.user as any)?.role

if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
  return NextResponse.json(
    { error: 'Non autorisé' },
    { status: 401 }
  )
}
```

### Pattern de Pagination

```typescript
const { searchParams } = new URL(req.url)
const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
const per = Math.min(50, Math.max(1, parseInt(searchParams.get('per') || '10')))

const [items, total] = await Promise.all([
  prisma.model.findMany({
    skip: (page - 1) * per,
    take: per,
    // ...
  }),
  prisma.model.count({ where }),
])

return NextResponse.json({
  success: true,
  data: items,
  pagination: {
    page,
    per,
    total,
    pages: Math.ceil(total / per),
    hasNext: page * per < total,
  },
})
```

---

## 🔒 Sécurité

### Rate Limiting

Le middleware applique le rate limiting globalement:

```typescript
// middleware.ts
const sensitiveRoutes = {
  '/api/contact': { limit: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth': { limit: 10, windowMs: 15 * 60 * 1000 },
  '/api/upload': { limit: 20, windowMs: 60 * 60 * 1000 },
}
```

### Headers de Sécurité

Configurés dans `next.config.ts`:
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Content-Security-Policy

### Validation

Toutes les données sont validées avec Zod avant traitement.

---

## ⚠️ Gestion d'Erreurs

### Système Centralisé

Utilisez `handleApiError` de `lib/api-error-handler.ts`:

```typescript
import { handleApiError } from '@/lib/api-error-handler'

try {
  // Code API
} catch (error) {
  return handleApiError(error, 'Nom du contexte')
}
```

### Types d'Erreurs Gérées

- **ZodError**: Validation (400)
- **Prisma Errors**: Base de données (400, 404, 409, 500)
- **ApiException**: Erreurs personnalisées
- **Error générique**: Erreurs inconnues (500)

---

## 📝 Exemple Complet d'Endpoint

```typescript
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { handleApiError } from "@/lib/api-error-handler"

// Schéma de validation
const CreateResourceSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  published: z.boolean().default(false),
})

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per: z.coerce.number().min(1).max(50).default(10),
  search: z.string().optional(),
})

// GET - Liste
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    const where: any = {}
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip: (query.page - 1) * query.per,
        take: query.per,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.resource.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page: query.page,
        per: query.per,
        total,
        pages: Math.ceil(total / query.per),
        hasNext: query.page * query.per < total,
      },
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/resource')
  }
}

// POST - Création
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    if (!session || !userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = CreateResourceSchema.parse(body)

    const resource = await prisma.resource.create({
      data,
    })

    return NextResponse.json(
      { success: true, data: resource },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error, 'POST /api/resource')
  }
}
```

---

## 🚀 Commandes Utiles

### Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Démarrer le serveur de production
npm start

# Linter
npm run lint
```

### Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer les migrations (production)
npx prisma migrate deploy

# Ouvrir Prisma Studio
npx prisma studio

# Seed la base de données
npx prisma db seed
```

### Tests

```bash
# Test de connexion à la base
npm run db-check

# Test simple de l'API
curl http://localhost:3000/api/test-simple

# Health check
curl http://localhost:3000/api/health
```

---

## 📚 Documentation Complète

- **API Complète**: `docs/API-COMPLETE.md` - Tous les endpoints avec exemples
- **Variables d'Environnement**: `docs/ENVIRONMENT-VARIABLES.md` - Configuration
- **Production Ready**: `docs/PRODUCTION-READY.md` - Guide de déploiement
- **Sécurité**: `docs/security-architecture.md` - Architecture de sécurité

---

## 🎯 Bonnes Pratiques

### Code

1. **Toujours valider** les données d'entrée avec Zod
2. **Toujours vérifier** l'authentification pour les routes admin
3. **Toujours utiliser** `handleApiError` pour la gestion d'erreurs
4. **Toujours paginer** les listes
5. **Toujours utiliser** `Promise.all` pour les requêtes parallèles

### Sécurité

1. **Ne jamais** exposer les secrets dans le code
2. **Toujours** utiliser HTTPS en production
3. **Toujours** valider et sanitizer les données utilisateur
4. **Toujours** utiliser des requêtes paramétrées (Prisma le fait automatiquement)

### Performance

1. **Utiliser** `Promise.all` pour les requêtes parallèles
2. **Limiter** le nombre d'éléments par page (max 50)
3. **Indexer** les champs de recherche fréquents
4. **Mettre en cache** les requêtes fréquentes

---

## 🔄 Workflow de Développement

### Ajouter un Nouvel Endpoint

1. Créer le fichier dans `app/api/nouvelle-route/route.ts`
2. Définir les schémas Zod de validation
3. Implémenter GET, POST, PUT, DELETE selon les besoins
4. Ajouter l'authentification si nécessaire
5. Tester avec curl ou Postman
6. Documenter dans `docs/API-COMPLETE.md`

### Modifier le Schéma de Base de Données

1. Modifier `prisma/schema.prisma`
2. Créer une migration: `npx prisma migrate dev --name description`
3. Générer le client: `npx prisma generate`
4. Mettre à jour les routes API si nécessaire
5. Tester les changements

---

## ✅ Checklist pour Nouveaux Endpoints

- [ ] Schéma Zod de validation défini
- [ ] Authentification vérifiée (si nécessaire)
- [ ] Pagination implémentée (pour les listes)
- [ ] Gestion d'erreurs avec `handleApiError`
- [ ] Tests effectués (curl/Postman)
- [ ] Documentation mise à jour
- [ ] Rate limiting vérifié (si route sensible)

---

## 🆘 Dépannage

### Erreur Prisma

```typescript
// Vérifier la connexion
import prisma from '@/lib/prisma'
const test = await prisma.$queryRaw`SELECT 1`
```

### Erreur NextAuth

```typescript
// Vérifier la session
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
const session = await getServerSession(authOptions)
console.log('Session:', session)
```

### Erreur de Validation

```typescript
// Vérifier le schéma Zod
try {
  const data = Schema.parse(body)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Erreurs de validation:', error.errors)
  }
}
```

---

## 📞 Support

Pour toute question ou problème:
1. Consulter la documentation dans `docs/`
2. Vérifier les logs de l'application
3. Tester les endpoints individuellement
4. Vérifier les variables d'environnement

---

**Version**: 1.0.0
**Dernière mise à jour**: 2024-01-15
**Statut**: ✅ Production Ready
