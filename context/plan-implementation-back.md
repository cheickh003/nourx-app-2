### **Plan d'Implémentation Détaillé - Backend**

Ce document est la feuille de route technique pour la construction de l'API Nourx-app, alignée sur le PRD.

**Principes Directeurs**
1.  **Simplicité et Clarté** : Modules à responsabilité unique.
2.  **Sécurité Intégrée** : Validation, permissions et audit à chaque étape.
3.  **Robustesse** : Erreurs standardisées, transactions atomiques, idempotence.
4.  **Observabilité** : Logs structurés et actionnables.
5.  **DX Optimale** : Outillage pour prévenir les erreurs et automatiser.

**Stack Technique Spécifiée**
*   **Langage** : TypeScript
*   **Framework** : Node.js + Express
*   **Base de Données** : PostgreSQL (via Docker)
*   **Accès DB** : `node-postgres` (pg) + `Kysely` (query builder typé)
*   **Authentification** : Better Auth
*   **Validation** : `Zod` (via le paquet `@nourx/shared`)
*   **Emails** : Nodemailer
*   **Tests** : `Vitest` + `Supertest`
*   **Migrations** : `node-pg-migrate`

---

### **Feuille de Route Détaillée par Lot (Basée sur le PRD)**

#### **Lot 1 : Fondations, Configuration et Authentification de Base**
*Objectif : Mettre en place un serveur fonctionnel, sécurisé, avec une base de données et un système d'authentification prêt à l'emploi.*

1.  **Initialisation du Projet `backend`**
    *   `package.json` avec scripts (`dev`, `build`, `test`, `migrate`).
    *   Installation des dépendances : `express`, `typescript`, `kysely`, `pg`, `zod`, `pino`, `helmet`, `cors`, `dotenv`, etc.
    *   Configuration de `tsconfig.json`.
    *   Mise en place de `ESLint` et `Prettier`.

2.  **Infrastructure (Docker & DB)**
    *   Finaliser `infra/docker-compose.yml` pour le service PostgreSQL.
    *   Créer les scripts de migration (`node-pg-migrate`) pour toutes les tables définies dans le PRD (`organization`, `user_admin`, `user_client`, `project`, `ticket`, `audit_log`, etc.).
    *   Créer un script de `seed` pour insérer un utilisateur `admin` par défaut.

3.  **Serveur Express & Middlewares**
    *   `server.ts` : Point d'entrée, démarrage du serveur HTTP.
    *   `app.ts` : Instance Express, montage des middlewares globaux :
        *   `helmet()` pour les en-têtes de sécurité.
        *   `cors()` configuré pour l'origine du frontend.
        *   `express.json()` pour le parsing des body.
        *   Middleware de logging `pino` avec `request-id`.
        *   Middleware de gestion d'erreurs global (capture les `AppError` et les erreurs standards).

4.  **Intégration de Better Auth**
    *   Configurer Better Auth avec l'adaptateur PostgreSQL.
    *   Monter les routes d'authentification sur `/api/auth/*`.
    *   Définir les rôles internes (admin/manager/agent/accountant/readonly) et côté client (owner/manager/reader).
    *   Créer le middleware `isAuthenticated` et `hasRole` pour protéger les futures routes.
    *   Verrouillage/déverrouillage de compte après X tentatives échouées (compteur + `unlock` Admin).

5.  **Module `shared`**
    *   Créer les schémas Zod dans `@nourx/shared` pour `User`, `Organization` et les payloads d'authentification.

#### **Lot 2 : Gestion des Organisations et des Comptes Clients**
*Objectif : Permettre à un Admin de gérer entièrement le cycle de vie d'un client, de la création à la suppression, avec audit et notifications.*

1.  **Endpoints API (`/api/orgs`, `/api/orgs/:orgId/users`)**
    *   `POST /api/orgs` : Créer une organisation.
        *   *Service* : Valide les données, insère dans la DB, crée un `audit_log`.
    *   `POST /api/orgs/:orgId/users` : Créer un utilisateur client.
        *   *Service* : Crée l'utilisateur avec un statut "en attente", génère un token d'activation, insère une tâche dans `email_outbox` (template `activate_account`).
    *   `PATCH /api/orgs/:orgId/users/:id/deactivate` : Désactiver un compte.
        *   *Payload* : `{ reason: string }`.
        *   *Service* : Met à jour `user_client.active = false` et `disabled_reason`, invalide les sessions, crée un `audit_log`, insère dans `email_outbox` (template `deactivate_account` avec `reason`).
    *   `PATCH /api/orgs/:orgId/users/:id/activate` : Réactiver un compte.
    *   `DELETE /api/orgs/:orgId/users/:id` : Suppression soft.
        *   *Service* : Met à jour `deleted_at`, invalide les sessions, crée un `audit_log`.
    *   `POST /api/orgs/:orgId/users/:id/reset-password` : Envoyer un e-mail de réinitialisation.
    *   `POST /api/orgs/:orgId/users/:id/resend-invite` : Relancer l'invitation.
    *   `POST /api/orgs/:orgId/users/:id/unlock` : Déverrouiller un compte verrouillé.

2.  **Système d'E-mails (Nodemailer + Outbox)**
    *   Configurer le transporteur Nodemailer via les variables d'environnement (`SMTP_*`).
    *   Créer le service d'e-mail qui lit les templates depuis la DB (`email_template`).
    *   Développer le worker `outbox-worker.ts` qui tourne en arrière-plan, traite les e-mails en attente, et gère les tentatives multiples.

3.  **Audit**
    *   Créer un service `audit.service.ts` simple, appelé par les autres services pour enregistrer les actions critiques.

#### **Lot 3 : Projets, Livrables et Documents**
*Objectif : Permettre la gestion de projets et le partage de fichiers entre NOURX et ses clients.*

1.  **Endpoints API (`/api/projects`, `/api/documents`)**
    *   CRUD complet pour les Projets (`/api/orgs/:orgId/projects`).
    *   CRUD pour les Jalons (`/api/projects/:id/milestones`).
    *   `POST /api/projects/:id/deliverables` : Upload d'un livrable.
        *   *Service* : Gère le stockage du fichier (localement dans `storage/` pour le MVP), crée l'entrée en DB avec versioning simple.
    *   `GET /api/deliverables/:id/download` : Route sécurisée pour le téléchargement.
    *   Endpoints similaires pour le module `documents`.
    *   `PATCH /api/deliverables/:id/approve` • `PATCH /api/deliverables/:id/request-revision` : Workflow d'approbation client (motif/commentaire requis pour révision).
    *   Documents: `POST /api/orgs/:orgId/docs` (upload), `GET /api/orgs/:orgId/docs` (liste filtrable), versioning (nouvelle version = nouvel enregistrement lié), partage sélectif au portail.

#### **Lot 4 : Tickets et Facturation**
*Objectif : Mettre en place les outils de communication (support) et financiers (facturation).*

1.  **Endpoints API (`/api/tickets`, `/api/invoices`)**
    *   `POST /api/orgs/:orgId/tickets` : Création d'un ticket par un client.
    *   `GET /api/orgs/:orgId/tickets?status=...` : Liste des tickets avec filtres.
    *   `POST /api/tickets/:id/reply` : Ajouter une réponse à un ticket.
    *   `PATCH /api/tickets/:id/status` : Changer le statut d'un ticket.
        *   *Service* : Doit notifier le client par e-mail via `email_outbox`.
    *   **Catégories & Types**: `GET /api/tickets/categories` (schémas de formulaire dynamiques associés) pour alimenter le front.
    *   **Macros de réponse**: CRUD `POST/GET/PATCH/DELETE /api/tickets/macros` (scopées Admin), usage lors des réponses.
    *   **Liens croisés**: endpoints pour lier/historiser ticket ↔ projet ↔ document.
    *   CRUD complet pour la Facturation (`/api/orgs/:orgId/invoices`).
    *   `POST /api/invoices/:id/send` : Marque comme envoyée et déclenche un e-mail; `POST /api/invoices/:id/remind` pour relance.
    *   Champ `type` pour la table facture: `invoice.type in (quote, invoice, credit_note)` afin de couvrir devis/avoirs (MVP: quote/invoice au minimum).

2.  **Logique Métier**
    *   Implémenter la logique de calcul de SLA (simple `due_date`) dans le `ticket.service.ts`.
    *   Politique de verrouillage de compte (X tentatives) avec fenêtre temporelle configurable.
    *   Invalidation de session à la désactivation/suppression; audit systématique avec `details_json`.

3.  **Paramètres**
    *   `POST /api/tools/email/test` : Endpoint pour tester la configuration SMTP.
    *   CRUD pour les `email_template`.
    *   Endpoint **Audit-log**: `GET /api/audit?actor=&action=&from=&to=` (paginé).

#### **Lot 5 : Observabilité, Sécurité et Finitions**
*Objectif : Consolider les aspects transverses pour un MVP maintenable et sûr.*

1.  **Observabilité**
    *   Corrélation `request-id`, logs JSON `pino` avec contexte (user-id, org-id).
    *   Métriques simples (compteurs e-mails envoyés/échoués, tickets ouverts/fermés).

2.  **Sécurité**
    *   Rate limiting sur `/api/auth/*` et endpoints critiques; CORS strict avec `credentials`.
    *   Validation Zod sur toutes entrées; tailles max payload; contrôle MIME uploads.
    *   Multi-tenant: toujours filtrer par `organization_id` dans les requêtes côté client.

3.  **API Design**
    *   Pagination standard (cursor/limit) pour listes (tickets, invoices, docs…).
    *   Contrats d’erreurs normalisés `{ error_code, message, details }` et codes HTTP appropriés.
