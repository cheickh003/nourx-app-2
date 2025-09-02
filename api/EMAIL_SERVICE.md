# NOURX Email Service Documentation

## Vue d'ensemble

Le service email de NOURX est un système complet de gestion d'emails pour l'envoi de notifications transactionnelles. Il comprend :

- **EmailService** : Service principal pour l'envoi d'emails
- **EmailTemplateService** : Gestion des templates HTML/texte
- **EmailWorker** : Worker asynchrone pour le traitement en arrière-plan
- **File d'attente robuste** : Système de retry avec backoff exponentiel
- **Templates professionnels** : Designs responsive avec branding NOURX

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│  EmailService   │───▶│  email_outbox   │
│                 │    │                 │    │    (Queue)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  EmailWorker    │◀───│  Polling Loop   │
                       │                 │    │   (5 seconds)   │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  SMTP Server    │
                       │ (Nodemailer)    │
                       └─────────────────┘
```

## Configuration

### Variables d'environnement

```bash
# Configuration SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@nourx.com
SMTP_PASSWORD=your-password
SMTP_TLS_REJECT_UNAUTHORIZED=true

# Configuration email
FROM_EMAIL=noreply@nourx.com
FROM_NAME=NOURX
SUPPORT_EMAIL=support@nourx.com
ADMIN_EMAIL=admin@nourx.com
WEB_URL=https://app.nourx.fr

# Développement (Ethereal Email pour tests)
ETHEREAL_USER=your-ethereal-user
ETHEREAL_PASS=your-ethereal-pass
```

### Base de données

La table `email_outbox` est créée automatiquement via les migrations :

```sql
CREATE TABLE email_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    cc_emails TEXT,
    bcc_emails TEXT,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    payload_json JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Utilisation

### 1. Service Email de base

```javascript
import EmailService from './src/services/emailService.js';
import pool from './src/config/database.js';

const emailService = new EmailService(pool);

// Envoyer un email avec template
const emailId = await emailService.queueEmail({
  to: 'user@example.com',
  templateKey: 'user_invitation',
  templateData: {
    userEmail: 'user@example.com',
    organizationName: 'Mon Entreprise',
    activationLink: 'https://app.nourx.fr/activate?token=abc123'
  }
});
```

### 2. Emails spécialisés

```javascript
// Invitation utilisateur
await emailService.sendUserInvitation(
  'user@example.com',
  'Mon Entreprise',
  'invitation-token-123'
);

// Reset de mot de passe
await emailService.sendPasswordReset(
  'user@example.com',
  'reset-token-456'
);

// Confirmation d'activation
await emailService.sendAccountActivated(
  'user@example.com',
  'Jean Dupont',
  'Mon Entreprise'
);

// Notification admin
await emailService.sendAdminNotification(
  'Nouveau compte créé',
  'Un nouveau compte utilisateur a été créé...'
);
```

### 3. Worker asynchrone

```javascript
import EmailWorker from './src/services/emailWorker.js';

const worker = new EmailWorker(pool);

// Démarrer le worker
await worker.start();

// Écouter les événements
worker.on('batch-processed', (result) => {
  console.log(`${result.processed} emails envoyés, ${result.failed} échoués`);
});

worker.on('error', (error) => {
  console.error('Erreur worker:', error);
});

// Arrêter le worker
await worker.stop();
```

## Scripts NPM

### Worker Email

```bash
# Démarrer le worker
npm run email:worker

# Statut de la file d'attente
npm run email:worker:status

# Statistiques détaillées
npm run email:worker:stats

# Vérification santé
npm run email:worker:health

# Retry des emails échoués
npm run email:worker:retry
```

### Tests

```bash
# Tests basiques
npm run email:test

# Test d'invitation
npm run email:test invitation user@example.com

# Test de reset password
npm run email:test reset user@example.com

# Test complet
npm run email:test all user@example.com

# Preview des templates
npm run email:test:templates
```

## API Endpoints

### Administration des Emails

```
GET    /api/admin/emails/health           - Santé du service
GET    /api/admin/emails/queue/status     - Statut de la file
POST   /api/admin/emails/send             - Envoyer email
POST   /api/admin/emails/test             - Email de test
POST   /api/admin/emails/:id/retry        - Retry email échoué
```

### Gestion des Templates

```
GET    /api/admin/emails/templates        - Liste des templates
GET    /api/admin/emails/templates/:key   - Template spécifique
PUT    /api/admin/emails/templates/:key   - Créer/modifier template
DELETE /api/admin/emails/templates/:key   - Supprimer template
POST   /api/admin/emails/templates/:key/preview - Prévisualiser
```

### Emails Spécialisés

```
POST   /api/admin/emails/send-invitation  - Invitation utilisateur
POST   /api/admin/emails/send-reset       - Reset mot de passe
POST   /api/admin/emails/send-welcome     - Email de bienvenue
```

### Worker Management

```
POST   /api/admin/emails/worker/start     - Démarrer worker
POST   /api/admin/emails/worker/stop      - Arrêter worker
```

## Templates Disponibles

### 1. Invitation Utilisateur (`user_invitation`)

Variables :
- `userEmail` : Email de l'utilisateur
- `organizationName` : Nom de l'organisation
- `activationLink` : Lien d'activation sécurisé
- `expiresAt` : Date d'expiration
- `supportEmail` : Email de support

### 2. Reset Mot de Passe (`password_reset`)

Variables :
- `userEmail` : Email de l'utilisateur
- `resetLink` : Lien de reset sécurisé
- `expiresAt` : Heure d'expiration
- `supportEmail` : Email de support

### 3. Activation Compte (`account_activation`)

Variables :
- `userName` : Nom de l'utilisateur
- `userEmail` : Email de l'utilisateur
- `organizationName` : Nom de l'organisation
- `loginLink` : Lien de connexion
- `supportEmail` : Email de support

### 4. Alerte Sécurité (`security_alert`)

Variables :
- `userEmail` : Email de l'utilisateur
- `alertType` : Type d'alerte
- `details` : Détails de l'incident
- `timestamp` : Date et heure
- `supportEmail` : Email de support

### 5. Notification Admin (`admin_notification`)

Variables :
- `subject` : Sujet de la notification
- `message` : Message principal
- `timestamp` : Date et heure

## Fonctionnalités Avancées

### 1. Rate Limiting

- 100 emails maximum par heure par destinataire
- Limitation API : 20 requêtes par 15 minutes
- Tests : 5 emails de test par heure

### 2. Retry Logic

- 5 tentatives maximum
- Backoff exponentiel : 1s, 5s, 15s, 30s, 60s
- Emails stuck détectés et réinitialisés

### 3. Monitoring

- Logs détaillés avec Winston
- Métriques de performance
- Health checks automatiques
- Alertes en cas de problème

### 4. Sécurité

- Liens sécurisés avec signature HMAC
- Validation XSS des templates
- Tokens temporaires avec expiration
- Audit des envois d'emails

## Développement

### Structure des fichiers

```
src/
├── services/
│   ├── emailService.js         # Service principal
│   ├── emailTemplateService.js # Gestion templates
│   └── emailWorker.js          # Worker asynchrone
├── controllers/
│   └── emailController.js      # Contrôleur API
├── routes/
│   └── emailRoutes.js          # Routes API
└── scripts/
    ├── email-worker.js         # Script worker
    └── test-email.js           # Script de tests
```

### Tests

```bash
# Lancer tous les tests
npm test

# Tests spécifiques email
npm run email:test all test@example.com

# Tests des templates
npm run email:test:templates
```

### Debug

Variables d'environnement utiles :

```bash
LOG_LEVEL=debug              # Logs détaillés
NODE_ENV=development         # Mode développement
```

### Production

Recommandations pour la production :

1. **SMTP** : Utiliser un service professionnel (SendGrid, AWS SES, etc.)
2. **Worker** : Déployer comme service séparé avec PM2 ou Docker
3. **Monitoring** : Intégrer avec votre système de monitoring
4. **Logs** : Centraliser les logs avec ELK Stack ou similaire
5. **Rate Limiting** : Ajuster selon vos besoins

### Worker en Production

```bash
# Avec PM2
pm2 start src/scripts/email-worker.js --name "nourx-email-worker"

# Avec Docker
docker run -d --name nourx-email-worker \
  --env-file .env \
  nourx-api node src/scripts/email-worker.js
```

## Troubleshooting

### Problèmes courants

1. **Emails non envoyés**
   ```bash
   npm run email:worker:status
   npm run email:worker:health
   ```

2. **SMTP non configuré**
   - Vérifier les variables d'environnement
   - Tester la connexion SMTP
   - Utiliser Ethereal pour le développement

3. **Templates corrompus**
   ```bash
   npm run email:test:templates
   ```

4. **Worker bloqué**
   ```bash
   npm run email:worker:retry
   ```

### Support

Pour toute question ou problème :
- Consulter les logs : `logs/email-worker.log`
- Vérifier la santé : `npm run email:worker:health`
- Contact : support@nourx.fr