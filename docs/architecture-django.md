# Architecture – Next.js + Django (DRF/Channels/Celery)

Objectif: détailler la stack et les choix d’intégration entre un front Next.js (App Router) et un backend Django 5 + DRF, avec temps réel (Channels), tâches (Celery), stockage S3, PostgreSQL et paiements CinetPay.

## Stack et dépendances

- Python 3.11/3.12
- Django 5.x, djangorestframework (~3.14)
- channels (4.x), channels-redis
- celery (5.x), django-celery-beat
- psycopg (psycopg[binary] 3.x)
- django-storages, boto3
- django-cors-headers
- (option) django-allauth, dj-rest-auth
- sentry-sdk[django]

## Organisation

- `apps/core` (settings, urls, middleware)
- `apps/projects`, `apps/tasks`, `apps/billing`, `apps/documents`, `apps/support`
- `apps/payments` (intégration CinetPay)
- `apps/realtime` (consumers Channels)

## Settings clés (extrait)

- INSTALLED_APPS: `django.contrib.auth`, `rest_framework`, `corsheaders`, `storages`, `channels`, `django_celery_beat`, apps métier
- MIDDLEWARE: `SecurityMiddleware`, `SessionMiddleware`, `CsrfViewMiddleware`, `AuthenticationMiddleware`, `corsheaders.middleware.CorsMiddleware`
- REST_FRAMEWORK: `DEFAULT_AUTHENTICATION_CLASSES = ['rest_framework.authentication.SessionAuthentication']`, `DEFAULT_PERMISSION_CLASSES = ['rest_framework.permissions.IsAuthenticated']`
- CORS_ALLOWED_ORIGINS: `https://app.nourx.com` (dev: `http://localhost:3000`)
- CSRF_TRUSTED_ORIGINS: `https://app.nourx.com` (dev: `http://localhost:3000`)
- SESSION_COOKIE_SECURE=True, CSRF_COOKIE_SECURE=True, SESSION_COOKIE_SAMESITE='Lax'
- DATABASES: PostgreSQL (psycopg)
- CHANNEL_LAYERS: Redis (`channels_redis.core.RedisChannelLayer`)
- CELERY: broker Redis, backend Redis (ou RPC). Beat activé pour les planifications.
- STORAGES: S3 via `storages.backends.s3boto3.S3Boto3Storage` + variables AWS (`AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`, `AWS_S3_SIGNATURE_VERSION`)

## Auth et CSRF (Next.js ↔ Django)

- Login/logout via endpoints DRF (`/api/auth/login/`, `/api/auth/logout/`) ou dj-rest-auth.
- Côté Next.js, toujours appeler l’API avec `credentials: 'include'`.
- Obtenir le cookie `csrftoken` (premier GET) puis envoyer `X-CSRFToken` sur POST/PUT/PATCH/DELETE.
- En dev, configurer un proxy Next.js vers Django pour éviter les soucis CORS/CSRF.

## Endpoints API (exemples)

- `GET /api/projects/`, `GET /api/projects/{id}/`
- `GET /api/tasks/?project={id}`, `POST /api/tasks/`
- `GET /api/invoices/`, `GET /api/invoices/{id}/pdf` (génération PDF async)
- `POST /api/uploads/presign` (retourne presigned POST S3)
- `POST /api/payments/init/`, `POST /api/payments/webhook/`, `GET /api/payments/{id}/status/`

## Permissions

- DRF: `IsAuthenticated` par défaut.
- Permissions custom (ex. `IsClientObjectOwner`) filtrant par `client_id` sur chaque queryset.
- Admin: `IsAdminUser` et Django Admin pour la gestion complète.

## Temps réel (Channels)

- Channel layer: Redis.
- Consumers:
  - `projects`/`tasks`: updates push (création, changement d’état, nouveaux commentaires)
  - notifications personnelles (ex: facture due)
- Auth WS: via session cookie. Filtrer les events par appartenance au client/projet.

## Tâches (Celery + Beat)

- Rappels SLA (tâches en retard / jalons à venir)
- Envoi d’emails transactionnels (factures, tickets)
- Génération PDF (devis/factures) et upload S3
- Vérification périodique des paiements en attente (`/v2/payment/check`)

## Stockage S3

- Upload: presigned POST généré par Django (policy + signature), le front envoie le fichier directement à S3.
- Lecture: `get_presigned_url` pour délivrer un lien temporaire aux clients.
- Les métadonnées (bucket, key, taille, mimetype) sont enregistrées dans `documents`.

## Paiements CinetPay

- Init paiement: `POST /api/payments/init/` → crée une tentative et appelle l’API CinetPay pour obtenir un token/session (retourne l’URL/params au front).
- Webhook: `POST /api/payments/webhook/` avec header `x-token` (HMAC du payload). Étapes:
  1) Récupérer le corps brut et le header `x-token`.
  2) Recalculer le HMAC (clé secrète marchand) et comparer.
  3) Vérifier cohérence montant/devise/référence.
  4) Appeler `/v2/payment/check` côté serveur pour confirmer le statut.
  5) Marquer la facture comme « payée » et journaliser l’événement brut (`payment_attempts`).

## Déploiement & Dev local

- docker-compose (local): `web` (Django ASGI), `worker` (Celery), `beat`, `redis`, `postgres`, `minio` (S3 local). Next.js tourne en `localhost:3000` avec proxy vers Django (`localhost:8000`).
- Prod: domaine `app.nourx.com` (Next) et `api.nourx.com` (Django). Forcer HTTPS, cookies `Secure`, HSTS, clés S3/CinetPay en variables d’environnement.

## Observabilité

- Sentry: back (Django) + front (Next.js). PostHog pour analytics produit/replay.

