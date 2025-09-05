#!/bin/bash

# Script de configuration initiale pour Nourx-app
set -e

echo "🚀 Configuration initiale de Nourx-app..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f "../.env" ]; then
    echo "📄 Création du fichier .env depuis .env.example..."
    cp ../.env.example ../.env
    echo "✅ Fichier .env créé. Veuillez le modifier selon vos besoins."
else
    echo "✅ Fichier .env déjà existant."
fi

# Créer les dossiers nécessaires
echo "📁 Création des dossiers nécessaires..."
mkdir -p ../storage/uploads
mkdir -p ../backend/src/{config,lib,routes,services,middleware,types}
mkdir -p ../backend/migrations
mkdir -p ../backend/seeds
mkdir -p ../backend/tests/{unit,integration,e2e}

# Démarrer PostgreSQL
echo "🐘 Démarrage de PostgreSQL..."
docker-compose up -d postgres

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
timeout=60
counter=0
until docker-compose exec postgres pg_isready -U ${POSTGRES_USER:-nourx} || [ $counter -eq $timeout ]; do
    sleep 1
    ((counter++))
    echo "Attente... ($counter/$timeout)"
done

if [ $counter -eq $timeout ]; then
    echo "❌ Timeout: PostgreSQL n'est pas prêt après ${timeout}s"
    exit 1
fi

echo "✅ PostgreSQL est prêt!"

# Instructions finales
echo ""
echo "🎉 Configuration terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Modifier le fichier .env selon vos besoins"
echo "2. Aller dans le dossier backend: cd ../backend"
echo "3. Installer les dépendances: npm install"
echo "4. Lancer les migrations: npm run migrate"
echo "5. Lancer les seeds: npm run seed"
echo "6. Démarrer le serveur: npm run dev"
echo ""
echo "Pour arrêter PostgreSQL: docker-compose down"
echo "Pour voir les logs: docker-compose logs -f postgres"