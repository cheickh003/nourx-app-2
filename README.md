# 🚀 NOURX Application

Une plateforme complète de gestion client avec système de tickets, projets, facturation et portails séparés pour administrateurs et clients.

## 📋 Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Contribution](#contribution)

## 🎯 Vue d'Ensemble

NOURX est une application web moderne construite avec :

### Backend
- **Node.js** + **TypeScript** + **Express**
- **PostgreSQL** avec **Kysely** ORM
- **Better Auth** pour l'authentification
- **Redis** pour le cache et les sessions
- **S3** pour le stockage cloud
- **Email Worker** pour les notifications

### Frontend
- **Next.js 14** avec **App Router**
- **TypeScript** + **Tailwind CSS**
- **Shadcn/ui** pour les composants
- Portails séparés **Admin** et **Client**

### Infrastructure
- **Docker** pour le développement
- **AWS S3** pour le stockage
- **Redis** pour la cache
- Système de **backup automatisé**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   Next.js 14    │◄──►│   Node.js +     │◄──►│   PostgreSQL    │
│   Admin Portal  │    │   Express +     │    │   + Redis       │
│   Client Portal │    │   TypeScript    │    │   + S3          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Fonctionnalités Principales

#### 👨‍💼 Portail Administrateur
- Gestion des organisations et utilisateurs clients
- Système de tickets avec SLA et macros automatiques
- Gestion de projets et jalons
- Facturation (devis, factures, avoirs)
- Livrables avec versioning
- Documents partagés avec contrôle d'accès
- Analytics et métriques en temps réel
- Gestion des templates d'emails
- Audit log complet

#### 👨‍💻 Portail Client
- Dashboard personnalisé avec métriques
- Création et suivi de tickets de support
- Accès aux projets et jalons
- Téléchargement de livrables
- Consultation des factures
- Gestion du compte utilisateur
- Historique des activités

#### 🔧 Fonctionnalités Techniques
- **Multi-tenant** avec isolation des données
- **Authentication** robuste avec Better Auth
- **Rate limiting** et sécurité avancée
- **Email system** avec worker et templates
- **File storage** avec S3 et fallback local
- **Cache Redis** pour les performances
- **Backup automatisé** PostgreSQL et fichiers
- **Monitoring** avec métriques temps réel

## 🚀 Installation

### Prérequis

- **Node.js** 18+ et **npm** 8+
- **Docker** et **Docker Compose**
- **Git**

### 1. Cloner le Repository

```bash
git clone <repository-url>
cd nourx-app-2
```

### 2. Installation des Dépendances

```bash
# Installation des dépendances pour tous les packages
npm install

# Ou individuellement
cd backend && npm install
cd ../frontend && npm install
cd ../shared && npm install
```

### 3. Configuration de l'Environnement

```bash
# Backend - Copier et configurer
cd backend
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env
```

**Variables critiques à configurer :**
- `POSTGRES_*` : Configuration base de données
- `BETTER_AUTH_SECRET` : Secret 32+ caractères
- `JWT_SECRET` : Secret JWT
- `SMTP_*` : Configuration email
- `AWS_*` : Credentials S3 (optionnel en dev)
- `REDIS_*` : Configuration Redis

### 4. Démarrer l'Infrastructure

```bash
# Démarrer PostgreSQL et Redis
cd infra
docker-compose up -d

# Vérifier que les services sont démarrés
docker-compose ps
```

### 5. Initialiser la Base de Données

```bash
cd backend

# Exécuter les migrations
npm run migrate:up

# (Optionnel) Seed avec des données de test
npm run seed
```

### 6. Démarrer les Applications

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - (Optionnel) Email Worker standalone
cd backend
npm run worker:email
```

### 7. Accès aux Applications

- **Frontend Client** : http://localhost:3000
- **Frontend Admin** : http://localhost:3000/admin
- **Backend API** : http://localhost:3001
- **API Health** : http://localhost:3001/health

### 8. Comptes par Défaut

Les comptes suivants sont créés lors du seed :

**Admin par défaut :**
- Email : `admin@nourx.com`
- Mot de passe : `AdminPassword123!`

## ⚙️ Configuration

### Variables d'Environnement

#### Backend (.env)

| Variable | Description | Défaut | Requis |
|----------|-------------|--------|---------|
| `NODE_ENV` | Environnement | `development` | ✓ |
| `PORT` | Port du serveur | `3001` | ✓ |
| `POSTGRES_*` | Configuration DB | - | ✓ |
| `BETTER_AUTH_SECRET` | Secret auth (32+ char) | - | ✓ |
| `JWT_SECRET` | Secret JWT | - | ✓ |
| `SMTP_*` | Configuration email | - | ✓ |
| `REDIS_*` | Configuration Redis | `localhost:6379` | ✗ |
| `AWS_*` | Credentials S3 | - | ✗ |
| `CORS_ORIGIN` | Origins autorisées | `http://localhost:3000` | ✓ |

Voir `.env.example` pour la liste complète.

### Docker Services

```yaml
# infra/docker-compose.yml
services:
  postgres:    # Base de données principale
  redis:       # Cache et sessions
  mailhog:     # Serveur email de test (dev)
```

### Stockage des Fichiers

Le système supporte deux modes de stockage :

#### Mode Local (Développement)
```env
STORAGE_PROVIDER=local
FILE_STORAGE_PATH=./storage
```

#### Mode S3 (Production)
```env
STORAGE_PROVIDER=s3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_DOCUMENTS=nourx-documents
```

## 📖 Utilisation

### Scripts Disponibles

#### Backend
```bash
npm run dev          # Démarrage développement
npm run build        # Build production
npm run start        # Démarrage production
npm run test         # Tests unitaires
npm run test:e2e     # Tests end-to-end
npm run migrate:up   # Migration DB
npm run migrate:down # Rollback migration
npm run seed         # Seed base de données
npm run lint         # Vérification code
npm run type-check   # Vérification types
```

#### Frontend
```bash
npm run dev          # Démarrage développement
npm run build        # Build production
npm run start        # Démarrage production
npm run lint         # Vérification code
npm run type-check   # Vérification types
```

### Workflow de Développement

1. **Créer une branche** pour la feature
2. **Modifier le code** (backend/frontend/shared)
3. **Tester localement** avec `npm run test`
4. **Vérifier les types** avec `npm run type-check`
5. **Linter** avec `npm run lint`
6. **Commit** avec des messages descriptifs
7. **Push** et créer une Pull Request

### Structure des Données

#### Multi-Tenancy
Chaque client appartient à une `organization`. L'isolation des données est assurée au niveau des requêtes avec filtrage automatique par `organization_id`.

#### Roles et Permissions
- **Admin** : Accès complet système
- **Manager** : Gestion organisation
- **Agent** : Support et tickets
- **Accountant** : Facturation
- **Client** : Accès portail client

## 🔗 API Documentation

### Endpoints Principaux

#### Authentication
```
POST   /api/auth/login              # Connexion
POST   /api/auth/logout             # Déconnexion
POST   /api/auth/refresh            # Refresh token
```

#### Organizations
```
GET    /api/orgs                    # Liste organisations
POST   /api/orgs                    # Créer organisation
GET    /api/orgs/:id                # Détails organisation
PATCH  /api/orgs/:id                # Modifier organisation
```

#### Tickets
```
GET    /api/tickets                 # Liste tickets
POST   /api/tickets                 # Créer ticket
GET    /api/tickets/:id             # Détails ticket
PATCH  /api/tickets/:id             # Modifier ticket
POST   /api/tickets/:id/replies     # Ajouter réponse
```

#### Projects
```
GET    /api/projects                # Liste projets
POST   /api/projects                # Créer projet
GET    /api/projects/:id            # Détails projet
POST   /api/projects/:id/milestones # Ajouter jalon
```

### Réponses API

#### Format Standard
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  }
}
```

#### Format d'Erreur
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  }
}
```

## 🧪 Tests

### Tests Backend

```bash
cd backend

# Tests unitaires
npm run test

# Tests avec coverage
npm run test:coverage

# Tests end-to-end
npm run test:e2e

# Tests en mode watch
npm run test:watch
```

### Tests Frontend

```bash
cd frontend

# Tests unitaires (Jest)
npm run test

# Tests E2E (Playwright)
npm run test:e2e
```

### Structure des Tests

```
backend/tests/
├── unit/           # Tests unitaires services
├── integration/    # Tests intégration API
└── e2e/           # Tests end-to-end

frontend/tests/
├── components/     # Tests composants
├── pages/         # Tests pages
└── e2e/          # Tests end-to-end
```

## 🚢 Déploiement

### Production avec Docker

```bash
# Build des images
docker-compose -f docker-compose.prod.yml build

# Démarrage production
docker-compose -f docker-compose.prod.yml up -d
```

### Variables d'Environnement Production

```bash
# Copier et configurer pour production
cp .env.production .env

# Modifier avec vos valeurs de production
# IMPORTANT: Changer tous les secrets !
```

### Checklist Déploiement

- [ ] **Secrets** : Générer secrets uniques pour production
- [ ] **Base de données** : PostgreSQL configurée avec backups
- [ ] **Redis** : Instance Redis configurée
- [ ] **S3** : Buckets S3 créés avec permissions
- [ ] **Email** : SMTP configuré
- [ ] **SSL** : Certificats SSL installés
- [ ] **Backup** : Scripts de backup configurés
- [ ] **Monitoring** : Sentry/monitoring configuré

### Backup et Maintenance

```bash
# Backup base de données
npm run backup:db

# Backup fichiers
npm run backup:files

# Restore depuis backup
npm run restore:db -- backup-file.sql
```

## 🤝 Contribution

### Guidelines

1. **Fork** le repository
2. Créer une **branche feature** (`git checkout -b feature/amazing-feature`)
3. **Commit** les changements (`git commit -m 'Add amazing feature'`)
4. **Push** la branche (`git push origin feature/amazing-feature`)
5. Créer une **Pull Request**

### Standards Code

- **TypeScript** strict mode
- **ESLint** + **Prettier** pour le formatting
- **Conventional Commits** pour les messages
- **Tests** requis pour nouvelles fonctionnalités
- **Documentation** mise à jour

### Architecture Decision Records (ADR)

Les décisions techniques importantes sont documentées dans `docs/adr/`.

## 📚 Documentation Supplémentaire

- [Architecture Détaillée](docs/ARCHITECTURE.md)
- [Guide API](docs/API.md)
- [Guide Déploiement](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 📞 Support

- **Issues** : Utiliser GitHub Issues
- **Documentation** : Voir dossier `/docs`
- **Email** : support@nourx.com

## 📄 License

UNLICENSED - Usage privé uniquement

---

**Développé avec ❤️ par l'équipe NOURX**