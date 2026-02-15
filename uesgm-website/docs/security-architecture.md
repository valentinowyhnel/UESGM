# Architecture de Sécurité UESGM

Ce document décrit les mesures de sécurité implémentées sur le site web de l'UESGM pour assurer une défense en profondeur.

## 1. Périmètre de Sécurité
- **Middleware** : Protection de toutes les routes `/admin/*` et `/api/admin/*`. Seul le rôle `ADMIN` est autorisé.
- **Headers HTTP** : Configuration stricte via `next.config.ts` (CSP, HSTS, X-Frame-Options).
- **Rate Limiting** : Protection contre le brute-force sur `/login` et le spam sur les formulaires publics.

## 2. Protection des Données
- **Hashing** : Utilisation de `bcryptjs` avec 12 rounds pour les mots de passe.
- **Chiffrement** : AES-256-GCM disponible pour les données sensibles au repos.
- **Sanitization** : Nettoyage systématique des entrées HTML avec `DOMPurify` pour prévenir les vulnérabilités XSS.
- **Validation** : Schémas `Zod` stricts pour chaque interface API et formulaire.

## 3. Gestion des Fichiers & Réseau
- **Uploads** : Validation des types MIME, des extensions et génération de noms sécurisés (UUID).
- **SSRF** : Validation des URLs externes et blocage des adresses IP locales/privées.

## 4. Monitoring & Audit
- **Logging** : Journalisation structurée des événements de sécurité (connexions, erreurs critiques, accès admin).
- **Audit** : Politique de mise à jour des dépendances via `npm audit`.

---
*Ce document doit être mis à jour après chaque modification architecturale.*
