-- Initialisation de la base de données Nourx-app
-- Extensions PostgreSQL utiles

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour les types de données avancés
CREATE EXTENSION IF NOT EXISTS "citext";

-- Extension pour le cryptage
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Création des schémas
CREATE SCHEMA IF NOT EXISTS public;

-- Configuration des permissions par défaut (appliquées au rôle courant)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO CURRENT_USER;

-- Commentaires pour la documentation
COMMENT ON SCHEMA public IS 'Schema principal pour l''application Nourx-app';
