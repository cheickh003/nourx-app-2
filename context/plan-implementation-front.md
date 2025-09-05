### **Plan d'Implémentation Détaillé - Frontend**

Ce document est la feuille de route pour la construction de l'interface utilisateur de Nourx-app, en se basant sur les fonctionnalités du PRD et l'architecture technique définie.

**Principes Directeurs**
1.  **Expérience Robuste** : Guidage clair, gestion des erreurs, états cohérents.
2.  **RSC par Défaut** : Rendu serveur prioritaire; `"use client"` pour l'interactivité.
3.  **Stratégie de Données Explicite** : Server Components pour le chargement initial, SWR pour les données dynamiques.
4.  **État Minimal** : `URLSearchParams` pour l'état global (filtres), `Zustand` en dernier recours.
5.  **UI Idiomatique** : `shadcn/ui` et tokens Tailwind centralisés.

**Stack Technique**
*   Next.js (App Router) + TypeScript
*   Tailwind CSS + `clsx` / `tailwind-merge`
*   `shadcn/ui`
*   `SWR` pour le data-fetching côté client
*   `react-hook-form` + `Zod` (via `@nourx/shared`)
*   Tests : `Vitest` + `React Testing Library`, `Playwright` (E2E)

---

### **Feuille de Route Détaillée par Lot (Basée sur le PRD)**

#### **Lot 1 : Fondations UI, Layouts et Composants de Base**
*Objectif : Construire le "shell" de l'application, avec la navigation, les styles et les composants réutilisables.*

1.  **Initialisation du Projet `frontend`**
    *   `create-next-app` avec TypeScript et Tailwind.
    *   Configuration de `ESLint` et `Prettier`.
    *   Installation des dépendances : `swr`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, etc.

2.  **Mise en place de `shadcn/ui`**
    *   Initialiser `shadcn/ui` et configurer `tailwind.config.js` avec les tokens du PRD (couleurs neutres, typographie, etc.).
    *   Installer les composants de base nécessaires : `Button`, `Input`, `Label`, `Card`, `Table`, `Dialog`, `Select`, `Toast`, `Sheet`.

3.  **Layouts et Navigation**
    *   Créer les layouts principaux :
        *   `app/(admin)/layout.tsx` : Layout pour le portail Admin avec barre latérale de navigation.
        *   `app/(client)/layout.tsx` : Layout pour le portail Client avec une navigation en header.
    *   Créer les composants de navigation (ex: `AdminSidebar`, `ClientHeader`) et les `Breadcrumbs`.
    *   Créer les pages d'erreur personnalisées (`not-found.tsx`, `error.tsx`).

4.  **Composants UI Génériques**
    *   Créer des composants composites si nécessaire (ex: `DataTable` avec pagination et filtres, `PageHeader`).

#### **Lot 2 : Authentification et Gestion des Accès**
*Objectif : Permettre aux utilisateurs de se connecter, de gérer leur mot de passe et d'être redirigés en fonction de leur rôle et du portail.*

1.  **Intégration de Better Auth (côté client)**
    *   Créer la route `app/api/auth/[...all]/route.ts` pour exposer le handler de Better Auth.
    *   Créer `lib/auth.ts` avec des fonctions client pour `signIn`, `signOut`, `forgotPassword`, etc.

2.  **Pages d'Authentification**
    *   `app/(client)/login/page.tsx` : Formulaire de connexion pour les clients.
    *   `app/(admin)/login/page.tsx` : Formulaire de connexion pour les admins.
    *   Créer les pages pour "mot de passe oublié" et "activation de compte".
    *   Utiliser `react-hook-form` avec les schémas Zod de `@nourx/shared` pour la validation.

3.  **Garde de Navigation (`middleware.ts`)**
    *   Implémenter la logique pour rediriger les utilisateurs non authentifiés vers la page de connexion appropriée.
    *   Dans les layouts serveur (`(admin)/layout.tsx`), ajouter une vérification de session stricte pour s'assurer que l'utilisateur a le bon rôle pour accéder au portail.

#### **Lot 3 : Portail Client (Fonctionnalités de base)**
*Objectif : Construire les fonctionnalités essentielles du portail client pour qu'il soit utilisable.*

1.  **Accueil (`/dashboard`)**
    *   Page statique (Server Component) qui agrège des données via des appels `fetch` serveur.
    *   Composants de résumé pour les projets, tickets et factures.

2.  **Support (`/support`)**
    *   Page de création de ticket (`/support/new`) : Formulaire `react-hook-form` avec catégories/types (formulaire dynamique), pièces jointes (UI), validation Zod.
    *   Liste des tickets (`/support`) : `DataTable` utilisant `SWR` pour des mises à jour en temps réel.
    *   Page de détail d'un ticket (`/support/[id]`) avec fil de discussion, pièces jointes, affichage **SLA** (réponse/résolution) et liens vers projet/documents.

3.  **Facturation (`/billing`)**
    *   **Devis** et **Factures** (onglets) avec statuts; détail facture avec **Télécharger PDF** et lien **Payer** (redirection PSP).
    *   Voir l'historique d'envois d'e-mails pour une facture (lecture seule).

4.  **Gestion de Compte (`/account`)**
    *   Page de profil simple.
    *   Si l'utilisateur est `Owner` ou `Manager`, onglet **Utilisateurs** pour gérer l’organisation:
        - Lister utilisateurs (email, rôle, statut actif/désactivé)
        - **Inviter** un utilisateur (envoi e-mail d’invitation)
        - **Modifier rôle** (owner/manager/reader)
        - **Désactiver/Réactiver** (avec motif pour désactivation)
        - **Relancer invitation**
5.  **Projets & Livrables (Client) (`/projects`)**
    *   Liste des projets visibles et page détail `/projects/[id]` (jalons, tâches exposées, commentaires).
    *   Section **Livrables**: voir versions, métadonnées et visibilité.
    *   Actions: **Approuver** / **Demander révision** (avec commentaire) pour les livrables exposés.
6.  **Documents (Client) (`/documents`)**
    *   Liste/filtre/téléchargement des documents partagés (contrats, PV, livrables) avec versioning.
    *   Accès depuis projets/tickets/facturation (liens croisés).

#### **Lot 4 : Portail Admin (Gestion et Supervision)**
*Objectif : Donner aux admins les outils pour gérer les clients, superviser l'activité et configurer l'application.*

1.  **Dashboard (`/admin/dashboard`)**
    *   Construire les tuiles KPI.
    *   Ajouter des filtres (par client, période) qui modifient les `URLSearchParams` pour déclencher une re-validation des données.

2.  **Gestion des Clients (`/admin/orgs`)**
    *   `DataTable` pour lister les organisations.
    *   Page de détail d'une organisation (`/admin/orgs/[id]`) avec :
        *   Les informations de l'organisation.
        *   Une `DataTable` pour les utilisateurs de cette organisation.
        *   Boutons par utilisateur: `Activer`, `Désactiver` (avec motif), `Supprimer` (soft delete), **Relancer invitation**, **Déverrouiller**, **Forcer rotation mot de passe**.
        *   Utiliser des `Dialog` (modales) pour les actions nécessitant une confirmation ou un motif (ex: désactivation). Le formulaire dans la modale appellera l'API.

3.  **Tickets (`/admin/tickets`)**
    *   Vue "boîte de réception" avec filtres par statut et priorité; affichage **SLA** et alertes de dépassement.
    *   Interface de réponse aux tickets avec **macros de réponse**; pièces jointes; liens vers projets/documents.

4.  **Projets & Livrables (Admin) (`/admin/projects`)**
    *   CRUD projets et jalons; case "exposer au portail".
    *   **Upload livrables** (versioning), définir visibilité portail; suivi approbations/demandes de révision.

5.  **Facturation (Admin) (`/admin/billing`)**
    *   **Devis/Factures/Avoirs**: création/édition minimale; statuts (brouillon/émise/payée/en retard).
    *   Actions: **Envoyer par e-mail**, **Relancer** (rappel), aperçu PDF/URL.

6.  **Documents (Admin) (`/admin/documents`)**
    *   Dossiers par client/projet, versioning, **partage sélectif** au portail; historique de partage.

7.  **Paramètres (`/admin/settings`)**
    *   Onglet configuration SMTP avec bouton **Tester la connexion** (endpoint API tools/email/test).
    *   Onglet **Templates d’e-mails** (liste/édition/aperçu).
    *   Onglet **RBAC** (lecture/édition minimal) pour rôles Admin (admin/manager/agent/accountant/readonly).
    *   Onglet **Audit-log** (lecture): filtre par période, acteur, action.

---

**Compléments Front alignés aux docs Next.js / Better Auth**
- Auth App Router (Better Auth) : handler `/api/auth/[...all]`, client auth front, session côté serveur, middleware optimiste + validation serveur stricte.
- Double portail et RBAC : séparation `(client)` / `(admin)` avec contrôles serveurs par rôle/portail.
- Caching & data fetching : `cache: 'no-store'` pour SSR dynamique; revalidate/tags pour invalidations.
- UX Auth : pages **compte désactivé** (avec motif), **mauvais portail** (message + lien), **mot de passe oublié** et **activation** complets.
