### 1. Analyse et Points Clés du PRD

#### Points Forts
* **Vision Claire et Mesurable** : Les objectifs à T+90 jours (taux d'adoption des tickets, temps de réponse) sont concrets et permettent de juger du succès du MVP.
* **Périmètre MVP bien défini** : Les fonctionnalités sont priorisées sur l'essentiel (relation client, facturation, support), repoussant les sujets complexes (webhooks, PSP) à une V2.
* **Exigences Non Fonctionnelles Robustes** : La prise en compte de la sécurité (OWASP, hachage), de la performance (TTFB) et de l'observabilité (logs JSON) dès le début est un gage de qualité.
* **Fondations Techniques Solides** : La stack (PostgreSQL, Node.js, Svelte) est moderne et performante. Le modèle de données et les exemples d'endpoints API fournissent une feuille de route claire pour les développeurs.
* **Parcours Critiques Identifiés** : La description des flux comme la création ou la désactivation d'un compte client montre une réflexion approfondie sur l'expérience utilisateur et les besoins de traçabilité.

#### Points de Vigilance
* **Ambition du MVP** : Le périmètre, bien que bien défini, reste très ambitieux pour une roadmap de 8 semaines. Une discipline de fer sera nécessaire pour ne pas dévier.
* **Worker pour les e-mails** : Le concept de `email_outbox` et d'un worker est une excellente pratique, mais il ajoute une complexité technique (gestion de file d'attente, tentatives, monitoring) qui ne doit pas être sous-estimée.
* **Expérience Utilisateur (UX/UI)** : Le PRD est très fonctionnel. Le succès dépendra aussi d'une interface (côté Admin et Client) intuitive et agréable à utiliser, ce qui nécessitera un effort de design non détaillé ici.

***

### 2. Découpage en Phases d'Implémentation (Sprints)

Mise à jour: Frontend prioritaire et exclusif avec Flowbite Svelte (composants Tailwind prêts à l’emploi). On garde SvelteKit côté app pour le routage et SSR. Palette UI: noir/blanc (neutres) sur Admin et Client.

Découpage en 6 sprints (1–2 semaines chacun), avec livrables vérifiables et composants Flowbite Svelte proposés pour accélérer.

#### Sprint 0 : Fondation Technique
Objectif: Environnement, base de données, API, frontend SvelteKit + Flowbite Svelte, CI minimale.
1)  **Infrastructure de Base**
    - `docker-compose.yml`: service `db` (PostgreSQL) uniquement, avec volume et healthcheck.
    - API et Web tournent en local (Node 20+, Vite). `.env` pour `DATABASE_URL`, `JWT_*`, `SMTP_*`, `CORS_ORIGIN`.
    - Schéma SQL initial et migration zéro (via `database/init/*.sql` ou scripts `api/src/database/migrate.js` + `seed.js`).
2)  **API Squelette (Express)**
    - Structure par domaines (`auth`, `accounts`, `projects`, `tickets`, `billing`, `files`).
    - Middlewares: logger JSON, gestion d’erreurs, CORS strict, `helmet`.
3)  **Frontend Squelette (SvelteKit)**
    - Ajouter Tailwind CSS: `npx sv add tailwindcss && npm install`.
    - Installer Flowbite Svelte: `npm i -D flowbite-svelte flowbite flowbite-svelte-icons`.
    - Configurer Flowbite dans `src/app.css`:
      - `@import "tailwindcss";` • `@plugin 'flowbite/plugin';` • `@custom-variant dark`.
      - `@source "../node_modules/flowbite-svelte/dist";` et `../node_modules/flowbite-svelte-icons/dist`.
      - Définir tokens neutres (noir/blanc): couleurs tailwind extend ou via `@theme` pour rester monochrome.
    - Squelette routes: `/login`, `/admin/login`, `/app/*` (client), `/admin/*`.
    - Layouts: Navbar + Sidebar avec Flowbite (`Navbar`, `Sidebar`/`Drawer`), slots pour breadcrumbs.
4)  **CI/CD de Base**
    - Pipeline linter + tests (API), build web. Base de données via service Postgres (container GitHub Actions). Pas d’images Docker `api/web`.

---

#### Sprint 1 : Frontend Dashboards & Navigation (Admin + Client)
Objectif: Livrer le shell UI des deux espaces (Admin et Client) avec navigation, thème et pages squelettes.
1)  UI Shell commun
    - Layouts SvelteKit: top `Navbar`, `Sidebar/Drawer`, breadcrumbs, zones de contenu, toasts.
    - Thème neutre noir/blanc: tokens Tailwind (bg-background, text-foreground, border-border, ring-ring, ring-offset-background).
    - Accessibilité: focus states visibles, contrastes, navigation clavier des menus.
2)  Espace Admin
    - Routes: `/admin`, `/admin/organizations`, `/admin/accounts`, `/admin/projects`, `/admin/tickets`, `/admin/billing`, `/admin/documents`, `/admin/settings`.
    - Pages squelettes: titres, placeholders KPIs, tables vides avec pagination/filters (Flowbite `Table`, `Badge`, `Tabs`).
3)  Espace Client
    - Routes: `/app`, `/app/projects`, `/app/support`, `/app/invoices`, `/app/documents`, `/app/account`.
    - Dashboard: cartes d’état (placeholders), navigation secondaire.
4)  Intégration technique
    - Vite proxy `/api` → API locale.
    - Découpage stores (utilisateurs/session, UI state), wrappers fetch typés.
    - Smoke tests (build, SSR) + lint + svelte-check.

---

#### Sprint 2 : Authentification & Comptes
Objectif: Sécuriser l’accès et permettre la gestion des organisations/utilisateurs.
1)  **Backend (API)**
    - Modèles: `organization`, `user_admin`, `user_client`, `audit_log`.
    - Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`.
    - Hachage `argon2id`/`bcrypt`, verrouillage après N échecs, messages "compte désactivé".
    - CRUD Orgs/Users: `GET/POST/PATCH` + soft delete; motifs obligatoires loggués.
    - RBAC middleware (roles: owner/manager/reader côté client; rôles admin internes).
2)  **Frontend (Admin & Client)**
    - Connexions distinctes avec Flowbite Svelte: `/login` (client) et `/admin/login` (admin).
      - Composants: `Input`, `Label`, `Button`, `Checkbox` (remember), `Alert`/`Toast` pour erreurs.
      - États/accessibilité: focus visibles, textes d’erreur, disable state.
    - Vue Admin: gestion des organisations et comptes (liste + `Table` + `Pagination`, modales `Modal` pour créer/éditer).
3)  **Transverse**
    - `audit_log` sur actions sensibles. Rate limiting auth. CSRF si cookies; sinon JWT headers + rota refresh.

---

#### Sprint 3 : Support (Tickets)
Objectif: Interaction client-support + notifications e-mail.
1)  **Backend (API)**
    - Modèle `ticket` + pièces jointes. Endpoints CRUD + transitions statut/priorité.
    - `email_outbox` + worker d’envoi (Nodemailer). Templates e-mail (créé/mis à jour/clos).
2)  **Frontend (Admin & Client)**
    - Admin: boîte d’entrée tickets avec `Table`, `TableSearch`, filtres `Select`/`Search`, `Tabs` par statut, `Badge` priorité.
    - Client: formulaire de création (`Textarea`, `Fileupload`, `Select`) et suivi conversation (`Timeline`/`Activity`).
    - Réponses/notes via `Modal`/`Drawer` + toasts.
3)  **Paramétrage**
    - UI de gestion SMTP + modèles e-mail. Accès via paramètres Admin.

---

#### Sprint 4 : Projets & Facturation
Objectif: Visibilité projets + suivi financier.
1)  **Backend (API)**
    - Modèles `project`, `milestone`, `deliverable`, `invoice` + endpoints.
    - Upload sécurisé (validations MIME/taille), stockage (S3/minio ou disque selon MVP).
2)  **Frontend (Admin)**
    - Projets: vues avec `Tabs` (jalons/livrables), cartes `Card`, tables `Table`.
    - Livrables: upload avec `Fileupload`, validation, versions; approbations via `Modal`.
    - Factures: liste `Table` + `Pagination`, détail PDF (aperçu), actions (émettre, relancer).
    - Option plugin: `@flowbite-svelte-plugins/datatable` pour listes enrichies.
3)  **Frontend (Client)**
    - Dash projets: jalons, livrables (téléchargement), demandes de révision (`Textarea`, `Modal`).
    - Facturation: consulter/télécharger PDF, bouton "payer" (redirigé, stub MVP).

---

#### Sprint 5 : Portail Client final & Tests
Objectif: Expérience client complète et validation des parcours.
1)  **Intégration Frontend**
    - Dashboard client (résumés): `Card`, `Badge`, `Table`/`Listgroup` pour récents.
    - Compte client: profil, gestion utilisateurs org (Owner/Manager/Reader).
    - Vérifier fluidité des parcours: ticket → réponse, livrable → approbation, facture → consultation.
2)  **Tests Bout-en-Bout**
    - E2E (Playwright) sur parcours critiques + a11y (axe) pages clés.
    - Validation e-mails (contenu/variables) et worker outbox.
3)  **Sauvegardes**
    - Procédures `pg_dump`/restore documentées et testées.

---

#### Sprint 6 : Durcissement & Déploiement
Objectif: Sécurité, performance, production-ready.
1)  **Sécurité**
    - Revue **OWASP ASVS**. `helmet`, rate limiting, validations (Zod/Joi) systématiques.
    - Requêtes SQL paramétrées. Audit dépendances (`npm audit`, `pnpm audit`).
2)  **Performance & CSS**
    - Purge CSS: `vite-plugin-tailwind-purgecss`. Mesure tailles CSS avant/après.
    - Lazy-load pages lourdes, pagination côté API.
3)  **Observabilité**
    - Logs JSON + `request_id`. Health checks. Alerting minimal.
4)  **Déploiement**
    - Fichiers d’env prod, images Docker optimisées, doc de déploiement.

***

### 3. Conseils de Bonne Pratique

#### Développement & Architecture
* **Validation des Entrées** : Utilisez une librairie comme `Zod` ou `Joi` dans votre API Express pour valider systématiquement toutes les données entrantes (body, params, query). C'est votre première ligne de défense contre les données invalides et de nombreuses failles de sécurité.
* **Variables d'Environnement** : Gérez toute la configuration (identifiants DB, secrets JWT, clés SMTP) via des variables d'environnement (`.env` en local) et ne committez jamais de secrets dans le code Git.
* **Worker Asynchrone** : Pour l'envoi d'e-mails, envisagez d'utiliser une solution de file d'attente plus robuste qu'un simple script, comme **BullMQ** avec Redis. Cela permet une meilleure gestion des erreurs, des nouvelles tentatives (`retry exponentiel`) et du monitoring des tâches.
* **Tests Automatisés** : Au-delà des tests d'intégration mentionnés, écrivez des tests unitaires pour la logique métier complexe (ex: calcul de SLA) et quelques tests End-to-End (avec Cypress ou Playwright) pour les parcours critiques.

#### Base de Données (PostgreSQL)
* **Migrations** : Utilisez un outil de migration de base de données comme `node-pg-migrate` ou l'outil intégré à un ORM comme Prisma/TypeORM. Cela permet de versionner l'évolution de votre schéma de manière fiable et reproductible.
* **Indexation** : Pensez à ajouter des index sur les clés étrangères (ex: `organization_id` sur la table `project`) et sur les colonnes fréquemment utilisées dans les clauses `WHERE` (ex: `status` sur la table `ticket`) pour garantir de bonnes performances.
* **Pool de Connexions** : Assurez-vous que votre application Node.js utilise un pool de connexions pour communiquer avec PostgreSQL. C'est essentiel pour gérer les accès concurrents et éviter d'épuiser les ressources.

#### Sécurité (Concrètement)
* **Middleware de Sécurité** : Utilisez `helmet` dans Express. Il configure divers en-têtes HTTP pour vous protéger contre des attaques courantes comme le XSS et le clickjacking.
* **CORS** : Configurez le middleware `cors` de manière stricte, en n'autorisant que le domaine de votre frontend en production.
* **Dépendances** : Exécutez régulièrement `npm audit fix` pour corriger les vulnérabilités connues dans vos dépendances.

#### Frontend (SvelteKit + Flowbite Svelte)
* **Gestion d'État** : Stores Svelte par domaine (`ticketStore`, `projectStore`…), requêtes via fetch wrappers typés.
* **UI et Composants** : **Flowbite Svelte** exclusivement (Navbar, Sidebar/Drawer, Table, Tabs, Modal, Forms, Toast, Pagination…).
* **Installation & Setup** :
  - `npm i -D flowbite-svelte flowbite flowbite-svelte-icons`.
  - `src/app.css`: `@import "tailwindcss"; @plugin 'flowbite/plugin'; @source` vers `node_modules/flowbite-svelte*/dist`.
  - Thème neutre (noir/blanc): classes Tailwind neutres et/ou tokens `@theme` monochromes.
* **Accessibilité** : Contraste ≥ 4.5:1, focus visibles, tests axe sur vues clés.
