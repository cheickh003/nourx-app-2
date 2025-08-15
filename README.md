# NOURX - Espace Client

Application de gestion d'espace client avec dashboards client et admin séparés.

## 🚀 Démarrage Rapide

### Prérequis

- Docker et Docker Compose
- Make (optionnel, mais recommandé)

### Bootstrap Initial

```bash
# Méthode 1: Script automatique
./infra/scripts/bootstrap.sh

# Méthode 2: Étapes manuelles
make setup
make up
make migrate
make createsuperuser
```

### Commandes Utiles

```bash
# Services
make up          # Démarrer tous les services
make down        # Arrêter tous les services
make restart     # Redémarrer tous les services
make logs        # Voir les logs

# Base de données
make migrate     # Migrations Django
make resetdb     # Reset complet (⚠️ données perdues)
make shell       # Shell Django

# Développement
make test        # Tests
make lint        # Linting
make format      # Format du code
```

## 🏗️ Architecture

### Stack Technique

- **Backend**: Django 5 + DRF + PostgreSQL + Redis + S3 (MinIO en dev)
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Jobs**: Celery + Beat
- **Monitoring**: Sentry + PostHog
- **Email**: MailHog (dev)

### Structure Projet

```
nourx-app-2/
├── apps/
│   ├── api/          # Django/DRF Backend
│   └── web/          # Next.js Frontend
├── infra/
│   ├── compose/      # Docker Compose
│   └── scripts/      # Scripts utilitaires
├── docs/             # Documentation
└── Makefile          # Commandes automatisées
```

## 🌐 Services Disponibles

| Service | URL | Description |
|---------|-----|-------------|
| Next.js App | http://localhost:3000 | Interface utilisateur |
| Django API | http://localhost:8000 | API REST |
| Django Admin | http://localhost:8000/admin/ | Interface admin |
| API Docs | http://localhost:8000/api/schema/swagger-ui/ | Documentation API |
| MailHog | http://localhost:8025 | Interface email |
| MinIO Console | http://localhost:9001 | Interface S3 |

## 📝 Développement

### Phase 0 - Bootstrap ✅

- [x] Structure monorepo
- [x] Docker Compose avec tous les services  
- [x] Configuration Django/DRF
- [x] Configuration Next.js + Tailwind
- [x] Makefile avec commandes utiles
- [x] Variables d'environnement

### Phases Suivantes

Voir `docs/plan.md` pour le plan détaillé des phases suivantes :

- **Phases 1-5** : Dashboard Client complet
- **Phases 6-8** : Dashboard Admin complet  
- **Phase 9** : Production ready

## 🔧 Configuration

### Variables d'Environnement

Copiez `env.example` vers `.env` et configurez :

```bash
cp env.example .env
# Puis éditez .env selon vos besoins
```

### Base de Données

```bash
# Accès PostgreSQL
make dbshell

# Migrations
make makemigrations
make migrate
```

### Paiements (CinetPay)

Configurez les clés CinetPay dans `.env` :

```
CINETPAY_API_KEY=your-api-key
CINETPAY_SITE_ID=your-site-id  
CINETPAY_SECRET_KEY=your-secret-key
```

## 📚 Documentation

- [PRD](docs/prd.md) - Spécifications produit
- [Architecture](docs/architecture-django.md) - Architecture technique
- [Plan](docs/plan.md) - Plan d'implémentation

## 🚨 Troubleshooting

### Services ne démarrent pas

```bash
make clean
make up
```

### Problèmes de permissions

```bash
sudo chown -R $USER:$USER .
```

### Reset complet

```bash
make clean-all
make bootstrap
```

## 📄 Licence

Propriétaire - NOURX
