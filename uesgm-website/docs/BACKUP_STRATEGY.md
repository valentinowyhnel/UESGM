# 🛡️ Stratégie de Sauvegarde UESGM

## 📊 Base de Données (PostgreSQL)

### 1. Sauvegardes Quotidiennes
Toute la base de données est sauvegardée quotidiennement à 03h00 UTC.
- **Outil**: `pg_dump` via Supabase ou script externe.
- **Rétention**: 30 jours glissants.
- **Stockage**: S3 sécurisé (hors de l'infrastructure DB).

### 2. Sauvegardes Hebdomadaires
Une sauvegarde complète est archivée chaque semaine.
- **Rétention**: 1 an.

### 3. Procédure de Restauration
- Tester la restauration mensuellement dans un environnement de staging.
- Commande: `psql -f backup_file.sql`

## 📁 Stockage de Fichiers (Supabase Storage / S3)

- **Versioning**: Activé sur tous les buckets de documents.
- **Réplication**: Géo-réplication activée entre deux régions.
- **Backup**: Synchronisation hebdomadaire vers un bucket de sauvegarde "cold storage".

## 🔐 Secrets et Configuration

- Les variables d'environnement (`.env`) sont sauvegardées dans un gestionnaire de secrets (GitHub Secrets / Vercel Env).
- Ne jamais versionner les fichiers `.env`.

## 📈 Plan de Reprise d'Activité (PRA)

En cas de sinistre majeur :
1. Provisionner une nouvelle instance de base de données.
2. Restaurer la dernière sauvegarde quotidienne (perte max < 24h).
3. Redéployer via GitHub Actions.
4. Pointer les DNS vers la nouvelle instance.
