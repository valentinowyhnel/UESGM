# 🔐 Variables d'Environnement

## Vue d'Ensemble

Ce document liste toutes les variables d'environnement requises pour faire fonctionner le site UESGM en production.

## 📋 Variables Requises

### Base de Données

```env
# URL de connexion PostgreSQL (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
```

**Description**: URL de connexion complète à la base de données PostgreSQL. Format standard PostgreSQL avec support SSL.

**Où l'obtenir**: 
- Dans Supabase: Settings > Database > Connection string
- Format: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xx-x.pooler.supabase.com:6543/postgres`

---

### NextAuth.js

```env
# URL de base de l'application
NEXTAUTH_URL=https://uesgm.ma

# Secret pour signer les tokens JWT
NEXTAUTH_SECRET=[GENERATE_SECRET]
```

**Description**: 
- `NEXTAUTH_URL`: URL publique de votre application (sans trailing slash)
- `NEXTAUTH_SECRET`: Chaîne aléatoire de 32+ caractères pour signer les tokens

**Génération du secret**:
```bash
openssl rand -base64 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### Supabase

```env
# URL publique Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Clé anonyme Supabase (publique)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clé de service Supabase (privée - serveur uniquement)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Description**:
- `NEXT_PUBLIC_SUPABASE_URL`: URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clé anonyme (peut être exposée côté client)
- `SUPABASE_SERVICE_ROLE_KEY`: Clé de service avec permissions élevées (NE JAMAIS exposer côté client)

**Où les obtenir**: 
- Dans Supabase: Settings > API
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

### Environnement

```env
# Environnement d'exécution
NODE_ENV=production
```

**Description**: Définit l'environnement d'exécution. Doit être `production` en production.

**Valeurs possibles**:
- `development`: Mode développement
- `production`: Mode production
- `test`: Mode test

---

## 🔒 Variables Optionnelles (Sécurité Avancée)

### Encryption

```env
# Clé de chiffrement pour données sensibles
ENCRYPTION_KEY=[32_BYTES_HEX]
```

**Description**: Clé de 32 octets (64 caractères hex) pour chiffrer les données sensibles.

**Génération**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Monitoring & Analytics

```env
# Sentry DSN (optionnel)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Google Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Description**: Identifiants pour les services de monitoring et analytics.

---

## 📝 Fichier .env.local (Développement)

Créez un fichier `.env.local` à la racine du projet pour le développement local:

```env
# Base de données locale ou Supabase
DATABASE_URL=postgresql://postgres:password@localhost:5432/uesgm

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-key-here-min-32-chars

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Environnement
NODE_ENV=development
```

---

## 🚀 Fichier .env.production (Production)

Pour la production, configurez ces variables dans votre plateforme de déploiement:

### Vercel

1. Allez dans votre projet Vercel
2. Settings > Environment Variables
3. Ajoutez toutes les variables ci-dessus

### Autres Plateformes

Configurez les variables d'environnement selon la documentation de votre plateforme:
- **Netlify**: Site settings > Environment variables
- **Railway**: Variables tab
- **Heroku**: Settings > Config Vars
- **Docker**: Fichier `.env` ou `docker-compose.yml`

---

## ✅ Checklist de Configuration

Avant de déployer en production, vérifiez:

- [ ] `DATABASE_URL` est configuré et accessible
- [ ] `NEXTAUTH_URL` correspond à votre domaine de production
- [ ] `NEXTAUTH_SECRET` est une chaîne aléatoire forte (32+ caractères)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` est correct
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correct
- [ ] `SUPABASE_SERVICE_ROLE_KEY` est configuré (et jamais exposé côté client)
- [ ] `NODE_ENV=production` est défini
- [ ] Toutes les variables sont configurées dans votre plateforme de déploiement
- [ ] Les secrets ne sont pas commités dans Git (vérifiez `.gitignore`)

---

## 🔍 Vérification

Pour vérifier que toutes les variables sont correctement configurées:

```bash
# Vérifier les variables publiques
npm run dev
# Ouvrez http://localhost:3000/api/test-simple

# Vérifier la connexion à la base de données
npm run db-check

# Vérifier la connexion Supabase
npm run test-connection
```

---

## 🛡️ Sécurité

### ⚠️ Ne JAMAIS:

- ❌ Commiter les fichiers `.env.local` ou `.env.production` dans Git
- ❌ Exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- ❌ Partager les secrets en clair (utilisez un gestionnaire de secrets)
- ❌ Utiliser les mêmes secrets en développement et production

### ✅ Toujours:

- ✅ Utiliser des secrets différents pour chaque environnement
- ✅ Régénérer les secrets si compromis
- ✅ Utiliser un gestionnaire de secrets (Vercel, AWS Secrets Manager, etc.)
- ✅ Limiter l'accès aux variables d'environnement
- ✅ Activer le chiffrement au repos pour les secrets

---

## 📚 Ressources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Dernière mise à jour**: 2024-01-15
