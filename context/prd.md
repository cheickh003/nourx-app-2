# PRD — **Nourx-app**

Version: 0.1 • Portée MVP • Cible: TPE/PME clientes de NOURX • Stack: PostgreSQL (Docker uniquement), Node.js + Express (API en local), Next.js (front en local, App Router) + Tailwind CSS + shadcn/ui (UI)

## 1) Vision et objectifs

**Nourx-app** centralise la relation client et l’exploitation interne: projets, tickets, documents, facturation, portail client, notifications e-mail. Objectifs mesurables du MVP à T+90 jours:

* ≥80 % des échanges client via tickets plutôt que WhatsApp/mail direct.
* Temps moyen de réponse initiale < 8 h.
* 100 % des devis/factures consultables côté client.
* Création/activation/désactivation/suppression de comptes clients via le tableau de bord Admin, avec notifications e-mail SMTP.

## 2) Personae

* **Admin NOURX**: crée clients, gère rôles et accès, supervise KPIs.
* **Manager Projet**: publie jalons/livrables, suit tâches.
* **Agent Support**: traite tickets, applique SLAs.
* **Compta**: émet devis/factures, suit paiements.
* **Client** (utilisateur d’une organisation): consulte projets, ouvre tickets, paye, télécharge documents.

## 3) Portée fonctionnelle MVP

### 3.1 Admin (interne)

**A. Dashboard**

* Tuiles: projets actifs, tickets ouverts/par priorité, factures en retard, derniers encaissements.
* Filtres: par client, par période.

**B. Gestion des clients et comptes**

* Organisations: créer/éditer (raison sociale, SIREN/RCCM, adresse, contacts clés).
* **Comptes client**: créer utilisateur, **activer/désactiver**, **supprimer** (soft delete), réinitialiser mot de passe, forcer rotation de mot de passe.
* Champs « **motif** » obligatoires pour désactivation/suppression, consignés en **audit-log** et injectés dans les e-mails de notification.
* Invitations par e-mail, relance d’invitation, verrouillage/déverrouillage après X tentatives échouées.
* Rôles côté client: **Owner**, **Manager**, **Reader** (RBAC minimal).

**C. Projets & livrables**

* Créer projets, jalons, tâches visibles client (checkbox « exposer au portail »).
* Dépôt de livrables versionnés; validation client (approuver/demander révision).

**D. Tickets / Support**

* Boîte d’entrée, vues par statut/priorité, macros de réponse, SLA de réponse/résolution.
* Catégories/types de demande, formulaires dynamiques, pièces jointes.
* Liens croisés ticket ↔ projet ↔ document.

**E. Facturation**

* Devis, factures, avoirs; états: brouillon/émise/payée/en retard.
* Envoi des factures par e-mail; journal des envois.
* Lien « payer » paramétrable (intégration future PSP).

**F. Documents**

* Dossiers par client/projet, versioning, partage sélectif au portail.

**G. Paramètres**

* Modèles d’e-mails (activation, désactivation avec motif, réinitialisation, facture émise, ticket mis à jour).
* SMTP (hôte, port, TLS, utilisateur/mot de passe), test d’envoi.
* RBAC, secrets, webhooks (V2).

### 3.2 Portail **Client**

**Accueil**: résumé projets, tickets ouverts, factures dues, derniers documents.
**Projets**: jalons, livrables, commentaires, demandes de révision.
**Support**: créer ticket, suivre statut, échanger, consulter historique.
**Facturation**: liste devis/factures, téléchargement PDF, bouton « payer » (redirigé).
**Documents**: contrat, PV de recette, livrables.
**Compte**: profil, gestion des utilisateurs de l’organisation (Owner/Manager/Reader), préférences e-mail.

### 3.3 Authentification et Connexions

- Deux pages de connexion distinctes, une par tableau de bord:
  - Connexion Client: `/login` (utilisateurs d’une organisation). Champs: e-mail, mot de passe; liens « mot de passe oublié » et « activer mon compte ».
  - Connexion Admin: `/admin/login` (équipe NOURX). Champs: e-mail, mot de passe.
- Comportement commun:
  - Comptes désactivés: affichage « compte désactivé » (avec lien support), journalisation et aucune session créée.
  - Mauvais portail: si un compte client tente `/admin/login` (ou inversement), message d’erreur clair et invitation à utiliser le bon portail.
  - Mot de passe oublié: envoi d’un e-mail avec lien de réinitialisation, expiration configurée, invalidation après usage.
  - Sécurité: protection CSRF, rate limiting sur les endpoints d’auth, hachage fort (argon2id/bcrypt).
  - Accessibilité: messages d’erreur lisibles par lecteurs d’écran; focus visible.

## 4) User stories clés et critères d’acceptation

### Comptes client

* **En tant qu’Admin**, je **crée** un compte client, je reçois un **statut “invitation envoyée”** et l’utilisateur reçoit un e-mail avec lien d’activation.

  * *Acceptation:* audit-log contient acteur, cible, timestamp; e-mail envoyé via SMTP; premier login force définition d’un mot de passe conforme aux règles. ([cheatsheetseries.owasp.org][1])
* **En tant qu’Admin**, je **désactive** un compte client avec un **motif**; l’utilisateur ne peut plus se connecter; un e-mail notifie la désactivation en incluant le motif; l’action est réversible.

  * *Acceptation:* login renvoie « compte désactivé »; e-mail envoyé; audit-log créé.
* **En tant qu’Admin**, je **supprime** un compte client; il passe en soft-delete 30 jours puis purge.

  * *Acceptation:* compte masqué des listes par défaut; restauration possible 30 jours; purge irréversible.

### Tickets

* **Client** crée un ticket avec formulaire dédié; **Agent** répond; **SLA** calculé; e-mails d’étape envoyés.

  * *Acceptation:* transitions de statut, fil d’activité, pièces jointes, e-mails SMTP.

### Projets/Livrables

* **Manager** publie un livrable versionné; **Client** peut **approuver** ou **demander révision** avec commentaire.

  * *Acceptation:* horodatage, version courante, visibilité portail.

### Facturation

* **Compta** émet une facture; **Client** la consulte et la télécharge; rappels automatiques J+7/J+14.

  * *Acceptation:* horodatages d’envoi/lecture, relances e-mail.

## 5) Exigences non fonctionnelles

* **Sécurité**:

  * Hachage mots de passe avec argon2id/bcrypt, salage, itérations conformes. Politiques de longueur minimale et prise en charge passphrases longues. ([cheatsheetseries.owasp.org][2])
  * RBAC par rôle et périmètre organisation. Journalisation exhaustive (qui/quand/quoi). Réduction surface XSS/CSRF/SQLi. Alignement sur **OWASP ASVS** (authentification, gestion session, stockage secrets). ([OWASP Foundation][3])
* **Performance**: TTFB portail < 500 ms pour pages chaudes.
* **Disponibilité**: sauvegardes PostgreSQL quotidiennes, rétention 14 jours.
* **Observabilité**: logs structurés (JSON), traces API, métriques clés (p99 latence, taux d’erreur e-mail).
* **Internationalisation**: e-mails FR/EN paramétrables.

### 5.1 UI/UX & Design System

- Bibliothèque UI: **shadcn/ui** + Tailwind CSS (primitives Radix accessibles). Personnalisation via classes utilitaires et tokens CSS.
- Palette principale: noir/blanc (neutres) sur Admin et Client. Utiliser des gris pour états et séparations.
- Tokens (CSS variables) centralisés (tailwind + `globals.css`) pour assurer la cohérence visuelle.
- Composants: Button, Input, Dialog/Drawer, Table, Tabs, Toast (sonner)… en niveaux de gris. Accent via typographie et espacement.
- Typographie: Inter/System UI; échelle Tailwind. Arrondis ≈ 6 px.
- Accessibilité: contraste ≥ 4.5:1; focus visibles; support clavier/lecteur d’écran.
- Icônes: `lucide-react`. Pas de codage couleur des statuts critiques: icône + texte.

## 6) Architecture technique

### 6.1 Frontend

* **Next.js (App Router)** + **Tailwind CSS** + **shadcn/ui** (UI) + **Better Auth** pour l'authentification. Développement en local (`npm run dev`). Contraintes design: palette noir/blanc, tokens de thème centralisés, composants neutres. Data fetching côté serveur par défaut (`fetch` avec `cache: 'no-store'` pour SSR dynamique) et SWR côté client si nécessaire.

### 6.2 Backend

* **Node.js + Express** pour API REST en local (pas de Docker pour l'API) avec **Better Auth** comme solution d'authentification et d'autorisation. Better Auth gère JWT, sessions, RBAC et intégration email/password. Structure modulaire par domaine (accounts, projects, tickets, billing, files). ([expressjs.com][5], [better-auth.com])

### 6.3 Base de données

* **PostgreSQL** exécuté en **Docker uniquement** pour le développement: image officielle, variables d'environnement, volumes pour persistance, scripts d'initialisation. L'API et le front se connectent via `localhost:5432`. Better Auth gère automatiquement les migrations de ses tables d'authentification. La production sera gérée plus tard (Vercel ou autre) avec une base managée. ([GitHub][8], [Docker][9])

### 6.4 E-mails SMTP

* Envoi via **SMTP** depuis le backend avec **Nodemailer**. Templates HTML/TXT, pièces jointes (PDF facture), tracking de statut d’envoi. ([nodemailer.com][10])

## 7) Data model MVP (schéma logique simplifié)

* **organization**(id, name, rc\_or\_rccm, address, billing\_email, created\_at, updated\_at)
* **user\_admin**(id, email, password\_hash, role, active, created\_at, updated\_at)
* **user\_client**(id, organization\_id, email, password\_hash, role\[owner|manager|reader], active, **disabled\_reason**, deleted\_at, created\_at, updated\_at)
* **project**(id, organization\_id, name, status, due\_date, created\_at, updated\_at)
* **milestone**(id, project\_id, title, due\_date, visible\_to\_client, created\_at)
* **deliverable**(id, project\_id, version, filename, url, notes, visible\_to\_client, approved\_by\_client, created\_at)
* **ticket**(id, organization\_id, author\_user\_client\_id, type, priority, status, assignee\_user\_admin\_id, sla\_due\_at, created\_at, updated\_at)
* **invoice**(id, organization\_id, number, status, issue\_date, due\_date, total, currency, pdf\_url, created\_at)
* **document**(id, organization\_id, project\_id?, name, version, url, visible\_to\_client, created\_at)
* **email\_template**(id, key, subject, html, text, locale, updated\_at)
* **email\_outbox**(id, to, subject, payload\_json, status\[pending|sent|failed], last\_error, created\_at, sent\_at)
* **audit\_log**(id, actor\_admin\_id, target\_type, target\_id, action, details\_json, created\_at)

## 8) API (exemples d'endpoints REST)

### Auth (géré par Better Auth)

* `/api/auth/*` → Endpoints automatiques de Better Auth (sign-in, sign-up, sign-out, session)
* `/api/auth/sign-in/email` → Connexion email/password avec sessions
* `/api/auth/sign-up/email` → Création compte avec validation email
* `/api/auth/forgot-password` → Réinitialisation mot de passe
* `/api/auth/verify-email` → Vérification email

### Comptes client

* `POST /api/orgs` (créer organisation)
* `POST /api/orgs/:orgId/users` (créer **compte client** + **invitation e-mail SMTP**)
* `PATCH /api/orgs/:orgId/users/:id/activate` • `PATCH .../deactivate` **{ reason }**
* `DELETE /api/orgs/:orgId/users/:id` (**soft delete**)
* `POST /api/orgs/:orgId/users/:id/reset-password` (e-mail de réinitialisation)

### Projets

* `POST /api/orgs/:orgId/projects` • `GET /api/orgs/:orgId/projects`
* `POST /api/projects/:id/deliverables` (upload + visibilité)

### Tickets

* `POST /api/orgs/:orgId/tickets` • `GET /api/orgs/:orgId/tickets?status=`
* `POST /api/tickets/:id/reply` • `PATCH /api/tickets/:id/status`

### Facturation

* `POST /api/orgs/:orgId/invoices` • `GET /api/orgs/:orgId/invoices`
* `POST /api/invoices/:id/send` (e-mail SMTP) • `POST /api/invoices/:id/remind`

### Documents

* `POST /api/orgs/:orgId/docs` • `GET /api/orgs/:orgId/docs`

### Outils

* `POST /api/tools/email/test` (tester configuration SMTP)

> **Notes techniques**
>
> * Express pour middlewares (auth, validation, rate-limit, CORS). ([expressjs.com][5])
> * Nodemailer pour transport SMTP générique. Fournisseur interchangeable via configuration. ([nodemailer.com][11])

## 9) Règles produit et sécurité

### Authentification et mots de passe

* **Better Auth** gère automatiquement le hachage sécurisé des mots de passe et la gestion des sessions
* Support natif pour email/password, OAuth, 2FA et organisation/RBAC
* Sessions sécurisées avec cookies httpOnly et tokens CSRF
* Rate limiting intégré et protection contre les attaques par force brute
* Reset de mot de passe via tokens sécurisés avec expiration configurable

### RBAC et cloisonnement

* Entrepôt multi-tenant: filtrage par `organization_id` sur chaque requête.
* Rôles Admin internes: **admin**, **manager**, **agent**, **accountant**, **readonly**.
* Rôles côté client: **owner**, **manager**, **reader**. Journaliser toute élévation de privilège.
* Exigences globales calées sur **OWASP ASVS** (contrôles d’auth, gestion session, validation entrées, gestion secrets). ([OWASP Foundation][3])

### E-mails et templates

* Modèles paramétrables côté Admin; variables obligatoires: `{{org_name}}`, `{{user_email}}`, `{{reason}}` pour désactivation, `{{activation_link}}`, `{{reset_link}}`, `{{invoice_number}}`.
* File d’attente `email_outbox`; retry exponentiel; journalisation d’échec; endpoint de test SMTP. **Nodemailer/SMTP** pour transport universel. ([nodemailer.com][10])

## 10) Parcours critiques

### Création + activation compte client

1. Admin crée **organisation** puis **utilisateur client**.
2. API génère **token d’activation**, écrit `email_outbox`.
3. Worker envoie e-mail via **SMTP**; statut `sent` ou `failed`.
4. Client définit mot de passe conforme; première connexion → acceptation CGU.

### Désactivation compte client

1. Admin déclenche **désactivation** avec **motif**.
2. API invalide sessions/refresh tokens; `active=false; disabled_reason=...`.
3. E-mail automatique avec motif + coordonnées support.
4. Audit-log complet; bouton **réactiver** disponible.

## 11) Plan du site

### Admin

* **Tableau de bord**
* **Clients**: Organisations • Utilisateurs • Invitations
* **Projets**: Projets • Jalons • Livrables
* **Support**: Tickets • Vues • SLA
* **Facturation**: Devis • Factures • Relances
* **Documents**
* **Paramètres**: SMTP • Modèles e-mails • RBAC • Audit-log

### Client

* **Accueil**
* **Projets**: Aperçu • Livrables
* **Support**: Nouveau ticket • Mes tickets
* **Facturation**: Devis • Factures
* **Documents**
* **Compte**: Profil • Utilisateurs (Owner/Manager)

## 12) Critères de “Done” MVP

* Parcours **créer/activer/désactiver/supprimer** compte client opérationnel, **e-mails SMTP** envoyés, logs complets. ([nodemailer.com][10])
* Tickets fonctionnels avec notifications d’état.
* Projets + livrables visibles côté client.
* Factures consultables et e-mails de facture émise.
* Backups PostgreSQL planifiés; restore testé.
* Tests d’intégration API clés; linter + CI de base.

## 13) Livrables techniques

### Infra dev (Docker uniquement pour PostgreSQL)

* Service `db` basé sur image officielle **postgres**, volume `pgdata`, variables `POSTGRES_DB/USER/PASSWORD`, healthcheck, scripts d’init (schéma + seeds). ([GitHub][8])
* **API (local)**: Node 20+, Express, `.env` pour `DATABASE_URL` (pointe vers `localhost:5432`), `JWT_*`, `SMTP_*`, `CORS_ORIGIN`. Démarrage `npm run dev`.
* **Web (local)**: Next.js (App Router) + Tailwind (`npm run dev`). Accès API via `fetch` côté serveur (Server Components) avec `cache: 'no-store'` pour SSR dynamique, ou via `NEXT_PUBLIC_API_BASE_URL` côté client. Thème neutre noir/blanc avec shadcn/ui.
* Déploiement (à venir): Vercel/Autre. Pas d’images Docker pour `api`/`web` au MVP.

### Observabilité

* Logs JSON par service; corrélation `request_id`.
* Table **audit\_log** pour toutes actions sensibles.

## 14) Roadmap

* **Semaine 1–2**: modèles DB, auth, RBAC, SMTP test, CRUD organisations/utilisateurs.
* **Semaine 3–4**: tickets + notifications; projets + livrables.
* **Semaine 5–6**: facturation + e-mails; documents.
* **Semaine 7**: portail client; tests bout-en-bout; sauvegardes/restores.
* **Semaine 8**: durcissement sécurité (ASVS), métriques, préparation déploiement (Vercel/Autre). ([OWASP Foundation][3])

---

### Références clés

* Next.js (App Router, data fetching, SSR/ISR). (https://nextjs.org/docs)
* shadcn/ui (installation CLI, composants). (https://ui.shadcn.com)
* Express, API et middlewares. ([expressjs.com][5], [devdocs.io][6], [MDN Web Docs][7])
* Nodemailer + SMTP pour envoi d’e-mails. ([nodemailer.com][10])
* PostgreSQL image officielle Docker, bonnes pratiques. ([GitHub][8], [Docker][9])
* Politiques mot de passe et sécurité (OWASP Cheat Sheets + ASVS). ([cheatsheetseries.owasp.org][2], [OWASP Foundation][3])


[1]: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html?utm_source=chatgpt.com "Authentication Cheat Sheet"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html?utm_source=chatgpt.com "Password Storage - OWASP Cheat Sheet Series"
[3]: https://owasp.org/www-project-application-security-verification-standard/?utm_source=chatgpt.com "OWASP Application Security Verification Standard (ASVS)"
[4]: https://nextjs.org/docs "Next.js Documentation"
[5]: https://expressjs.com/?utm_source=chatgpt.com "Express - Node.js web application framework"
[6]: https://devdocs.io/express/?utm_source=chatgpt.com "Express documentation"
[7]: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/Introduction?utm_source=chatgpt.com "Express/Node introduction - MDN"
[8]: https://github.com/docker-library/postgres?utm_source=chatgpt.com "Docker Official Image packaging for Postgres"
[9]: https://www.docker.com/blog/how-to-use-the-postgres-docker-official-image/?utm_source=chatgpt.com "How to Use the Postgres Docker Official Image"
[10]: https://nodemailer.com/?utm_source=chatgpt.com "Nodemailer | Nodemailer"
[11]: https://nodemailer.com/smtp?utm_source=chatgpt.com "SMTP transport"
[12]: https://ui.shadcn.com "shadcn/ui Documentation"
