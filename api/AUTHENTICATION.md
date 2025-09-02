# NOURX Authentication System - Phase 2

## Vue d'ensemble

L'architecture d'authentification NOURX Phase 2 implémente un système sécurisé avec les meilleures pratiques de sécurité incluant :

- **Hachage sécurisé des mots de passe** avec bcrypt (12 rounds)
- **JWT avec refresh token rotation** pour la gestion des sessions
- **Account lockout** après 5 tentatives échouées (30 minutes)
- **Audit logging complet** pour toutes les actions sensibles
- **Rate limiting** déjà en place via middleware
- **Validation stricte** des entrées avec Zod et express-validator

## Architecture des Services

### 1. AuthService (`/src/services/authService.js`)

**Responsabilités :**
- Validation et hachage des mots de passe
- Authentification des utilisateurs (admin/client)
- Gestion des comptes bloqués (lockout)
- Génération et validation des tokens de réinitialisation
- Activation des comptes clients

**Méthodes principales :**
```javascript
// Validation des identifiants
validateLogin(loginData) // {email, password, userType}

// Gestion des mots de passe
hashPassword(password)
generatePasswordResetToken(email, userType)
resetPassword(resetData)

// Activation des comptes
activateAccount(activationData)

// Utilitaires
getUserByEmail(email, tableName)
getUserById(userId, tableName)
```

**Sécurité implémentée :**
- Protection contre les attaques de timing (simulatePasswordCheck)
- Validation stricte avec Zod schemas
- Gestion automatique du lockout (5 échecs = 30 min)
- Hachage bcrypt avec 12 rounds (haute sécurité)

### 2. JwtService (`/src/services/jwtService.js`)

**Responsabilités :**
- Génération de paires access/refresh tokens
- Vérification et validation des tokens
- Rotation automatique des refresh tokens
- Révocation de tokens
- Nettoyage des tokens expirés

**Méthodes principales :**
```javascript
// Gestion des tokens
generateTokenPair(payload, rememberMe)
verifyAccessToken(token)
verifyRefreshToken(token)
refreshAccessToken(refreshToken)

// Révocation
revokeRefreshToken(tokenId)
revokeAllUserTokens(userId, userType)

// Maintenance
cleanupExpiredTokens()
```

**Configuration des tokens :**
- **Access Token :** 15 minutes (JWT_ACCESS_SECRET)
- **Refresh Token :** 7 jours (30 jours si "remember me")
- **Rotation :** Automatique selon la politique de sécurité
- **Storage :** Refresh tokens hachés en base (table refresh_tokens)

### 3. AuditService (`/src/services/auditService.js`)

**Responsabilités :**
- Logging de toutes les actions sensibles
- Classification par niveau de risque
- Génération de rapports de sécurité
- Nettoyage des logs anciens

**Actions auditées :**
```javascript
// Actions d'authentification
LOGIN_SUCCESS, LOGIN_FAILED, LOGIN_LOCKED, LOGOUT
PASSWORD_RESET_REQUESTED, PASSWORD_RESET_SUCCESS
ACCOUNT_ACTIVATED, TOKEN_REFRESHED, TOKEN_REVOKED

// Actions de sécurité
PERMISSION_DENIED, SUSPICIOUS_ACTIVITY, RATE_LIMIT_EXCEEDED

// Actions système
USER_CREATED, USER_UPDATED, USER_DELETED, ROLE_CHANGED
```

**Niveaux de risque :**
- `LOW` : Connexions réussies, déconnexions
- `MEDIUM` : Échecs de connexion, réinitialisations
- `HIGH` : Comptes bloqués, activités suspectes
- `CRITICAL` : Suppressions d'organisations, violations graves

## Base de données

### Tables principales

#### `user_admin` & `user_client`
```sql
-- Colonnes de sécurité communes
failed_login_attempts INTEGER DEFAULT 0
locked_until TIMESTAMP WITH TIME ZONE
password_reset_token VARCHAR(255)
password_reset_expires_at TIMESTAMP WITH TIME ZONE
last_login_at TIMESTAMP WITH TIME ZONE
```

#### `refresh_tokens` (nouvelle table)
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID UNIQUE NOT NULL, -- JWT jti
    user_id UUID NOT NULL,
    user_type VARCHAR(10) NOT NULL, -- 'admin' ou 'client'
    token_hash VARCHAR(64) NOT NULL, -- SHA-256 du token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    remember_me BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `audit_logs` (colonne ajoutée)
```sql
-- Nouvelle colonne pour classification des risques
ALTER TABLE audit_logs 
ADD COLUMN risk_level VARCHAR(20) NOT NULL DEFAULT 'medium'
CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));
```

## Contrôleur d'authentification

### Endpoints implémentés

#### `POST /api/auth/login`
```javascript
Body: {
  email: string,
  password: string,
  userType: 'admin' | 'client',
  rememberMe?: boolean
}

Response: {
  success: true,
  user: UserData,
  accessToken: string,
  expiresAt: Date,
  tokenType: 'Bearer'
}
```

#### `POST /api/auth/logout`
- Révoque le refresh token
- Efface le cookie sécurisé
- Audit log de déconnexion

#### `POST /api/auth/refresh`
```javascript
Body: { refreshToken?: string } // Ou cookie HTTP-only

Response: {
  success: true,
  accessToken: string,
  expiresAt: Date,
  rotated: boolean // True si nouveau refresh token
}
```

#### `POST /api/auth/forgot-password`
```javascript
Body: {
  email: string,
  userType: 'admin' | 'client'
}

Response: {
  success: true,
  message: "Si un compte existe, un email a été envoyé"
}
```

#### `POST /api/auth/reset-password`
```javascript
Body: {
  token: string,
  password: string, // Min 8 chars, majuscule, minuscule, chiffre
  userType: 'admin' | 'client'
}
```

#### `POST /api/auth/activate`
```javascript
Body: {
  token: string, // Token d'invitation
  password: string
}

Response: {
  success: true,
  user: UserData,
  accessToken: string, // Login automatique après activation
  expiresAt: Date
}
```

#### `GET /api/auth/me` (Protégé)
```javascript
Headers: {
  Authorization: 'Bearer <access_token>'
}

Response: {
  success: true,
  user: {
    id: UUID,
    email: string,
    role: string,
    userType: 'admin' | 'client',
    organizationId?: UUID,
    organizationName?: string,
    lastLoginAt: Date
  }
}
```

## Middleware de sécurité

### `requireAuth` (mis à jour)
- Utilise `JwtService` pour validation
- Logging automatique des tentatives suspectes
- Vérification des comptes bloqués
- Injection des données utilisateur dans `req.user`

### Gestion des erreurs
- **401 Unauthorized :** Token invalide/expiré
- **423 Locked :** Compte temporairement bloqué
- **429 Too Many Requests :** Rate limiting déclenché
- **500 Internal Error :** Erreurs système (avec audit)

## Configuration requise

### Variables d'environnement
```bash
# JWT Configuration
JWT_ACCESS_SECRET=your-long-random-secret-key-for-access-tokens
JWT_REFRESH_SECRET=your-long-random-secret-key-for-refresh-tokens

# Sécurité (optionnel)
AUDIT_RETENTION_DAYS=365    # Rétention des logs d'audit
SECURITY_REPORT_DAYS=7      # Période des rapports de sécurité
```

## Scripts utilitaires

### Test complet du système
```bash
cd api
node src/scripts/test-auth.js
```

### Maintenance périodique
```bash
# Nettoyage complet
node src/scripts/maintenance.js

# Tâches spécifiques
node src/scripts/maintenance.js cleanup-tokens reset-lockouts
node src/scripts/maintenance.js security-report db-health

# Aide
node src/scripts/maintenance.js --help
```

## Workflow typique

### 1. Connexion utilisateur
```
Client → POST /auth/login
     ↓ Validation des identifiants (AuthService)
     ↓ Génération des tokens (JwtService)  
     ↓ Audit logging (AuditService)
     ↓ Cookie HTTP-only pour refresh token
     ← Access token + données utilisateur
```

### 2. Accès aux ressources protégées
```
Client → GET /api/resource (avec Bearer token)
     ↓ Middleware requireAuth
     ↓ Validation du token (JwtService)
     ↓ Récupération des données utilisateur
     ↓ Injection dans req.user
     → Accès autorisé
```

### 3. Renouvellement de token
```
Client → POST /auth/refresh (avec cookie ou body)
     ↓ Validation du refresh token (JwtService)
     ↓ Rotation si nécessaire
     ↓ Nouveau access token
     ← Token renouvelé
```

## Bonnes pratiques de sécurité

### Implémentées
✅ Hachage bcrypt avec rounds élevés (12)  
✅ JWT avec expiration courte (15 min)  
✅ Refresh token rotation périodique  
✅ Account lockout automatique  
✅ Rate limiting sur les endpoints sensibles  
✅ Audit logging complet avec niveaux de risque  
✅ Validation stricte des entrées  
✅ Protection contre les attaques de timing  
✅ Cookies HTTP-only pour refresh tokens  
✅ CORS et Helmet configurés  

### Recommandations opérationnelles
🔄 Exécuter la maintenance quotidiennement  
📊 Surveiller les rapports de sécurité  
🔐 Rotation régulière des secrets JWT  
📧 Intégration du service email pour les notifications  
🚨 Alertes automatiques pour activités suspectes  

## Support et debugging

### Logs de debug
Les services génèrent des logs détaillés en mode développement. Utiliser `NODE_ENV=development` pour activer.

### Audit des actions
Toutes les actions sensibles sont auditées dans `audit_logs` avec :
- Horodatage précis
- Adresse IP et User-Agent
- Niveau de risque
- Détails JSON de l'action

### Scripts de maintenance
- Nettoyage automatique des tokens expirés
- Rapport de sécurité périodique
- Vérification de la santé de la base de données
- Déverrouillage automatique des comptes expirés

Cette architecture fournit une base solide et sécurisée pour l'authentification NOURX Phase 2, prête pour la production avec monitoring et maintenance inclus.