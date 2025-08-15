# Plan d’implémentation – Espace Client NOURX

Ce document détaille un plan complet et séquencé pour construire, tester et mettre en production le portail client NOURX en partant de zéro, selon les spécifications `docs/prd.md` et l’architecture `docs/architecture-django.md`.

## 0. Résumé Exécutif

- Objectif: livrer un portail client moderne (front Next.js + back Django/DRF) couvrant projets, tâches (kanban), documents, devis/factures, paiement CinetPay, réclamations, avec un back-office via Django Admin.
- Principaux choix: Django 5 + DRF (sessions/CSRF), Django Channels (temps réel), Celery + Beat (jobs planifiés), PostgreSQL, S3 (django-storages), Next.js (App Router) + Tailwind + shadcn/ui.
- Stratégie: itérations verticales (backend + frontend par fonctionnalité), qualité par défaut (tests, lint, CI), sécurité (CSRF/CORS/HSTS), robustesse paiements (webhook HMAC + re-check `/v2/payment/check`).

## 1. Portée & Hors-périmètre

- Portée: fonctionnalités MVP du PRD (Dashboard, Projets, Roadmap, Tâches, Devis/Factures + Paiement CinetPay, Documents, Tickets, Paramètres) + Admin (mono-utilisateur) + Observabilité + CI/CD.
- Hors-périmètre (MVP): multi-équipes internes, portail multi-entreprises, relances multicanal avancées, e-sign avancée. Prévoir extensibilité.

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

## 5. Feuille de Route d’Implémentation (phases)

Chaque phase produit des livrables testables avec critères d’acceptation.

### Phase 0 – Bootstrap & Infra (1–2 j)
- Initialiser monorepo, licences internes, `.editorconfig`, `pre-commit`.
- Docker Compose: services (web, worker, beat, redis, postgres, minio, mailhog, web-frontend).
- Makefile/justfile: `make up`, `make down`, `make logs`, `make migrate`, `make createsuperuser`.
- Secrets: `.env.example` pour front/back (voir Annexe ENV).
- Critères: `docker compose up` lève tous les services; admin Django accessible; Next.js page d’accueil accessible.

### Phase 1 – Backend Fondation (Django/DRF) (3–5 j)
- Projet Django (`apps/api`): settings split (base/dev/prod), ASGI, `urls.py` de base.
- Apps: `core`, `accounts`, `clients`, `projects`, `tasks`, `documents`, `billing`, `payments`, `support`, `audit`.
- Settings:
  - `INSTALLED_APPS`: `rest_framework`, `corsheaders`, `channels`, `django_celery_beat`, `storages`, `drf_spectacular`.
  - `MIDDLEWARE`: `SecurityMiddleware`, `SessionMiddleware`, `CsrfViewMiddleware`, `AuthenticationMiddleware`, `CorsMiddleware`.
  - DB Postgres, CHANNEL_LAYERS Redis, Celery (broker/backends), S3 storages, CORS/CSRF (origines Next), SecurityMiddleware (HSTS, nosniff, referrer policy).
  - DRF: `SessionAuthentication` + `IsAuthenticated` par défaut.
- URLs API: `api/schema/` (OpenAPI), `api/schema/swagger/` (UI), healthcheck.
- Auth endpoints: login/logout (Session) + `GET /api/me/` (profil courant).
- Admin: activer et sécuriser (IP allow en prod, 2FA optionnel).
- Critères: tests unitaires de base (auth, CSRF), OpenAPI générée, admin OK.

### Phase 2 – Frontend Fondation (Next.js) (3–5 j)
- Init Next.js (TypeScript, App Router), Tailwind, config design tokens (noir/blanc, accents), installer shadcn/ui avec composants de base (Button, Card, Input, Table, Dialog, Sheet, Tabs, Dropdown, Toast).
- Layouts: Shell (Sidebar, Topbar), thème, routes protégées (middleware client/SSR). Pages placeholder: Dashboard, Projects, Tasks, Invoices, Documents, Tickets, Settings.
- API client: util fetch RSC/CSR avec `credentials: 'include'`, gestion CSRF (`X-CSRFToken`), wrapper d’erreur.
- Auth UI: pages login/logout, récupération de session (SSR) et redirection.
- Critères: parcours login → dashboard; navigation et protection routes; style de base conforme PRD.

### Phase 3 – Domaine Clients & Profils (2–3 j)
- Modèles: `Profile(user OneToOne, role: admin|client, phone)`, `Client` (raison sociale, contact, …), `ClientMember` (user↔client).
- Permissions DRF: `IsClientObjectOwner` (scope par `client_id`) + `IsAdminUser`.
- Endpoints: CRUD clients (admin), liste clients d’un user (client role limité).
- UI: liste clients (admin), sélection du client courant dans le shell UI si pertinent.
- Critères: Règles d’accès validées tests (admin vs client).

### Phase 4 – Projets & Roadmap (3–4 j)
- Modèles: `Project(client, title, status, progress)`, `Milestone(project, title, due_date, status)`.
- Endpoints: `GET/POST /projects`, `GET /projects/{id}`, `GET/POST /milestones`.
- UI: Liste + Détail projet (KPIs, jalons). Timeline jalons (shadcn components + simple timeline).
- Critères: visible seulement par le client propriétaire; admin voit tout.

### Phase 5 – Tâches, Kanban & Commentaires (4–6 j)
- Modèles: `Task(project, title, status: todo|doing|done, priority, assigned_to)`, `TaskComment(task, author, body)`.
- Endpoints: liste/filtre par projet, création, mise à jour, déplacement de colonne (PATCH), commentaires (CRUD minimal).
- UI: Kanban (drag & drop), détails de tâche (drawer/modal), commentaires en temps réel (placeholder pour Channels).
- Critères: déplacements persistés, commentaires s’affichent; permissions respectées.

### Phase 6 – Documents & Stockage S3 (3–5 j)
- Modèle: `Document(project, bucket, key, label, visibility, size, mimetype)`.
- Endpoints: `POST /uploads/presign` (policy presigned POST), `GET /documents/{id}/download` (URL signée), CRUD métadonnées.
- Intégration S3 (prod) / MinIO (dev). Filtrage MIME, taille max, antivirus option (ClamAV) en tâche Celery.
- UI: Uploader (direct-to-S3 via presigned), liste, prévisualisation (si possible), download sécurisé.
- Critères: upload direct, pas de fichiers en clair sur le backend, URLs signées expirables.

### Phase 7 – Devis, Factures & PDF (4–6 j)
- Modèles: `Quote`, `Invoice`, `InvoiceItem`, états `draft|sent|paid|overdue|canceled`.
- Génération PDF (WeasyPrint) async via Celery, stockage S3, endpoint `GET /invoices/{id}/pdf`.
- UI: liste devis/factures, détail facture, bouton export PDF.
- Critères: PDFs corrects, cache-control, permissions.

### Phase 8 – Paiements CinetPay (5–8 j)
- Endpoints:
  - `POST /payments/init/` (crée `PaymentAttempt`, appelle l’API CinetPay, retourne URL/params)
  - `POST /payments/webhook/` (raw body, vérif HMAC `x-token`), idempotent
  - `GET /payments/{id}/status/` et tâche Celery de re-check `/v2/payment/check`
- Sécurité: comparer montant/devise/référence; marquer facture payée seulement après `check` confirmé.
- Journalisation: stocker payload brut dans `payment_attempts`, relier à `payments` et `invoices`.
- UI: bouton « Payer » sur facture, écrans succès/échec, rafraîchissement statut.
- Tests: mocks API CinetPay, cas webhook répété/désordonné.
- Critères: flux complet robuste, idempotence vérifiée, anti-tamper via HMAC.

### Phase 9 – Temps Réel (Channels) (4–6 j)
- Channels: config Redis, routage, Consumers pour `tasks` (changements d’état, nouveaux commentaires) et `notifications`.
- Auth WS: session cookie; groupes par `project_id`/`client_id`.
- Front: hook WebSocket, subscriptions par page (projet/tâches), mise à jour optimiste.
- Critères: updates en push fiables, reconnection, backoff.

### Phase 10 – Rappels & Tâches Planifiées (Celery Beat) (2–4 j)
- Jobs: rappels échéances jalons/tâches, relances factures (pré-due, due, overdue), nettoyage URLs signées expirées.
- Paramétrage dans Django Admin (périodicité), templates email, SLA.
- Critères: planifications visibles dans Admin, logs Celery OK.

### Phase 11 – Paramètres, Tickets & Divers (3–5 j)
- Tickets support: `Ticket(client, project, subject, status, priority)` + commentaires.
- Paramètres utilisateur: profil, préférences notifications.
- Admin: écrans additionnels utiles (lectures seule, filtres, actions).
- Critères: flux support minimal opérationnel.

### Phase 12 – Observabilité & Sécurité (2–4 j)
- Sentry (Django + Next), PostHog (Next). Structured logging (request id), métriques basiques.
- Sécurité: `SECURE_*`, HSTS, CSP (option `django-csp`), rate-limit (`django-ratelimit`) sur endpoints sensibles, headers HTTP.
- Backups: snapshots DB, politique de rétention S3, rotation clés.
- Critères: erreurs capturées, alertes basiques actives.

### Phase 13 – CI/CD & Déploiement (3–5 j)
- CI GitHub Actions:
  - Backend: lint + tests + build image Docker
  - Frontend: lint + tests + build
  - Publish images (GHCR/ECR), cache
- CD: staging automatique sur branche `develop`, prod sur `main` (review step). Migrations auto avec verrou.
- Infra prod minimaliste: 2 VM (front + back) ou reverse proxy unique, TLS, serveurs supervisés; ou PaaS (Railway/Render/Fly) si souhaité.
- Critères: déploiement 1-commande vers staging, rollback rapide.

### Phase 14 – QA, E2E & Go-Live (3–5 j)
- Tests: `pytest` couverture >80% back critique; e2e Playwright scénarios clés (login, voir projet, créer tâche, uploader document, payer facture démo).
- Performance basique: pages <2s TTFB sur réseau normal; WS stable.
- Runbooks: paiements, webhook, incident response, rotation secrets.
- Go-live checklist (voir §10).

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

## 12. Planning indicatif (MVP ~6–8 semaines)

- S1: Phases 0–2 (bootstrap front/back)
- S2: Phases 3–4 (clients, projets, jalons)
- S3: Phase 5 (tâches/kanban/comments)
- S4: Phases 6–7 (documents S3, PDF)
- S5: Phase 8 (paiements CinetPay)
- S6: Phases 9–10 (temps réel, tâches planifiées)
- S7: Phases 12–14 (observabilité, CI/CD, QA, go-live)

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

