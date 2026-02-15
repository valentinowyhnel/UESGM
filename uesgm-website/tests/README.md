# Suite de Tests UESGM

Ce dossier contient la suite complète de tests pour l'application UESGM.

## Structure

```
/tests
  /api          # Tests API (Jest + Supertest)
  /e2e          # Tests E2E (Playwright)
  /integration  # Tests d'intégration
  /scripts      # Scripts PowerShell/curl
  /fixtures     # Données de test
  /utils        # Utilitaires de test
```

## Installation

```bash
npm install --save-dev jest supertest @types/jest @types/supertest
npm install --save-dev @playwright/test
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

## Exécution

```bash
# Tests API
npm run test:api

# Tests E2E
npm run test:e2e

# Scripts manuels
cd scripts
./run-all-tests.ps1
```

## Couverture

- ✅ Authentification & permissions
- ✅ CRUD Events (publication programmée)
- ✅ API Admin & Public
- ✅ Sécurité & rate limiting
- ✅ Performance & cache
- ✅ Accessibilité
