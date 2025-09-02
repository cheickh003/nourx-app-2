# Account Controller Implementation - Phase 2 NOURX

## 📋 Aperçu

Implementation complète du contrôleur de gestion des comptes pour la Phase 2 de NOURX, incluant la gestion des organisations et des utilisateurs clients avec toutes les fonctionnalités de sécurité et d'audit requises.

## 🏗️ Architecture

### Services Utilisés
- **AuthService**: Authentification et gestion des tokens
- **AuditService**: Logging des événements de sécurité
- **Database Pool**: Connexions PostgreSQL avec transactions

### Validation
- **Zod Schemas**: Validation stricte des données d'entrée
- **Sanitization**: Nettoyage automatique des chaînes
- **Type Safety**: Validation des types TypeScript-like

## 🔐 Fonctionnalités de Sécurité

### 1. Gestion des Permissions
```javascript
// Vérification des permissions par organisation
const checkOrganizationPermission = async (userId, userType, organizationId, requiredRoles)
```
- **Admin**: Accès complet à toutes les organisations
- **Owner**: Gestion complète de leur organisation
- **Manager**: Lecture des utilisateurs de leur organisation
- **Reader**: Pas d'accès aux fonctions de gestion

### 2. Audit Logging
- Tous les événements sensibles sont logués
- Métadonnées complètes (IP, User-Agent, timestamp)
- Niveaux de risque automatiques
- Events de sécurité pour les tentatives non autorisées

### 3. Validation Stricte
```javascript
const organizationCreateSchema = z.object({
  name: z.string().trim().min(2).max(255),
  rc_or_rccm: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().optional().nullable(),
  billing_email: z.string().email().optional().nullable()
});
```

## 📊 Endpoints Implémentés

### Organizations CRUD
| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| GET | `/api/accounts/organizations` | Admin | Liste paginée des organisations |
| POST | `/api/accounts/organizations` | Admin | Création d'organisation |
| GET | `/api/accounts/organizations/:id` | Admin | Détails d'une organisation |
| PATCH | `/api/accounts/organizations/:id` | Admin | Mise à jour d'organisation |

### Users Management  
| Method | Endpoint | Access | Description |
|--------|----------|---------|-------------|
| GET | `/api/accounts/organizations/:orgId/users` | Admin/Owner/Manager | Liste des utilisateurs |
| POST | `/api/accounts/organizations/:orgId/users` | Admin/Owner | Création et invitation |
| PATCH | `/api/accounts/organizations/:orgId/users/:userId/activate` | Admin | Activation d'utilisateur |
| PATCH | `/api/accounts/organizations/:orgId/users/:userId/deactivate` | Admin | Désactivation avec raison |
| DELETE | `/api/accounts/organizations/:orgId/users/:userId` | Admin | Soft delete avec raison |
| POST | `/api/accounts/organizations/:orgId/users/:userId/reset-password` | Admin/Owner | Reset mot de passe |
| PATCH | `/api/accounts/organizations/:orgId/users/:userId/role` | Admin/Owner | Changement de rôle |

## 🔍 Fonctionnalités Avancées

### 1. Pagination et Recherche
```javascript
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
```

### 2. Transactions Atomiques
- Toutes les opérations complexes utilisent des transactions
- Rollback automatique en cas d'erreur
- Consistance des données garantie

### 3. Soft Delete
```javascript
// Soft delete avec audit trail
UPDATE user_client 
SET 
  deleted_at = CURRENT_TIMESTAMP,
  active = false,
  disabled_reason = $1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $2
```

### 4. Email Management
- **Invitations**: Génération de tokens sécurisés (7 jours)
- **Password Reset**: Tokens d'une heure avec liens sécurisés
- **Queue System**: Emails stockés dans `email_outbox` pour traitement asynchrone

## 📈 Statistiques et Métriques

### Organisation Details
```javascript
// Stats complètes par organisation
SELECT 
  o.*,
  COUNT(uc.id) as user_count,
  COUNT(CASE WHEN uc.active = true THEN 1 END) as active_user_count,
  COUNT(CASE WHEN uc.role = 'owner' THEN 1 END) as owner_count,
  COUNT(CASE WHEN uc.role = 'manager' THEN 1 END) as manager_count,
  COUNT(CASE WHEN uc.role = 'reader' THEN 1 END) as reader_count,
  COUNT(p.id) as project_count,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_project_count,
  COUNT(t.id) as ticket_count,
  COUNT(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 END) as open_ticket_count
FROM organizations o
-- JOINs...
```

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Validation Errors**: Données d'entrée invalides (400)
2. **Permission Errors**: Accès non autorisé (403)  
3. **Not Found Errors**: Ressource inexistante (404)
4. **Business Logic Errors**: Contraintes métier (400)
5. **Server Errors**: Erreurs internes (500)

### Logging d'Erreurs
```javascript
// Événements de sécurité
await auditService.logSecurityEvent({
  action: AUDIT_ACTIONS.PERMISSION_DENIED,
  actorId: metadata.actorId,
  actorType: metadata.actorType,
  details: { resource: 'create_user', organizationId: orgId },
  ipAddress: metadata.ipAddress,
  userAgent: metadata.userAgent
});
```

## 🔧 Configuration

### Variables d'Environnement Requises
```env
DATABASE_URL=postgresql://...
FRONTEND_URL=https://app.nourx.com
NODE_ENV=production
```

### Dépendances
- `zod`: Validation des données
- `crypto`: Génération de tokens sécurisés
- `pg`: Client PostgreSQL
- Middleware existant: `requireAuth`, `requireRole`, `validateRequest`

## 🧪 Tests et Validation

### Test d'Intégration
```bash
node src/scripts/test-accounts.js
```

Valide:
- ✅ Connexion base de données
- ✅ Initialisation des services  
- ✅ Export des méthodes
- ✅ Imports des constantes
- ✅ Fonctionnalités de sécurité

### ESLint
Code respectant les standards ESLint avec corrections pour:
- Variables non utilisées
- Braces obligatoires
- const vs let
- Console statements (warnings acceptables)

## 🚀 Utilisation

### Exemple d'Appel API
```javascript
// Création d'organisation
POST /api/accounts/organizations
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Entreprise Example",
  "rc_or_rccm": "RC123456",
  "address": "123 Rue de Paris",
  "billing_email": "billing@example.com"
}

// Invitation d'utilisateur
POST /api/accounts/organizations/uuid/users
Authorization: Bearer <owner-token>

{
  "email": "user@example.com", 
  "role": "manager"
}
```

### Réponses API
```javascript
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation completed successfully",
  "pagination": { /* pagination info */ } // pour les listes
}
```

## 📝 Notes d'Implémentation

### Bonnes Pratiques Appliquées
1. **Contract-First Design**: APIs définies avec validation stricte
2. **Security by Default**: Permissions vérifiées à chaque endpoint
3. **Audit Trail Complete**: Tous les événements sensibles tracés
4. **Defensive Programming**: Vérifications multiples et gestion d'erreurs
5. **Database Safety**: Transactions et requêtes paramétrées

### Extensibilité
- Schema validation modulaire
- Permission system configurable
- Audit events extensibles
- Email templates personnalisables

L'implementation est prête pour la production avec toutes les exigences de sécurité, performance et auditabilité requises pour NOURX Phase 2.