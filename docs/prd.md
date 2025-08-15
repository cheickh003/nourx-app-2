# PRD – Espace Client NOURX (Portail Projet & Facturation)

**Date :** 11 août 2025
**Version :** v1.0 (Spécification complète – MVP prêt à développer)
**Propriétaire produit :** Cheickh Keita (NOURX)
**Stack cible :**
- **Frontend :** **Next.js (App Router)** + **Tailwind CSS** + **shadcn/ui**
- **Backend :** **Django 5** + **Django REST Framework (DRF)**
- **Auth :** Sessions Django + CSRF (optionnel **django-allauth** pour OAuth)
- **Admin :** Back-office via **Django Admin**
- **Temps réel (option) :** **Django Channels** (ASGI) + Redis
- **Tâches :** **Celery** + **django-celery-beat** (rappels SLA, emails, génération PDF)
- **Base de données :** **PostgreSQL**
- **Stockage documents :** **django-storages** + **S3** (URL signées / presigned POST)
- **Paiements :** **CinetPay** (init, webhook HMAC `x-token`, `/v2/payment/check`)
- **Sécurité :** **SecurityMiddleware** (HSTS, nosniff, referrer policy, etc.)

---

## 1) Vision & objectifs

Créer un** ****portail client moderne, minimaliste (90% noir & blanc)** permettant aux clients NOURX de** ** **suivre l’avancement de leurs projets, collaborer sur les tâches/feuilles de route, consulter & payer devis/factures** , déposer des documents, ouvrir des réclamations, et gérer leurs paramètres.
Côté interne, un** ****dash admin (vous seul)** pour piloter** ****projets, clients, prospects, tâches, réclamations, devis & factures** et la configuration.
**Sécurité** par** ****Supabase Auth + RLS** (Row Level Security),** ****Stockage** via Supabase Storage (signés/privés),** ****paiements**via CinetPay (checkout + webhook sécurisé** ****HMAC x-token** +** ** **/payment/check** ). ([Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs?utm_source=chatgpt.com "Setting up Server-Side Auth for Next.js"),** **[CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))

**Design :** sobre, noir/blanc, micro-accents couleurs (états/rôles), composants** ****shadcn/ui** (copie de code sous contrôle projet, pas une lib à importer),** ****Tailwind** pour la grille & tokens. ([ui.shadcn.com](https://ui.shadcn.com/docs?utm_source=chatgpt.com "Introduction - Shadcn UI"),** **[v3.tailwindcss.com](https://v3.tailwindcss.com/docs/guides/nextjs?utm_source=chatgpt.com "Install Tailwind CSS with Next.js"))

---

## 2) Périmètre MVP (fonctionnel)

### Côté Client (espace authentifié)

1. **Dashboard** : résumé du projet courant (progression, prochaines échéances, tâches ouvertes, derniers docs, facture due).
2. **Aperçu du projet** : description, KPIs, équipe NOURX visible, jalons & livrables.
3. **Feuille de route (Roadmap)** : jalons (timeline), versions, états; commentaires.
4. **Tâches** : liste/kanban, assignation (côté NOURX), pièces jointes, commentaires, checklists.
5. **Factures & Devis** : consultation,** ****paiement en ligne CinetPay** (Mobile Money, cartes, wallets), suivi des statuts, export PDF. ([cinetpay.com](https://cinetpay.com/pricing?utm_source=chatgpt.com "Une tarification simple et équitable"))
6. **Documents** : chargement/téléchargement sécurisé (Storage privé + URL signée), prévisualisation. ([Supabase](https://supabase.com/docs/guides/storage/security/access-control?utm_source=chatgpt.com "Storage Access Control | Supabase Docs"))
7. **Réclamations** : création de ticket, statut, échanges.
8. **Paramètres** : profil, préférences notification, moyens de contact.

### Côté Admin (vous seul)

* **Projets** ,** ** **Clients** ,** ** **Prospects** ,** ** **Tâches** ,** ** **Réclamations** ,** ** **Devis & Factures** ,** ****Paramètres** (branding, moyens de paiement, modèles d’email, SLA).
* **Paiements** : journal des tentatives, rapprochement automatique via webhook +** ** **/v2/payment/check** . ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/notification?utm_source=chatgpt.com "Prepare a notification page | CinetPay-Documentation"))

**Hors périmètre MVP** : multi-équipes internes, portail multi-entreprises, relances automatiques multicanal, e-sign avancée.

---

## 3) Personas & parcours clés

* **Client** (acheteur / décideur) : se connecte, consulte l’état d’avancement, téléverse des documents,** ****paye une facture** en XOF via Mobile Money/carte, ouvre une réclamation si besoin. ([cinetpay.com](https://cinetpay.com/pricing?utm_source=chatgpt.com "Une tarification simple et équitable"))
* **Admin NOURX** : crée un projet, jalons & tâches, émet devis/factures, surveille paiements (webhook + check API), répond aux tickets.

**Flow Paiement** : Client → bouton « Payer » sur une facture → ouverture** ****checkout CinetPay** (SDK ou redirection recommandée iOS) → retour →** ****webhook (x-token HMAC)** valide la notif →** ****/payment/check** confirme définitivement → facture marquée « payée ». ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/initialisation?utm_source=chatgpt.com "Initiating a payment | CinetPay-Documentation"))

---

## 4) Architecture technique (Next.js + Django)

- **Frontend** : Next.js App Router (RSC), Tailwind, shadcn/ui pour les composants. Les appels API se font côté serveur (RSC) ou client avec `credentials: 'include'` pour véhiculer les cookies de session.
- **Backend** : Django 5 + DRF expose des APIs REST sécurisées par sessions/CSRF. Django Admin couvre le back-office (vous seul).
- **Auth** : `django.contrib.auth` (sessions + CSRF). Optionnel `django-allauth` si you want OAuth (Google, GitHub…). Côté Next.js, récupérer le cookie `csrftoken` puis envoyer l’en-tête `X-CSRFToken` pour les mutations.
- **Temps réel (option)** : Django Channels + Redis (channel layer) pour pousser mises à jour (kanban, commentaires). Protocole WebSocket, fallback SSE si besoin.
- **Tâches asynchrones** : Celery + django-celery-beat pour rappels SLA, envois d’emails, génération PDF, vérification différée des paiements.
- **Base de données** : PostgreSQL (psycopg). Modélisation via modèles Django (liste au §5).
- **Stockage** : django-storages + S3. Téléversement direct possible via presigned POST émis par Django, lecture via URLs signées. MiniO en local.
- **Paiements** : CinetPay – endpoint d’init côté Django, webhook avec vérification HMAC `x-token`, re-check `/v2/payment/check` avant de marquer « payée ».
- **Sécurité** : `SecurityMiddleware` (HSTS, `X-Content-Type-Options`, `Referrer-Policy`), `django-cors-headers` pour `CORS_ALLOWED_ORIGINS` (Next) et `CSRF_TRUSTED_ORIGINS`.
- **Observabilité** : Sentry (Django + Next.js) et PostHog (analytics produit).

**Endpoints Django (exemples)**

- `POST /api/auth/login/` (session), `POST /api/auth/logout/`.
- `GET /api/projects/`, `GET /api/projects/{id}/`, `POST /api/tasks/…`.
- `POST /api/payments/init/` (CinetPay init), `POST /api/payments/webhook/`, `GET /api/payments/{id}/status/`.

**Interop Next.js ↔ Django**

- Dev: proxy Next.js (`/api/*`) vers Django pour cookies same-site et éviter CORS en local.
- Prod: même domaine et sous-chemins (ex. `app.nourx.com` pour Next, `api.nourx.com` pour Django) avec cookies `Secure` et `SameSite=Lax` ou `None` selon le besoin cross-site.

---

## 5) Modèle de données (Django / Postgres)

**Tables principales (extrait)**

* `profiles` (id =** **`auth.users.id`, nom, tel, role:** **`admin|client`)
* `clients` (id, raison_sociale, contact_principal, …)
* `projects` (id, client_id, titre, statut, progression, …)
* `milestones` (id, project_id, titre, due_date, status)
* `tasks` (id, project_id, titre, status, priority, assigned_to (nullable), …)
* `task_comments` (id, task_id, author_id, body, created_at)
* `documents` (id, project_id, bucket, path, label, visibility) →** ****Storage**
* `quotes` (id, client_id, project_id, total_ht, currency, status, pdf_url)
* `invoices` (id, client_id, project_id, total_ttc, currency, due_date, status: draft|sent|paid|overdue|canceled, external_ref)
* `invoice_items` (id, invoice_id, label, qty, unit_price)
* `payments` (id, invoice_id, amount, method, status, cinetpay_trans_id, raw_payload_json)
* `payment_attempts` (id, invoice_id, transaction_id, status, channel, created_at)
* `tickets` (id, client_id, project_id, subject, status, priority)
* `audit_logs` (id, actor_id, action, entity, entity_id, diff_json)

**Permissions & visibilité**

- Les objets sont scopés par `client_id` via des ForeignKey et des permissions DRF (IsAuthenticated + custom `IsClientObjectOwner`).
- L’admin (superuser) voit tout via Django Admin et des vues DRF protégées par `IsAdminUser`.

**Stockage (S3)**

- Bucket privé `project-files`. Téléversement via presigned POST émis par Django. Lecture via URL signée (durée limitée). Les métadonnées (bucket, key, visibility) sont stockées dans `documents`.

---

## 6) Authentification & Sécurité

- **Auth** : Sessions Django (`django.contrib.auth`). Login/logout exposés en API (DRF) ou via `dj-rest-auth`. Côté Next.js, toujours envoyer `credentials: 'include'`.
- **CSRF** : `CSRF_TRUSTED_ORIGINS` (domaines du front), cookie `csrftoken` et en-tête `X-CSRFToken` sur les mutations. En dev, activer un proxy Next→Django pour simplifier.
- **CORS** : `django-cors-headers` avec `CORS_ALLOWED_ORIGINS` pour le domaine Next.js si nécessaire.
- **SecurityMiddleware** : HSTS (`SECURE_HSTS_SECONDS`), `SECURE_SSL_REDIRECT=True`, `X-Content-Type-Options=nosniff`, `Referrer-Policy=strict-origin-when-cross-origin`.
- **Webhooks CinetPay** : vérifier HMAC `x-token`, comparer montant/devise/statut, puis re-vérifier via `/v2/payment/check`. Journaliser l’événement brut dans `payment_attempts`.

---

## 7) Paiements CinetPay – Détails d’intégration

**Méthodes** : Mobile Money (Orange Money CI, MTN Money CI, Moov Money CI,** ** **Wave** ),** ** **Visa/Mastercard** , etc. (couverture CI et +10 pays francophones). ([cinetpay.com](https://cinetpay.com/pricing?utm_source=chatgpt.com "Une tarification simple et équitable"),** **[CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/tableau?utm_source=chatgpt.com "Code table"))

**Deux modes d’init** :

* **Redirection (recommandée iOS)** : on génère un** ****payment link** via l’API d’initialisation, puis on redirige. ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/initialisation?utm_source=chatgpt.com "Initiating a payment | CinetPay-Documentation"))
* **SDK Seamless (JS)** : intégration embarquée (à préférer sur desktop/android). ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/sdk/js?utm_source=chatgpt.com "CinetPay SDK-SEAMLESS integration"))

**Webhook sécurisé** :

1. CinetPay POST votre** **`notify_url` avec champs (`cpm_site_id`,** **`cpm_trans_id`,** **`cpm_amount`,** **`cpm_currency`,** **`signature`, …) + header** ** **`x-token`** .
2. Vous** ****recomposez la chaîne** (`site_id + trans_id + ... + cpm_error_message`) et calculez** ****HMAC-SHA256**avec** ****Secret Key** ; comparez à** **`x-token`.
3. **Toujours appeler** `POST https://api-checkout.cinetpay.com/v2/payment/check` avec** **`apikey`,** **`site_id`,** **`transaction_id` pour** ****statut final** (gère cas** ***WAITING_FOR_CUSTOMER* et confirmations différées). ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))

---

## 8) UX / UI & Design system

* **Palette** : fond blanc, texte noir, accent unique (ex. bleu NOURX) pour états/interactions,** ****dark mode** facultatif (inversion).
* **Composants** :** ****shadcn/ui** (tables, cards, badges, sheets, dialogs, charts) –** ****copier dans le repo** via CLI pour ownership total. ([ui.shadcn.com](https://ui.shadcn.com/docs?utm_source=chatgpt.com "Introduction - Shadcn UI"))
* **Guides Next.js + Tailwind** (App Router + Tailwind v3/4). ([nextjs.org](https://nextjs.org/docs/app/getting-started/css?utm_source=chatgpt.com "Getting Started: CSS"))

---

## 9) Structure des pages & éléments clés

### Espace Client

* **/dashboard** : résumé projet, échéances, facture due (CTA Pay).
* **/projet** (overview) : description, jalons, équipe NOURX.
* **/feuille-de-route** : timeline + filtres par statut.
* **/taches** : kanban/liste, recherche, commentaire en ligne.
* **/factures-devis** : liste, détail, paiements, reçus, PDF.
* **/documents** : dossier par projet, upload (drag’n’drop), liens signés.
* **/reclamations** : création/suivi ticket.
* **/parametres** : profil, notifications, RGPD.

### Admin (privé)

* **/admin/projets** ,** ** **/admin/clients** ,** ** **/admin/prospects** ,** ** **/admin/taches** ,** ** **/admin/reclamations** ,** ** **/admin/factures-devis** ,** ** **/admin/parametres** .

---

## 10) API interne (Route Handlers) – exemples

* `POST /api/invoices/:id/pay` → init CinetPay (SDK ou lien), crée** **`payment_attempt`.
* `POST /api/webhooks/cinetpay` →** ** **désactivez body parser, lisez raw** , vérifiez** **`x-token` (HMAC),** ****puis** appelez** ****/payment/check** pour décider** **`paid|failed|pending`. ([nextjs.org](https://nextjs.org/docs/pages/building-your-application/routing/api-routes?utm_source=chatgpt.com "API Routes"),** **[CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/verification?utm_source=chatgpt.com "Checking a transaction"))

---

## 11) Analytics, logs & monitoring

* **Sentry** : erreurs front (RSC/Client) et back (Route Handlers). ([docs.sentry.io](https://docs.sentry.io/platforms/javascript/guides/nextjs/?utm_source=chatgpt.com "Sentry for Next.js"))
* **PostHog** : parcours, événements (paiement tenté, payé, upload doc),** ****replay** sessions. ([posthog.com](https://posthog.com/docs/libraries/next-js?utm_source=chatgpt.com "Next.js - Docs"))

---

## 12) KPIs & succès

* Taux de connexion client mensuel.
* % tâches/jalons à l’heure.
* **Taux de paiement en ligne** &** ** **délai moyen d’encaissement** .
* NPS post-projet, délai moyen de résolution des réclamations.

---

## 13) Sécurité & conformité

* **RLS** stricte sur toutes les entités clients.** ****Realtime** respecte les mêmes politiques. ([Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"))
* **Storage privé** +** ****signed URLs** temporaires. ([Supabase](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl?utm_source=chatgpt.com "JavaScript: Create a signed URL"))
* **Webhook** : IP allowlist si disponible côté infra, vérif** **`x-token` + recheck API. ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))
* **CSP** &** ****CSRF** : Server Actions & origins validés. ([nextjs.org](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions?utm_source=chatgpt.com "next.config.js: serverActions"))

---

## 14) Plan de livraison (MVP → v1.1)

**Semaine 1–2** : Setup (Next.js + Tailwind + shadcn), Auth Supabase SSR, structure BDD & RLS, modèles UI. ([Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs?utm_source=chatgpt.com "Setting up Server-Side Auth for Next.js"),** **[nextjs.org](https://nextjs.org/docs/app/getting-started/css?utm_source=chatgpt.com "Getting Started: CSS"))
**Semaine 3–4** : Projets, Roadmap, Tâches, Documents (Storage + policies). ([Supabase](https://supabase.com/docs/guides/storage/security/access-control?utm_source=chatgpt.com "Storage Access Control | Supabase Docs"))
**Semaine 5** : Devis/Factures, génération PDF.
**Semaine 6** : Intégration CinetPay (init + webhook + check), QA paiements. ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/initialisation?utm_source=chatgpt.com "Initiating a payment | CinetPay-Documentation"))
**Semaine 7** : Réclamations, notifications email.
**Semaine 8** : Durcissement sécurité, Sentry/PostHog, UAT & go-live. ([docs.sentry.io](https://docs.sentry.io/platforms/javascript/guides/nextjs/?utm_source=chatgpt.com "Sentry for Next.js"),** **[posthog.com](https://posthog.com/docs/libraries/next-js?utm_source=chatgpt.com "Next.js - Docs"))

---

## 15) Environnement & variables

* `NEXT_PUBLIC_SUPABASE_URL`,** **`NEXT_PUBLIC_SUPABASE_ANON_KEY` (client),** **`SUPABASE_SERVICE_ROLE_KEY`(serveur). ([Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs?utm_source=chatgpt.com "Setting up Server-Side Auth for Next.js"))
* `CINETPAY_APIKEY`,** **`CINETPAY_SITE_ID`,** **`CINETPAY_SECRET_KEY` (HMAC),** **`CINETPAY_NOTIFY_URL`. ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))
* `SENTRY_DSN`,** **`POSTHOG_KEY`,** **`POSTHOG_HOST`. ([docs.sentry.io](https://docs.sentry.io/platforms/javascript/guides/nextjs/?utm_source=chatgpt.com "Sentry for Next.js"),** **[posthog.com](https://posthog.com/docs/libraries/next-js?utm_source=chatgpt.com "Next.js - Docs"))

---

## 16) Tests & QA

* **Unitaires** : policies RLS (via tests SQL), services paiement (mocks), parsing webhook (HMAC).
* **Intégration** : scénarios complet « facture → payée ».
* **E2E** : Playwright (auth client, upload doc, pay, ticket).
* **Charge** : checks table** **`payments` & journaux.

---

## 17) Roadmap post-MVP

* **Rappels** automatiques d’échéance (emails/SMS)
* **Signature** de devis/factures (workflow)
* **Espace multi-projets & multi-sociétés**
* **Exports** comptables, intégrations (ex: ERP)

---

## 18) Alternatives de stack (si vous souhaitez comparer)

* **Appwrite** (Auth/DB/Functions/Storage, très bon en self-host) – proche de vos habitudes ; moins d’écosystème SQL natif que Supabase (Postgres + RLS). ([appwrite.io](https://appwrite.io/?utm_source=chatgpt.com "Appwrite - Build like a team of hundreds"))
* **Directus** (BaaS/Headless + back-office instantané, hooks, webhooks) – utile si vous voulez un back-office low-code prêt à l’emploi au lieu de coder tout l’admin. ([directus.io](https://directus.io/docs/getting-started/overview?utm_source=chatgpt.com "Overview | Directus Docs"))
* **Refine** (framework React pour** ****admin CRUD** très rapide à produire) – peut accélérer** ****l’admin NOURX** tout en gardant votre** ****frontend client** en Next.js. ([refine.dev](https://refine.dev/docs/?utm_source=chatgpt.com "Overview | Refine"))

> **Pourquoi je maintiens la stack proposée ?**
>
> * **Next.js App Router** = BFF cohérent (Server Actions/Route Handlers) et perfs modernes. ([nextjs.org](https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware?utm_source=chatgpt.com "Getting Started: Route Handlers and Middleware"))
> * **Supabase** = Auth + Postgres +** ****RLS** + Storage + Realtime bien intégrés (sécurité côté DB). ([Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"))
> * **CinetPay** = passerelle locale adaptée CI (Mobile Money, cartes,** ** **HMAC + check** ). ([cinetpay.com](https://cinetpay.com/pricing?utm_source=chatgpt.com "Une tarification simple et équitable"),** **[CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))
> * **shadcn/ui + Tailwind** = design minimaliste, contrôle total du code UI. ([ui.shadcn.com](https://ui.shadcn.com/docs?utm_source=chatgpt.com "Introduction - Shadcn UI"))

---

## 19) Esquisse d’implémentation (extraits)

**Installation Tailwind + Next** (App Router) : suivre guide officiel. ([nextjs.org](https://nextjs.org/docs/app/getting-started/css?utm_source=chatgpt.com "Getting Started: CSS"))

**Auth SSR**

* Créer** **`utils/supabase/client.ts` et** **`server.ts` avec** **`@supabase/ssr`, ajouter** **`middleware.ts` pour refresh de tokens. ([Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs?utm_source=chatgpt.com "Setting up Server-Side Auth for Next.js"))

**Webhook CinetPay (pseudo-code Route Handler)**

* `app/api/webhooks/cinetpay/route.ts` :
  * Lire headers + form data, reconstruire la chaîne,** **`hash_hmac('sha256', data, SECRET_KEY)` ; comparer à** **`x-token`.
  * Si valide →** **`fetch('/v2/payment/check', {apikey, site_id, transaction_id})` → maj facture. ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))

**Policies Storage**

* Activer RLS sur** **`storage.objects` et autoriser** **`select/insert` conditionnellement (appartenance au** **`project_id`).** ****Partager** via** **`createSignedUrl` (expire). ([Supabase](https://supabase.com/docs/guides/storage/security/access-control?utm_source=chatgpt.com "Storage Access Control | Supabase Docs"))

---

## 20) Risques & mitigations

* **iOS / cookies en pop-up** → privilégier** ****redirection** pour checkout (SDK Seamless peut rediriger sur iOS). ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/initialisation?utm_source=chatgpt.com "Initiating a payment | CinetPay-Documentation"))
* **Notifications opérateurs en deux temps** (ex.** ** *WAITING_FOR_CUSTOMER* ) →** ****ne jamais** conclure sans** ** **/payment/check** . ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/notification?utm_source=chatgpt.com "Prepare a notification page | CinetPay-Documentation"))
* **Mauvaise configuration RLS** → revue de sécurité + tests SQL automatisés. ([Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"))

---

### Conclusion

La stack** ****Next.js + Tailwind + shadcn/ui + Supabase + CinetPay** colle parfaitement à votre besoin :** ****rapidité de dev, contrôle UX, sécurité par RLS, paiement local fiable** (HMAC + check). On peut enrichir ensuite (relances, e-signature, intégrations). Si vous souhaitez accélérer encore** ** **l’admin** ,** ****Refine** est un excellent accélérateur sans remettre en cause le portail client. ([refine.dev](https://refine.dev/docs/?utm_source=chatgpt.com "Overview | Refine"))

Souhaitez-vous que je vous génère** ** **l’arborescence du projet** , les** ****migrations SQL Supabase** (tables + RLS) et un** ****squelette de Route Handlers** (webhook/paiement) pour démarrer immédiatement ?
