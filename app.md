# NOURX — Documentation Applicative (app.md)

Date: 2025‑08‑16
Auteur: Équipe NOURX
Version: 1.0 (Vue d’ensemble et détails techniques)

## 1) Vue d’ensemble

NOURX est un monorepo contenant :
- Backend API: Django 5 + Django REST Framework, Channels, Celery, PostgreSQL, Redis, S3/MinIO
- Frontend Web: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Infrastructure: Docker Compose (Postgres, Redis, MinIO, MailHog, API, worker Celery, beat, Frontend)
- Outils: drf‑spectacular (OpenAPI), pre‑commit (Black, isort, Ruff, Prettier, ESLint), Makefile outillé

Focus actuel: Portail Client (Phase 2 Frontend terminée), intégrations backend majeures posées (auth session + CSRF, paiements CinetPay, stockage S3), reste à connecter toutes les vues front aux endpoints et verrouiller la sécurité prod.


## 2) Architecture Logique

- Frontend Next.js
  - Pages/App Router (SSR/CSR) avec proxy de réécriture `/api/*` → Backend
  - Auth via sessions Django (cookies) + CSRF (token récupéré côté client)
  - React Query pour le fetching + cache, composants shadcn/ui
- API Django
  - DRF: authentification par session, permissions personnalisées (scopes client, rôles)
  - Apps métiers: comptes, clients, projets, tâches, documents, facturation, paiements, support
  - Intégration CinetPay: init paiement, webhook HMAC `x-token`, re‑check `/v2/payment/check`
- Asynchrone
  - Celery (worker + beat) avec Redis (broker/result backend)
  - Channels (ASGI) prêt; routage WebSocket à ajouter
- Données & Stockage
  - PostgreSQL (principal), S3/MinIO (documents & médias)
- Observabilité & Sécurité
  - Logs configurables, Sentry (DSN à fournir), CORS/CSRF paramétrables, headers sécurité en prod

Flux principaux
- Auth: `GET /csrf` → `POST /api/auth/login/` → cookies de session → appels API `credentials: 'include'`
- API proxy (dev): Next.js réécrit `/api/*` → `http://localhost:8000/api/*`
- Fichiers: Django‑storages (S3/MinIO) avec URLs signées (pattern prêt côté settings)
- Paiements: `POST /api/payments/init/` (token+url) → redirection CinetPay → `Webhook` + `Check` → mise à jour facture


## 3) Arborescence du Référentiel

Note: Arborescence source (exclut `.git`, `node_modules`, `.next`, fichiers de build).

```
.
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .pre-commit-config.yaml
├── .env (local, ignoré) / env.example
├── Makefile
├── README.md
├── app.md (ce document)
├── docs/
│   ├── architecture-django.md
│   ├── plan.md
│   └── prd.md
├── infra/
│   ├── compose/docker-compose.yml
│   └── scripts/bootstrap.sh
└── apps/
    ├── api/
    │   ├── Dockerfile
    │   ├── manage.py
    │   ├── requirements.txt
    │   ├── nourx/
    │   │   ├── asgi.py
    │   │   ├── celery.py
    │   │   ├── __init__.py
    │   │   ├── urls.py
    │   │   ├── wsgi.py
    │   │   └── settings/
    │   │       ├── __init__.py
    │   │       ├── base.py
    │   │       ├── dev.py
    │   │       └── prod.py
    │   ├── apps/
    │   │   ├── accounts/
    │   │   │   ├── __init__.py
    │   │   │   ├── apps.py
    │   │   │   ├── models.py
    │   │   │   ├── serializers.py
    │   │   │   ├── tests.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   │   ├── audit/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── migrations/
    │   │   │   └── models.py
    │   │   ├── billing/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── migrations/
    │   │   │   ├── models.py
    │   │   │   ├── serializers.py
    │   │   │   ├── templates/billing/{invoice_pdf.html,quote_pdf.html}
    │   │   │   ├── tests.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   │   ├── clients/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── migrations/
    │   │   │   ├── models.py
    │   │   │   ├── serializers.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   │   ├── core/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── apps.py
    │   │   │   ├── management/ (commands… si présent)
    │   │   │   ├── migrations/
    │   │   │   ├── mixins.py
    │   │   │   ├── models.py
    │   │   │   ├── permissions.py
    │   │   │   ├── serializers.py
    │   │   │   ├── tests.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   │   ├── documents/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── migrations/
    │   │   │   ├── models.py
    │   │   │   ├── serializers.py
    │   │   │   ├── tests.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   │   ├── payments/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── migrations/
    │   │   │   ├── models.py
    │   │   │   ├── serializers.py
    │   │   │   ├── tests.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   │   ├── projects/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── migrations/
    │   │   │   ├── models.py
    │   │   │   ├── serializers.py
    │   │   │   ├── tests.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   │   ├── support/
    │   │   │   ├── __init__.py
    │   │   │   ├── admin.py
    │   │   │   ├── migrations/
    │   │   │   ├── models.py
    │   │   │   ├── serializers.py
    │   │   │   ├── urls.py
    │   │   │   └── views.py
    │   ├── media/ (dev)
    │   ├── static/ (dev)
    │   └── templates/
    └── web/
        ├── Dockerfile.dev
        ├── package.json / package-lock.json
        ├── next.config.js
        ├── tailwind.config.js
        ├── postcss.config.js
        ├── tsconfig.json
        └── src/
            ├── app/
            │   ├── layout.tsx, page.tsx
            │   ├── login/page.tsx
            │   ├── set-password/page.tsx
            │   ├── paiement/{success,failed}/
            │   ├── (client)/{layout.tsx, dashboard, projets, taches, factures, documents, support, profil}/
            │   └── (admin)/{layout.tsx, dashboard, clients, projets, factures, paiements, support, configuration}/
            ├── components/
            │   ├── layout/{admin-*, client-*}
            │   ├── providers/react-query-provider.tsx
            │   └── ui/* (shadcn/ui internalisé)
            ├── hooks/{use-auth.ts, use-admin.ts, use-client-api.ts}
            ├── lib/{api.ts, auth.ts, utils.ts, ws.ts}
            └── types/{auth.ts, client.ts, invoice.ts, project.ts, support.ts}
```


## 4) Composants & Responsabilités

Backend Django (apps principales)
- accounts: Authentification par session, `login/logout/csrf`, création d’utilisateur client, reset/set password.
- core: `/api/me`, `/api/health`, stats admin, settings d’application, permissions custom.
- clients: Modèles Client/contacts/membres (p. ex. `ClientMember`) pour scoper l’accès.
- projects: Projet, jalons (Milestone) avec priorités, statuts, progression.
- tasks: Tâches (kanban: todo/in_progress/review/done…), priorités et types, relation projets/jalons.
- documents: Documents de projet (visibilité public/restricted/internal), stats d’accès, versions, S3.
- billing: Devis (Quote/QuoteItem), Factures (Invoice), PDF (WeasyPrint), totaux HT/TVA/TTC.
- payments: Paiements CinetPay (`Payment`, `PaymentAttempt`, `PaymentWebhook`), init/check/webhook.
- support: Tickets de support (statuts, priorités, visibilité). 
- audit: Hooks/admin/migrations pour traçabilité (à étendre).

Frontend Next.js
- App Router: groupements `(client)` et `(admin)` avec `layout.tsx` dédiés.
- Auth: `use-auth` + `authStore` (client-side) pour l’état utilisateur, appels `authApi`.
- API client: `lib/api.ts` (gestion CSRF + `credentials: 'include'`, erreurs typées `ApiError`).
- UI: Design system shadcn/ui internalisé (ownership code), Tailwind tokens.

Infrastructure
- `infra/compose/docker-compose.yml`: Postgres, Redis, MinIO, MailHog, `web` (Django), `worker` Celery, `beat`, `web-frontend` (Next dev)
- `infra/scripts/bootstrap.sh`: bootstrap: copie env, up, migrations, superuser, seed.


## 5) Paramétrage & Sécurité

Environnements & Variables (env.example)
- Django: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `REDIS_URL`
- S3/MinIO: `AWS_*` (path‑style, custom domain pour MinIO dev)
- CORS/CSRF: `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- Email: MailHog en dev, SMTP en prod
- CinetPay: `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY`, `*_URL`
- Frontend: `NEXT_PUBLIC_APP_URL`, `API_BASE_URL`, `NEXT_PUBLIC_API_URL`

Sécurité
- Dev: `CORS_ALLOW_ALL_ORIGINS=true` (dev), `login/logout` actuellement `csrf_exempt` (à durcir en prod)
- Prod: HSTS, SSL redirect, cookies sécurisés (variables prévues), Sentry optionnel
- Webhook CinetPay: signature HMAC `x-token` vérifiée avant traitement


## 6) Endpoints (extraits utiles)

Entrées globales (nourx/urls.py)
- Admin: `/{ADMIN_URL ou admin/}`
- OpenAPI: `/api/schema/` + `/api/schema/swagger-ui/` + `/api/schema/redoc/`
- Comptes: `/api/auth/` →
  - `POST /login/`, `POST /logout/`, `GET /csrf/`
  - `POST /reset-password/`, `POST /set-password/`
  - `PATCH /users/{id}/status/`
- Core: `/api/` → `GET /me/`, `GET /health/`, `GET /admin-stats/`, `GET/POST /settings/`, `GET /staff/`
- Paiements: `/api/payments/` →
  - `POST /init/`, `POST /webhook/`, `GET /check/?transaction_id=...`
  - REST read-only: `/api/payments` (list/retrieve)
- Autres apps (clients, projects, tasks, documents, billing, support): endpoints DRF standards (CRUD) + permissions/scopes.

Frontend (next.config.js)
- Rewrites en dev: `/api/:path*` → `http://localhost:8000/api/:path*`
- Rewrites en prod: `/api/:path*` → `${API_BASE_URL || NEXT_PUBLIC_API_URL}/api/:path*`
- Endpoints utilitaires front: `/csrf` → backend `/api/auth/csrf/`


## 7) Modèle de Données (résumé)

- Client & Membre (`clients`): organisation cliente, membres, rôles (`owner/admin/...`) pour scoper l’accès
- Projet & Jalons (`projects`): statut, priorité, progression, dates, chef de projet, équipe
- Tâche (`tasks`): statut (todo → done), priorité, type, parent/subtasks, jalon associé
- Documents (`documents`): métadonnées fichier, visibilité (public/restricted/internal), versioning, stats d’accès, S3
- Devis/Facture (`billing`): Quote/QuoteItem (totaux HT/TVA/TTC), Invoice (statuts: draft/sent/paid/…)
- Paiement (`payments`): Payment (statut: pending/processing/completed/failed/…), PaymentAttempt, PaymentWebhook
- Support (`support`): Ticket (statuts/priorités), visibilités


## 8) Permissions & Auth

- DRF par défaut: `IsAuthenticated` + `SessionAuthentication`
- Permissions custom (core/permissions.py)
  - `IsAdminUser`, `IsNourxStaff`, `IsClientUser`
  - `ClientScopedPermission`: restreint l’accès aux objets liés au client du user (via `ClientMember`)
  - `ClientAdminPermission`: écriture réservée aux rôles owner/admin du client
  - `DocumentVisibilityPermission`, `SupportTicketPermission`: respectent `visibility/is_public`


## 9) Développement & Exécution

Avec Docker (recommandé)
```
# 1) Préparer l’environnement
make setup  # copie env.example → .env

# 2) Lancer tous les services
make up

# 3) Migrations & superuser
make migrate
make createsuperuser

# (Optionnel) Données de démo
make seed-data

# Logs
make logs      # tous
make logs-web  # API
make logs-frontend  # Next.js
```
URLs locales
- API Django: http://localhost:8000
- Admin Django: http://localhost:8000/admin/
- Front Web: http://localhost:3000
- MailHog: http://localhost:8025
- MinIO: http://localhost:9001 (S3: http://localhost:9000)

Dev Frontend seul
```
cd apps/web
npm install
npm run dev  # http://localhost:3000
```

Dev Backend seul (hors Docker)
```
cd apps/api
pip install -r requirements.txt
export DATABASE_URL=sqlite:///db.sqlite3  # ou Postgres
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Format/Lint (via pre-commit ou manuellement)
- Python: Black, isort, Ruff
- Web: Prettier, ESLint


## 10) Dépendances Clés

Backend
- Django 5, DRF, django-cors-headers, django-filter
- Channels 4, channels-redis
- Celery 5, django-celery-beat
- dj-database-url, psycopg2-binary
- django-storages, boto3
- drf-spectacular (OpenAPI)
- WeasyPrint (PDF), Pillow, requests, python-decouple
- Dev/Test: debug-toolbar, django-extensions, pytest(+django)

Frontend
- next@14, react@18, typescript@5
- tailwindcss, @tailwindcss/forms, @tailwindcss/typography
- @tanstack/react-query, react-hook-form, zod
- radix-ui, lucide-react, clsx, class-variance-authority


## 11) Observabilité & Qualité

- OpenAPI: `/api/schema/swagger-ui/`
- Logs: niveaux configurables via `LOGGING_LEVEL`
- Sentry: `SENTRY_DSN` (prod), intégrations Django/Celery prêtes
- Pre-commit: hooks Python/TS configurés


## 12) Avancement & Prochaines Étapes

Statut actuel
- Frontend (Phase 2): Dashboard Client implémenté (UI, navigation, auth côté client, proxy API, pages principales)
- Backend: Modèles/permissions/endpoints clés en place (auth, core, billing, payments, etc.), Celery/Channels prêts, intégration CinetPay opérationnelle (init/webhook/check)
- Infra: Docker Compose complet + Makefile + script bootstrap

Étapes recommandées
1) Connecter toutes les vues frontend aux endpoints réels (projets, tâches, factures, documents, support) et valider parcours de bout en bout
2) Sécurité prod: activer cookies sécurisés, CSRF strict (retirer `csrf_exempt` sur login/logout), ajuster CORS/CSRF pour domaines finaux
3) Documents: implémenter upload + génération d’URL signées, enforce `DocumentVisibilityPermission`
4) Paiements: finaliser UX de retour CinetPay (success/failure), tester webhook avec secret HMAC, rapprocher les montants
5) Observabilité: activer Sentry, métriques de base; journaux webhook/paiement plus verbeux en debug, sobres en prod
6) CI/CD: ajouter workflows GitHub (lint + tests + build), pipeline de déploiement
7) (Optionnel) Temps réel: ajouter routes WS (Channels) pour activité et notifications


## 13) Annexes

Décisions de conception
- Sessions + CSRF retenues pour simplicité et sécurité (au lieu de JWT)
- MinIO en dev avec addressing path‑style (compatibilité), custom domain `localhost:9000/bucket` pour accès navigateur
- Rewrites Next.js garantissent que le front ne “voit” pas le host Docker interne en dev

Glossaire rapide
- CSR/SSR: Client/Server Side Rendering
- HSTS: HTTP Strict Transport Security
- S3: Stockage d’objets (MinIO: implémentation S3 compatible)
- CinetPay: PSP pour cartes/mobile money (checkout, webhook, check)

```
Dernière mise à jour: 2025‑08‑16
```
