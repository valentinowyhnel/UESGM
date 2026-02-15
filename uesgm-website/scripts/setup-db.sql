-- SCRIPT DE CONFIGURATION SUR MESURE : UESGM WEBSITE --
-- À exécuter par un utilisateur SUPERUSER (ex: postgres) --
-- 1. Création du rôle administrateur dédié pour l'application (Sécurité accrue)
-- Note : Remplacez 'UESGM_Strong_Password_2025' par un mot de passe réel.
DO $$ BEGIN IF NOT EXISTS (
    SELECT
    FROM pg_catalog.pg_roles
    WHERE rolname = 'uesgm_admin'
) THEN CREATE ROLE uesgm_admin WITH LOGIN PASSWORD 'UESGM_Strong_Password_2025';
END IF;
END $$;
-- 2. Création de la base de données
-- Note : On ne peut pas créer de DB dans un bloc transactionnel, donc on vérifie l'existence avant manuellement.
-- CREATE DATABASE uesgm_website OWNER uesgm_admin;
-- 3. Configuration des privilèges de sécurité (Post-création)
-- \c uesgm_website
-- Révoquer les privilèges publics par défaut (Zero Trust)
-- REVOKE ALL ON SCHEMA public FROM PUBLIC;
-- GRANT ALL ON SCHEMA public TO uesgm_admin;
-- 4. Optimisation PostgreSQL pour Next.js/Prisma
-- ALTER DATABASE uesgm_website SET timezone TO 'UTC';
-- MESSAGE
SELECT 'Configuration uesgm_admin préparée. Veuillez créer la DB avec: CREATE DATABASE uesgm_website OWNER uesgm_admin;' as notice;