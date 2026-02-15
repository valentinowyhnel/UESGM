# 🗺️ Configuration du Routage

## Page d'Accueil

La **page d'accueil** (`/`) est la première page qui s'affiche quand un utilisateur entre sur le site.

**Fichier**: `app/(public)/page.tsx`

**Contenu**:
- Section Hero
- Statistiques
- Actualités Récentes (placeholder)

## Structure des Routes

### Routes Publiques

Toutes les routes publiques sont dans le dossier `app/(public)/`:

- `/` - Page d'accueil (Home)
- `/a-propos` - À propos
- `/bureau-executif` - Bureau exécutif
- `/contact` - Contact
- `/evenements` - Événements
- `/partenaires` - Partenaires
- `/antennes` - Antennes
- `/bibliotheque` - Bibliothèque
- `/projets` - Projets

### Routes Admin

Les routes admin sont protégées et nécessitent une authentification:

- `/admin/dashboard` - Tableau de bord
- `/admin/membres` - Gestion des membres
- `/admin/evenements` - Gestion des événements
- `/admin/bibliotheque` - Gestion des documents
- `/admin/super` - Super admin

### Routes d'Authentification

- `/portal` - Portail d'authentification admin (accès discret)
- `/login` - Page de connexion alternative

## Configuration du Middleware

Le middleware (`middleware.ts`) est configuré pour:

1. **Routes publiques**: Accessibles sans authentification
2. **Routes admin**: Nécessitent un rôle ADMIN ou SUPER_ADMIN
3. **Rate limiting**: Protection contre les abus
4. **Headers de sécurité**: Ajout automatique des headers HTTP

### Routes Publiques Définies

```typescript
const publicPaths = [
  '/',
  '/a-propos',
  '/bureau-executif',
  '/contact',
  '/evenements',
  '/partenaires',
  '/antennes',
  '/bibliotheque',
  '/projets',
]
```

Ces routes sont **toujours accessibles** sans authentification.

## Redirections

### Redirections Configurées (next.config.ts)

- `/admin/:path*` → `/console-gestion/:path*` (permanent)
- `/recensement` → `/rejoindre-uesgm` (permanent)

### Rewrites

- `/console-gestion/:path*` → `/admin/:path*` (interne)
- `/data-service/:path*` → `/api/:path*` (interne)
- `/rejoindre-uesgm` → `/recensement` (interne)

## Comportement par Défaut

Quand un utilisateur accède au site:

1. **URL racine** (`/` ou `https://uesgm.ma`): Affiche la page d'accueil
2. **Aucune redirection automatique**: L'utilisateur reste sur la page d'accueil
3. **Navigation libre**: L'utilisateur peut naviguer vers toutes les pages publiques
4. **Accès admin**: Via mécanismes discrets (voir `docs/ADMIN-ACCESS.md`)

## Vérification

Pour vérifier que la page d'accueil s'affiche correctement:

1. Accéder à `http://localhost:3000/` (développement)
2. Accéder à `https://uesgm.ma/` (production)
3. La page d'accueil avec Hero et Statistiques doit s'afficher
4. Aucune redirection ne doit se produire

## Dépannage

### Problème: Redirection vers /portal ou /login

**Cause**: Le middleware redirige les utilisateurs non authentifiés

**Solution**: Vérifier que la route est dans `publicPaths` dans `middleware.ts`

### Problème: Page blanche

**Cause**: Erreur dans le composant de la page d'accueil

**Solution**: Vérifier les logs de la console et les erreurs dans `app/(public)/page.tsx`

### Problème: 404 Not Found

**Cause**: La route n'existe pas ou le fichier est mal nommé

**Solution**: Vérifier que `app/(public)/page.tsx` existe et est correctement configuré

---

**Dernière mise à jour**: 2024-01-15
**Version**: 1.0.0
