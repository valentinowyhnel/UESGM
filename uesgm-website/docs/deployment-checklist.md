# Checklist de Déploiement Sécurisé

Avant de passer en production, assurez-vous de remplir les conditions suivantes :

## Configuration
- [ ] `NODE_ENV` est défini sur `production`.
- [ ] `NEXTAUTH_URL` correspond à l'URL finale (HTTPS).
- [ ] `ENCRYPTION_KEY` est générée de manière sécurisée (32 octets hex).
- [ ] `NEXTAUTH_SECRET` est une chaîne aléatoire forte.

## Base de Données
- [ ] La base de données PostgreSQL n'est pas accessible publiquement.
- [ ] SSL est activé pour les connexions Prisma.
- [ ] Les sauvegardes automatiques sont configurées.

## Frontend & API
- [ ] Les headers de sécurité sont actifs (vérifier avec `curl -I`).
- [ ] La CSP ne comporte pas de directives `'unsafe-inline'` non nécessaires.
- [ ] `npm audit` renvoie 0 vulnérabilité.

## Maintenance
- [ ] Les logs sont redirigés vers un service de monitoring externe.
- [ ] La politique de mise à jour Dependabot est active.
