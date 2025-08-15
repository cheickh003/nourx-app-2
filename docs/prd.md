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
**Sécurité** par** ****sessions Django + CSRF** ,** ****permissions DRF** (scoping par `client_id`),** ****Stockage** privé via S3 (URLs signées),** ****paiements** via CinetPay (checkout + webhook sécurisé** ****HMAC x-token** +** ** **/payment/check** ). ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))

**Design :** sobre, noir/blanc, micro-accents couleurs (états/rôles), composants** ****shadcn/ui** (copie de code sous contrôle projet, pas une lib à importer),** ****Tailwind** pour la grille & tokens. ([ui.shadcn.com](https://ui.shadcn.com/docs?utm_source=chatgpt.com "Introduction - Shadcn UI"),** **[v3.tailwindcss.com](https://v3.tailwindcss.com/docs/guides/nextjs?utm_source=chatgpt.com "Install Tailwind CSS with Next.js"))

---

## 2) Périmètre MVP (fonctionnel) - Deux Dashboards Distincts

### A) Dashboard Client (Portail Client Authentifié)

**Public cible :** Clients de NOURX souhaitant suivre leurs projets, factures et collaborer sur leurs dossiers.

**Fonctionnalités principales :**

1. **Dashboard Vue d'ensemble** : 
   - Résumé des projets en cours du client
   - Progression globale, prochaines échéances importantes
   - Tâches ouvertes assignées au client
   - Derniers documents partagés
   - Factures en attente de paiement avec CTA "Payer"
   - Notifications récentes (mises à jour projets, nouvelles tâches)

2. **Mes Projets** : 
   - Liste des projets du client (actifs et archivés)
   - Détail par projet : description, KPIs, équipe NOURX, jalons & livrables
   - Feuille de route (timeline) avec jalons, versions, statuts
   - Commentaires et échanges sur les jalons

3. **Mes Tâches** : 
   - Vue kanban/liste des tâches assignées au client
   - Commentaires, pièces jointes, checklists
   - Statuts et priorités (lecture seule côté assignation)

4. **Mes Factures & Devis** : 
   - Consultation des devis et factures du client
   - **Paiement en ligne CinetPay** (Mobile Money, cartes, wallets)
   - Historique des paiements et reçus
   - Export PDF des documents de facturation
   - Alertes de factures dues

5. **Documents de Projet** : 
   - Accès aux documents partagés par NOURX
   - Téléchargement sécurisé (S3 + URLs signées)
   - Upload de documents clients si autorisé par projet
   - Prévisualisation des fichiers compatibles

6. **Support & Réclamations** : 
   - Création de tickets de support liés à un projet
   - Suivi du statut des réclamations
   - Historique des échanges avec NOURX

7. **Mon Profil** : 
   - Informations du contact principal
   - Préférences de notification
   - Moyens de contact préférés

### B) Dashboard Admin NOURX (Back-office Complet)

**Public cible :** Vous (Admin NOURX) pour piloter l'ensemble de l'activité et gérer tous les aspects business.

**Fonctionnalités principales :**

1. **Dashboard Business** : 
   - **KPIs Projets** : projets actifs, en pause, terminés, taux de progression
   - **Pipeline Prospects** : leads, devis envoyés, taux de conversion
   - **Alertes Opérationnelles** : tâches en retard, jalons à risque, SLA dépassés
   - **Finance** : factures dues/overdue, paiements en anomalie, CA mensuel
   - **Support** : tickets ouverts, délai moyen de résolution
   - **Activité Temps Réel** : dernières connexions clients, actions récentes

2. **Gestion Clients & Prospects** : 
   - **Clients** : CRUD complet, historique projets, santé compte
   - **Prospects** : pipeline commercial, qualification leads, suivi relances
   - **Contacts** : gestion des interlocuteurs par société
   - **Segmentation** : catégories clients, tags, notes internes

3. **Pilotage Projets** : 
   - Vue générale tous projets (kanban par statut)
   - Création/modification projets, assignation équipes
   - Planification jalons, roadmaps détaillées
   - Suivi budgets vs. réalisé
   - Rapports d'avancement automatisés

4. **Gestion Tâches & Workload** : 
   - Vue globale toutes tâches (tous projets)
   - Assignation, priorisation, planification
   - Suivi workload équipe NOURX
   - Alertes retards et goulots d'étranglement

5. **Facturation & Paiements** : 
   - **Devis** : création, personnalisation, envoi, suivi acceptation
   - **Factures** : génération, relances automatiques, export comptable
   - **Paiements** : journal des tentatives, rapprochement via webhook
   - **Analyse financière** : DSO, taux de paiement en ligne, revenus récurrents
   - Intégration CinetPay : monitoring transactions, anomalies, remboursements

6. **Gestion Documentaire** : 
   - Bibliothèque centralisée tous documents
   - Gestion des accès clients par projet
   - Templates et modèles réutilisables
   - Versioning et historique des modifications

7. **Support & Relation Client** : 
   - Gestion centralisée tous tickets clients
   - Attribution, escalade, SLA
   - Base de connaissance interne
   - Historique complet des interactions

8. **Configuration & Paramètres** : 
   - **Branding** : logos, couleurs, templates emails
   - **Paiements** : configuration CinetPay, moyens de paiement
   - **Notifications** : règles d'alertes, modèles emails/SMS
   - **SLA** : définition des engagements par type de service
   - **Utilisateurs** : gestion comptes équipe (future extension)

**Hors périmètre MVP** : multi-équipes internes, portail multi-entreprises, relances automatiques multicanal, e-sign avancée.

---

## 3) Personas & parcours clés par Dashboard

### A) Parcours Client (Dashboard Client)

**Persona :** **Responsable projet côté client** (acheteur, décideur, ou chef de projet interne)

**Parcours types :**

1. **Suivi de projet quotidien** :
   - Connexion → Dashboard → consultation progression projets
   - Vérification des tâches assignées et commentaires NOURX
   - Consultation des nouveaux documents partagés
   - Réponse aux commentaires sur jalons

2. **Gestion financière** :
   - Réception notification facture → Connexion → Section "Mes Factures"
   - Consultation détail facture → **Paiement CinetPay** (Mobile Money, carte)
   - Téléchargement reçu/facture PDF
   - Suivi historique paiements

3. **Collaboration projet** :
   - Upload documents demandés par NOURX
   - Validation/commentaires sur livrables
   - Signalement problème → Création ticket support

4. **Communication & support** :
   - Ouverture ticket réclamation lié à un projet
   - Suivi résolution avec échanges NOURX
   - Mise à jour profil et préférences contact

**Flow Paiement Client** : 
Facture due → Email notification → Connexion Dashboard → "Mes Factures" → Détail facture → Bouton "Payer" → **Checkout CinetPay** (SDK ou redirection iOS) → Paiement Mobile Money/Carte → Retour Dashboard → **Webhook HMAC** + **/payment/check** → Facture marquée "Payée" + Notification client

### B) Parcours Admin NOURX (Dashboard Admin)

**Persona :** **Vous (Dirigeant NOURX)** - vision complète business et opérationnelle

**Parcours types :**

1. **Pilotage quotidien** :
   - Connexion → Dashboard Business → KPIs projets, finances, support
   - Identification alertes (retards, factures overdue, tickets urgents)
   - Priorisation actions de la journée

2. **Gestion commerciale** :
   - Pipeline prospects → Qualification leads
   - Création devis → Envoi client → Suivi acceptation
   - Conversion prospect → client → Création projet

3. **Suivi projets opérationnel** :
   - Vue kanban tous projets → Identification goulots
   - Planification jalons/tâches → Assignation équipe
   - Contrôle budget vs. réalisé → Ajustements

4. **Gestion financière** :
   - Génération factures → Envoi automatique
   - Monitoring paiements CinetPay → Résolution anomalies
   - Relances clients → Analyse DSO

5. **Support & relation client** :
   - Attribution tickets → Résolution → Clôture
   - Analyse satisfaction → Actions correctives
   - Mise à jour base connaissance

**Flow Paiement Admin** :
Facture émise → Envoi client → Monitoring Dashboard → **Webhook CinetPay** (x-token HMAC) → Vérification **/payment/check** → Rapprochement automatique → Notification interne → Mise à jour tableau de bord financier

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

## 9) Structure des pages & éléments clés - Deux Applications Distinctes

### A) Application Client (`app.nourx.com` ou `/client/`)

**Thème :** Interface épurée, focus sur l'essentiel client, navigation simplifiée

**Pages principales :**

* **`/`** (Dashboard) : 
  - Vue d'ensemble projets en cours
  - Widget factures dues avec CTA "Payer"
  - Dernières tâches et notifications
  - Accès rapide aux sections importantes

* **`/projets`** : 
  - Liste projets actifs/archivés
  - **`/projets/{id}`** : détail projet (description, jalons, équipe NOURX, documents)
  - **`/projets/{id}/roadmap`** : feuille de route (timeline interactive + filtres)

* **`/taches`** : 
  - Vue kanban/liste des tâches assignées au client
  - Filtres par projet/statut/priorité
  - Modal détail tâche avec commentaires

* **`/factures`** : 
  - Liste devis et factures du client
  - **`/factures/{id}`** : détail avec paiement CinetPay intégré
  - Historique paiements et reçus
  - Export PDF

* **`/documents`** : 
  - Arborescence par projet
  - Upload/download sécurisé (S3 + URLs signées)
  - Prévisualisation fichiers

* **`/support`** : 
  - **`/support/tickets`** : mes réclamations
  - **`/support/nouveau`** : création ticket
  - **`/support/{id}`** : détail/échanges ticket

* **`/profil`** : 
  - Informations personnelles
  - Préférences notifications
  - Moyens de contact
  - Politique confidentialité

### B) Application Admin NOURX (`admin.nourx.com` ou `/admin/`)

**Thème :** Interface dense, tableaux de bord détaillés, outils de pilotage avancés

**Pages principales :**

* **`/`** (Dashboard Business) : 
  - KPIs temps réel (projets, finance, support)
  - Alertes opérationnelles prioritaires
  - Activité récente clients
  - Raccourcis actions fréquentes

* **`/commercial`** :
  - **`/commercial/prospects`** : pipeline, qualification, relances
  - **`/commercial/clients`** : CRUD complet, historique, segmentation
  - **`/commercial/devis`** : création, suivi, conversion

* **`/projets`** :
  - **`/projets/kanban`** : vue générale tous projets par statut
  - **`/projets/{id}`** : pilotage détaillé (budget, planning, équipe)
  - **`/projets/{id}/taches`** : gestion fine tâches projet
  - **`/projets/reporting`** : tableaux de bord et analyses

* **`/taches`** :
  - Vue globale toutes tâches (tous projets)
  - Gestion workload équipe
  - Planification et priorisation
  - Alertes retards

* **`/facturation`** :
  - **`/facturation/factures`** : génération, envoi, relances
  - **`/facturation/paiements`** : monitoring CinetPay, anomalies
  - **`/facturation/analytics`** : DSO, taux paiement, revenus

* **`/documents`** :
  - Bibliothèque centralisée
  - Gestion accès par client/projet
  - Templates et modèles

* **`/support`** :
  - **`/support/tickets`** : gestion centralisée tous tickets
  - **`/support/sla`** : monitoring engagements
  - **`/support/base-connaissance`** : articles internes

* **`/parametres`** :
  - **`/parametres/systeme`** : branding, configuration générale
  - **`/parametres/paiements`** : CinetPay, moyens de paiement
  - **`/parametres/notifications`** : rules engine emails/SMS
  - **`/parametres/equipe`** : gestion utilisateurs (future extension)

---

## 10) API serveur (Django) – exemples

* `POST /api/invoices/:id/pay` → init CinetPay (SDK ou lien), crée** **`payment_attempt`.
* `POST /api/payments/webhook` (Django/DRF) → lire `request.body` brut, vérifier header** **`x-token` (HMAC), comparer montant/devise/référence, puis appeler** **`/v2/payment/check`** pour décider `paid|failed|pending`.

---

## 11) Analytics, logs & monitoring

* **Sentry** : erreurs front (RSC/Client) et back (Django). ([docs.sentry.io](https://docs.sentry.io/platforms/javascript/guides/nextjs/?utm_source=chatgpt.com "Sentry for Next.js"))
* **PostHog** : parcours, événements (paiement tenté, payé, upload doc),** ****replay** sessions. ([posthog.com](https://posthog.com/docs/libraries/next-js?utm_source=chatgpt.com "Next.js - Docs"))

---

## 12) KPIs & succès

* Taux de connexion client mensuel.
* % tâches/jalons à l’heure.
* **Taux de paiement en ligne** &** ** **délai moyen d’encaissement** .
* NPS post-projet, délai moyen de résolution des réclamations.

---

## 13) Sécurité & conformité

* **Permissions DRF + scoping** par `client_id` sur tous les objets (clients, projets, tâches, documents, factures, tickets).
* **Stockage S3 privé** + **URLs signées** temporaires (lecture), presigned POST (upload direct) avec vérifications serveur (taille/MIME).
* **Webhook** : IP allowlist si possible, vérif** **`x-token` + recheck API. ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/hmac "CinetPay X-TOKEN HMAC | CinetPay-Documentation"))
* **CSP & CSRF** : origins autorisées, cookies `Secure`, HSTS, `SameSite` adapté.

---

## 14) Plan de livraison MVP - Focus Deux Dashboards (8 semaines)

### Phase 1 - Fondations (Semaines 1-2)
**Livrables :**
- Setup projet Django/DRF + Next.js (Django/DRF/S3 only stack)
- Configuration S3 (django-storages) + PostgreSQL + Redis
- **Squelettes des deux interfaces distinctes :**
  - Dashboard Client : layout épuré, navigation simple
  - Dashboard Admin : layout dense, sidebar étendue
- Authentification sessions Django + CSRF + Next.js
- Déploiement environnements (dev/staging)

### Phase 2 - Core Client Dashboard (Semaines 3-4)
**Focus : MVP du portail client opérationnel**
- Auth client + profil de base
- Dashboard client : vue d'ensemble projets
- Section "Mes Projets" : liste, détail, roadmap basique
- Section "Mes Tâches" : kanban simplifié
- Permissions DRF : scope strict par client_id
- Tests d'acceptation parcours client

### Phase 3 - Documents & Finance Client (Semaine 5)
**Focus : Fonctionnalités critiques client**
- Système documentaire S3 : upload/download sécurisé
- Section "Mes Factures" : consultation, historique
- Génération PDF factures (WeasyPrint)
- Intégration CinetPay : initialisation paiement
- Interface paiement côté client

### Phase 4 - Paiements & Robustesse (Semaine 6)
**Focus : Sécurisation paiements CinetPay**
- Webhook CinetPay : vérification HMAC x-token
- Re-check `/v2/payment/check` obligatoire
- Journal paiements et réconciliation
- Tests paiements (mocks + réel staging)
- Monitoring erreurs/anomalies

### Phase 5 - Dashboard Admin Core (Semaine 7)
**Focus : Pilotage business pour vous**
- Dashboard Admin : KPIs projets, finances, alertes
- Gestion clients/prospects : CRUD complet
- Pilotage projets : vue kanban globale
- Facturation admin : génération, envoi, suivi
- Gestion tâches : assignation, priorisation

### Phase 6 - Admin Avancé & Support (Semaine 8)
**Focus : Outils de gestion avancés**
- Support : tickets, SLA, résolution
- Configuration système : branding, paramètres
- Notifications automatiques (Celery + Beat)
- Documentation admin et formation
- Tests d'acceptation parcours admin

### Phase 7 - Finition & Go-Live (Semaine 9)
**Focus : Production ready**
- Observabilité : Sentry (Django + Next.js), PostHog
- Sécurité : durcissement, HSTS, rate-limiting
- Performance : optimisation requêtes, cache
- UAT complète : clients test + parcours admin
- Documentation utilisateur et runbooks

**Priorité absolue :** Dashboard Client opérationnel (Phases 1-4) avant Dashboard Admin, car c'est l'interface quotidienne de vos clients.

---

## 15) Environnement & variables

* `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME` (S3 via django-storages; en dev, `AWS_S3_ENDPOINT_URL` pour MinIO).
* `CINETPAY_APIKEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY` (HMAC), `CINETPAY_NOTIFY_URL`.
* `SENTRY_DSN`, `POSTHOG_KEY`, `POSTHOG_HOST`.

---

## 16) Tests & QA

* **Unitaires** : permissions DRF (scoping `client_id`), services paiement (mocks), parsing webhook (HMAC), CSRF.
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
> * **Next.js App Router** = BFF moderne (Server Components) et perfs solides. ([nextjs.org](https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware?utm_source=chatgpt.com "Getting Started: Route Handlers and Middleware"))
> * **Django/DRF** = maturité, sessions/CSRF, Admin natif, écosystème riche (Channels, Celery, storages S3).
> * **CinetPay** = passerelle locale adaptée CI (Mobile Money, cartes, **HMAC + check**). ([cinetpay.com](https://cinetpay.com/pricing?utm_source=chatgpt.com "Une tarification simple et équitable"))
> * **shadcn/ui + Tailwind** = design minimaliste, contrôle total du code UI. ([ui.shadcn.com](https://ui.shadcn.com/docs?utm_source=chatgpt.com "Introduction - Shadcn UI"))

---

## 19) Esquisse d’implémentation (extraits)

**Installation Tailwind + Next** (App Router) : suivre guide officiel. ([nextjs.org](https://nextjs.org/docs/app/getting-started/css?utm_source=chatgpt.com "Getting Started: CSS"))

**Auth (Sessions Django + CSRF)**

* Côté Next.js: toujours appeler l’API avec `credentials: 'include'` ; récupérer le cookie `csrftoken` (premier GET) puis envoyer `X-CSRFToken` sur POST/PUT/PATCH/DELETE.

**Webhook CinetPay (vue Django/DRF – pseudo-code)**

* `@api_view(['POST'])` sur `/api/payments/webhook/` :
  * Lire `request.body` brut + headers, reconstruire la chaîne, calculer `HMAC-SHA256(secret, data)` et comparer à `x-token`.
  * Si valide → appeler `/v2/payment/check` (`apikey`, `site_id`, `transaction_id`) → mettre à jour facture/paiement (idempotent).

**Stockage S3**

* Upload direct via presigned POST généré par Django (policy + signature). Lecture via URL signée avec expiration. Filtrer MIME/taille, antivirus optionnel (ClamAV) en tâche Celery.

---

## 20) Risques & mitigations

* **iOS / cookies en pop-up** → privilégier** ****redirection** pour checkout (SDK Seamless peut rediriger sur iOS). ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/initialisation?utm_source=chatgpt.com "Initiating a payment | CinetPay-Documentation"))
* **Notifications opérateurs en deux temps** (ex.** ** *WAITING_FOR_CUSTOMER* ) →** ****ne jamais** conclure sans** ** **/payment/check** . ([CinetPay Documentation](https://docs.cinetpay.com/api/1.0-en/checkout/notification?utm_source=chatgpt.com "Prepare a notification page | CinetPay-Documentation"))
* **Mauvaises permissions API** → tests DRF systématiques (scoping `client_id`), revues de sécurité, checklists déploiement.

---

### Conclusion - Version Django/DRF/S3 Only avec Deux Dashboards

Cette spécification détaille une **architecture Django/DRF/S3 only** moderne avec **deux dashboards distincts et complémentaires** :

1. **Dashboard Client** : Interface épurée pour le suivi projet, paiements CinetPay et collaboration
2. **Dashboard Admin NOURX** : Back-office complet pour le pilotage business, gestion clients/prospects et configuration

**Stack technique confirmée :**
- **Backend** : Django 5 + DRF (sessions/CSRF) + PostgreSQL + Redis + S3 (django-storages)
- **Frontend** : Next.js (App Router) + Tailwind CSS + shadcn/ui
- **Paiements** : CinetPay (webhook HMAC + /payment/check)
- **Temps réel** : Django Channels (optionnel)
- **Jobs** : Celery + Beat

**Avantages de cette approche :**
- **Séparation claire** des responsabilités et interfaces utilisateur
- **Sécurité robuste** avec permissions DRF scopées par client
- **Scalabilité** : chaque dashboard peut évoluer indépendamment
- **UX optimisée** : interfaces adaptées à chaque type d'utilisateur
- **Maintenance simplifiée** : stack cohérente Django/DRF/S3 only

Le planning priorise le **Dashboard Client** (semaines 1-6) puis le **Dashboard Admin** (semaines 7-9) pour maximiser la valeur client rapidement.

**Prêt à développer** : Cette spécification contient tous les éléments techniques, fonctionnels et de sécurité nécessaires pour commencer le développement immédiatement.
