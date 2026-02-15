# UESGM Website - Documentation Technique

## Vue d'ensemble
Site web institutionnel pour l'Union des Étudiants et Stagiaires Gabonais au Maroc (UESGM).
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (v4) + shadcn/ui
- **Database**: PostgreSQL + Prisma
- **Authentification**: NextAuth.js (Prévu)

## Installation

1. **Pré-requis**
   - Node.js 18+
   - PostgreSQL

2. **Installation des dépendances**
   ```bash
   npm install
   ```

3. **Configuration de la Base de Données**
   - Copiez `.env.example` (ou utilisez `.env`)
   - Mettez à jour `DATABASE_URL` avec vos identifiants PostgreSQL.
   - Générez le client Prisma :
     ```bash
     npx prisma generate
     ```
   - Poussez le schéma :
     ```bash
     npx prisma db push
     ```

4. **Lancement**
   ```bash
   npm run dev
   ```

## Structure du Projet

- `app/(public)` : Pages publiques (Accueil, À propos, etc.)
- `app/admin` : Panel d'administration (sécurisé)
- `components/ui` : Composants de base (shadcn)
- `components/layout` : Header, Footer
- `components/sections` : Sections de page (Hero, Statistics)
- `lib` : Utilitaires et configuration Prisma

## Easter Egg
Un Easter Egg est caché sur le site. Essayez le code suivant :
`↑ ↑ ↓ ↓ ← → ← → B A`

## Déploiement
Le site est prêt à être déployé sur Vercel. Assurez-vous de configurer les variables d'environnement dans le dashboard Vercel.
