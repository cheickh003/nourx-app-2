# Plan d’implémentation – Espace Client NOURX

Ce document détaille un plan complet et séquencé pour construire, tester et mettre en production le portail client NOURX en partant de zéro, selon les spécifications `docs/prd.md` et l’architecture `docs/architecture-django.md`.

## 0. Résumé Exécutif

- **Objectif**: livrer **deux dashboards distincts** sur stack Django/DRF/S3 only :
  1. **Dashboard Client** : portail moderne pour suivi projets, paiements CinetPay, collaboration
  2. **Dashboard Admin NOURX** : back-office complet pour pilotage business, gestion clients/prospects, configuration
- **Stack technique** : Django 5 + DRF (sessions/CSRF), Django Channels (temps réel), Celery + Beat (jobs planifiés), PostgreSQL, S3 (django-storages), Next.js (App Router) + Tailwind + shadcn/ui
- **Stratégie** : développement priorisé Dashboard Client d'abord (semaines 1-6) puis Dashboard Admin (semaines 7-9), itérations verticales par fonctionnalité, sécurité (CSRF/CORS/HSTS), robustesse paiements (webhook HMAC + re-check `/v2/payment/check`)

## 1. Portée & Hors-périmètre

### Portée MVP - Deux Applications Distinctes

**A) Dashboard Client (Interface Épurée)**
- Authentification et profil client
- Vue d'ensemble projets personnalisés 
- Suivi tâches assignées (kanban/liste)
- Consultation/paiement factures CinetPay
- Gestion documents projet (S3 sécurisé)
- Support/réclamations
- Préférences et notifications

**B) Dashboard Admin NOURX (Back-office Complet)**
- KPIs business et alertes opérationnelles
- Gestion complète clients et prospects
- Pilotage tous projets et tâches
- Facturation et monitoring paiements
- Configuration système et paramètres
- Support centralisé et SLA

**Composants Techniques Communs**
- Backend Django/DRF avec permissions scopées
- Base PostgreSQL + Redis + S3
- Observabilité (Sentry/PostHog) + CI/CD

### Hors-périmètre (MVP)
- Multi-équipes internes, portail multi-entreprises
- Relances automatiques multicanal avancées
- E-signature avancée, intégrations ERP
- Mobile apps natives (web responsive suffisant)

## 2. Architecture & Décisions (résumé)

- Frontend: Next.js (App Router, RSC), Tailwind, shadcn/ui. Fetch avec `credentials: 'include'` pour cookies sessions.
- Backend: Django 5, DRF (SessionAuthentication + CSRF), Django Admin, django-cors-headers, SecurityMiddleware, Postgres (psycopg), django-storages + S3.
- Temps réel: Django Channels + Redis. Tâches: Celery + django-celery-beat. PDF: WeasyPrint. API Docs: drf-spectacular.
- Paiements: CinetPay (init, webhook HMAC `x-token`, re-check `/v2/payment/check`).

Référence: voir `docs/architecture-django.md`.

## 3. Environnements & Outils

- Dev local (docker-compose):
  - `web` (Django ASGI + DRF + Channels)
  - `worker` (Celery), `beat` (scheduler), `redis` (broker + channels), `postgres`, `minio` (S3 local), `mailhog` (email dev)
  - `web-frontend` (Next.js dev server)
- Staging/Prod:
  - Postgres managé (p. ex. RDS), Redis managé (ElastiCache), S3, domaines `app.nourx.com` (Next) / `api.nourx.com` (Django), TLS obligatoire.
- Qualité & DX:
  - Backend: `black`, `isort`, `ruff` (lint), `pytest`, `coverage`, `pre-commit`
  - Frontend: `eslint`, `prettier`, `typescript --noEmit`, `vitest`/`jest` + `testing-library`, `playwright` (e2e)
- Observabilité: Sentry (Next + Django), PostHog (analytics produit)
- Docs API: drf-spectacular (OpenAPI), collection Postman.

## 4. Structure du Dépôt (monorepo conseillé)

- `apps/web` (Next.js)
- `apps/api` (Django)
- `infra/compose` (docker-compose.yml, .env.example)
- `infra/scripts` (make, bootstrap, migrations, seed)
- `.github/workflows` (CI/CD)
- `docs/` (PRD, architecture, plan)

## 5. Feuille de Route d'Implémentation - Focus Deux Dashboards (phases)

**Stratégie** : Dashboard Client en priorité (phases 0-5), puis Dashboard Admin (phases 6-8), finition commune (phase 9).

### Phase 0 – Bootstrap & Infra (1–2 j)
- Initialiser monorepo Django/DRF/S3 only, licences internes, `.editorconfig`, `pre-commit`
- Docker Compose: services (web, worker, beat, redis, postgres, minio, mailhog, web-frontend)
- Makefile: `make up`, `make down`, `make migrate`, `make createsuperuser`, `make seed-data`
- Variables d'environnement : `.env.example` pour front/back (stack Django/DRF/S3)
- **Critères** : services OK, admin Django accessible, Next.js accueil accessible

### Phase 1 – Backend Django/DRF Fondation (3–5 j)
- Projet Django (`apps/api`): settings split (base/dev/prod), ASGI, URLs de base
- Apps Django : `core`, `accounts`, `clients`, `projects`, `tasks`, `documents`, `billing`, `payments`, `support`, `audit`
- **Configuration Django/DRF/S3 only** :
  - DRF : `SessionAuthentication` + `IsAuthenticated` + permissions custom
  - PostgreSQL + Redis + S3 (django-storages)
  - Channels optionnel pour temps réel
  - Celery + Beat pour jobs planifiés
- Auth endpoints : login/logout + `/api/me/` (profil courant)
- Admin Django sécurisé
- **Critères** : OpenAPI générée, auth fonctionnelle, tests unitaires de base

### Phase 2 – Frontend Fondation : Dashboard Client (3–5 j)
- **Focus Dashboard Client uniquement** (interface épurée)
- Next.js + Tailwind + shadcn/ui : layout client simplifié
- Navigation client : Dashboard, Projets, Tâches, Factures, Documents, Support, Profil
- API client avec `credentials: 'include'`, gestion CSRF
- Auth UI : login/logout côté client
- **Critères** : parcours login client → dashboard, navigation protégée, style épuré conforme PRD

### Phase 3 – Core Client : Projets & Tâches (4–6 j)
- **Focus MVP Dashboard Client opérationnel**
- Modèles : `Client`, `Project`, `Task`, permissions DRF scopées par client_id
- Endpoints clients : projets du client, tâches assignées
- UI Client : dashboard projets, liste/détail projets, kanban tâches simplifié
- **Critères** : client voit uniquement ses projets/tâches, permissions strictes validées

### Phase 4 – Documents & Facturation Client (3–5 j)
- **Focus fonctionnalités critiques client**
- Documents S3 : modèles, presigned URLs, upload/download sécurisé
- Factures : consultation, historique, génération PDF (WeasyPrint)
- UI Client : section documents par projet, section factures avec détails
- **Critères** : client accède à ses documents, voit ses factures, télécharge PDFs

### Phase 5 – Paiements CinetPay Client (5–8 j)
- **Focus robustesse paiements côté client**
- Intégration CinetPay : init paiement, webhook HMAC x-token, re-check `/payment/check`
- UI Client : bouton payer sur facture, écrans succès/échec, statut paiement
- Tests paiements : mocks + staging réel, idempotence
- **Critères** : flux paiement complet robuste depuis dashboard client

### Phase 6 – Dashboard Admin : Bootstrap & KPIs (3–5 j)
- **Début Dashboard Admin (interface dense)**
- Layout admin : sidebar étendue, navigation complexe
- Dashboard business : KPIs projets, finances, alertes, activité temps réel
- Vue générale : tous projets, tous clients, métriques globales
- **Critères** : dashboard admin fonctionnel, KPIs affichés, navigation admin complète

### Phase 7 – Admin : Gestion Clients & Projets (4–6 j)
- **Focus pilotage business admin**
- CRUD clients/prospects : pipeline commercial, segmentation
- Pilotage projets : vue kanban globale, assignation tâches
- Facturation admin : génération, envoi, monitoring paiements
- **Critères** : admin gère tous clients/projets, génère factures, suit paiements

### Phase 8 – Admin : Support & Configuration (3–4 j)
- **Focus outils de gestion avancés**
- Support : tickets centralisés, SLA, attribution
- Configuration : branding, paramètres CinetPay, modèles emails
- Documentation admin : guides d'utilisation
- **Critères** : admin gère support complet, configure système, accède à tous paramètres

### Phase 9 – Finition Commune & Go-Live (3–5 j)
- **Focus finalisation pour production**
- Temps réel (Channels) : WebSocket pour mises à jour tâches/notifications
- Observabilité : Sentry (Django + Next.js), PostHog, structured logging
- Sécurité : `SECURE_*`, HSTS, CSP, rate-limiting endpoints sensibles
- CI/CD : GitHub Actions, déploiement automatique staging/prod
- Tests E2E : Playwright scénarios clés (client + admin)
- **Critères** : production ready, monitoring actif, déploiement automatisé, documentation complète

**Planning indicatif :**
- **Semaines 1-3** : Phases 0-2 (fondations + Dashboard Client)
- **Semaines 4-6** : Phases 3-5 (Dashboard Client complet)  
- **Semaines 7-8** : Phases 6-8 (Dashboard Admin complet)
- **Semaine 9** : Phase 9 (finition + go-live)

## 6. Spécifications Domaines & API (extrait)

- Auth:
  - `POST /api/auth/login/` (username/email, password) → Set-Cookie session, cookie `csrftoken`
  - `POST /api/auth/logout/`
  - `GET /api/me/` → { id, name, role, client_ids }
- Clients/Profils:
  - `GET /api/clients/`, `POST /api/clients/` (admin)
  - `GET /api/clients/{id}/` (owner)
- Projets & Jalons:
  - `GET/POST /api/projects/`, `GET/PATCH /api/projects/{id}/`
  - `GET/POST /api/milestones/`
- Tâches & Commentaires:
  - `GET/POST /api/tasks/?project=`, `PATCH /api/tasks/{id}/` (status, assignee)
  - `GET/POST /api/tasks/{id}/comments/`
- Documents & S3:
  - `POST /api/uploads/presign` → { url, fields } (presigned POST)
  - `GET /api/documents/{id}/download` → URL signée
- Devis/Factures:
  - `GET/POST /api/invoices/`, `GET /api/invoices/{id}/`, `GET /api/invoices/{id}/pdf`
- Paiements:
  - `POST /api/payments/init/` → { checkout_url | params }
  - `POST /api/payments/webhook/` (HMAC `x-token` sur raw body)
  - `GET /api/payments/{id}/status/` (et re-check Celery)
- Tickets:
  - `GET/POST /api/tickets/`, `PATCH /api/tickets/{id}/`

Notes sécurité API: toujours `SessionAuthentication` + CSRF; `IsAuthenticated` + permission custom par `client_id`.

## 7. Modèles (extrait minimal pour plan)

- `Profile(user OneToOne, role: admin|client, phone)`
- `Client(name, main_contact, ...)` ; `ClientMember(user, client, role)`
- `Project(client FK, title, status, progress)` ; `Milestone(project, title, due_date, status)`
- `Task(project, title, status, priority, assigned_to)` ; `TaskComment(task, author, body, created_at)`
- `Document(project, bucket, key, label, visibility, size, mimetype)`
- `Quote(client, project, total_ht, currency, status, pdf_key)`
- `Invoice(client, project, total_ttc, currency, due_date, status, external_ref)` ; `InvoiceItem(invoice, label, qty, unit_price)`
- `Payment(invoice, amount, method, status, cinetpay_trans_id, raw_payload_json)` ; `PaymentAttempt(invoice, transaction_id, status, channel, created_at)`
- `Ticket(client, project, subject, status, priority)`
- `AuditLog(actor, action, entity, entity_id, diff_json, created_at)`

Indexation: index sur `client_id`, `project_id`, `status`, `due_date`, `created_at` pour tables volumineuses.

## 8. Emails & PDF

- Template emails (Jinja/Django Templates), Mailer (SMTP local → Mailhog, prod via provider), async via Celery.
- PDF: WeasyPrint + templates HTML (branding), upload S3, invalidation au changement de facture.

## 9. Variables d’Environnement (extrait)

- Commun: `ENV`, `SENTRY_DSN`, `POSTHOG_KEY` (front)
- Django: `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `AWS_*` (S3), `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY`
- Next: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `API_BASE_URL`

## 10. Checklists Go-Live

- Sécurité:
  - `DEBUG=False`, `ALLOWED_HOSTS` set, `SECURE_*` activés (HSTS, cookies Secure), admin sous IP allow, rotation clés
  - CORS/CSRF stricts, rate-limit sur auth/webhooks, logs d’audit
- Infra:
  - DB RDS + sauvegardes, Redis managé, S3 versionning + lifecycle, TLS, monitoring
- Paiements:
  - Webhook validé en staging réel, idempotence testée, re-check `/v2/payment/check` actif
- Observabilité:
  - Sentry relié, alertes basiques, dashboards logs
- QA:
  - E2E Playwright « parcours client » vert; couverture tests back critiques >80%

## 11. Risques & Mitigation

- Paiements non fiables (webhooks perdus): re-check périodique Celery, idempotence stricte, journalisation brute.
- CSRF/CORS mal configurés: proxy dev Next→Django, tests d’intégration auth, checklists déploiement.
- Fuites d’accès S3: bucket privé, presigned seulement, policy minimales, logs accès.
- Charge WS: backpressure, limites de rooms, monitoring Channels.

## 12. Planning indicatif - Deux Dashboards MVP (~9 semaines)

**Priorisation Dashboard Client d'abord (valeur client maximale)**

**Semaines 1-3 : Fondations + Dashboard Client Base**
- S1 : Phase 0-1 (bootstrap Django/DRF/S3 + backend fondation)
- S2 : Phase 2 (frontend client + auth)
- S3 : Phase 3 (projets & tâches côté client)

**Semaines 4-6 : Dashboard Client Complet**  
- S4 : Phase 4 (documents S3 + facturation client)
- S5 : Phase 5 (paiements CinetPay robuste)
- S6 : Tests intensifs Dashboard Client + corrections

**Semaines 7-8 : Dashboard Admin Complet**
- S7 : Phases 6-7 (admin KPIs + gestion clients/projets)  
- S8 : Phase 8 (admin support + configuration)

**Semaine 9 : Finition & Production**
- S9 : Phase 9 (observabilité, sécurité, CI/CD, go-live)

**Stack confirmée Django/DRF/S3 Only :**
- Backend : Django 5 + DRF + PostgreSQL + Redis + S3
- Frontend : Next.js + Tailwind + shadcn/ui  
- Paiements : CinetPay + webhooks HMAC
- Jobs : Celery + Beat
- Monitoring : Sentry + PostHog

## 13. Références (pour mise en œuvre)

- Django CSRF: https://docs.djangoproject.com/en/5.0/ref/csrf/
- DRF Sessions: https://www.django-rest-framework.org/api-guide/authentication/#sessionauthentication
- Channels: https://channels.readthedocs.io/en/stable/
- Celery + Django: https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html
- django-celery-beat: https://django-celery-beat.readthedocs.io/en/latest/
- S3 (django-storages): https://django-storages.readthedocs.io/en/latest/
- Presigned URLs (boto3): https://boto3.amazonaws.com/v1/documentation/api/latest/guide/s3-presigned-urls.html
- Presigned POST policy: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html
- WeasyPrint: https://weasyprint.org/docs/
- drf-spectacular: https://drf-spectacular.readthedocs.io/en/latest/
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind + Next: https://tailwindcss.com/docs/guides/nextjs
- shadcn/ui: https://ui.shadcn.com/docs
- Sentry (Django/Next): https://docs.sentry.io/platforms/python/guides/django/ , https://docs.sentry.io/platforms/javascript/guides/nextjs/
- PostHog (Next): https://posthog.com/docs/libraries/next-js
- CinetPay HMAC & init: https://docs.cinetpay.com/api/1.0-en/checkout/hmac , https://docs.cinetpay.com/api/1.0-en/checkout/initialisation , https://docs.cinetpay.com/api/1.0-en/checkout/notification

