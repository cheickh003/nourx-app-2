import pkg from 'pg';
const { Pool } = pkg;
import winston from 'winston';
import { z } from 'zod';

// Validation schemas
const templateSchema = z.object({
  key: z.string().min(1, 'Template key is required'),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().min(1, 'Text content is required'),
  locale: z.string().default('fr'),
  variables: z.object({}).optional()
});

// Template variables validation
const templateVariables = {
  user_invitation: ['userEmail', 'organizationName', 'activationLink', 'expiresAt', 'supportEmail'],
  password_reset: ['userEmail', 'resetLink', 'expiresAt', 'supportEmail'],
  account_activation: ['userName', 'userEmail', 'organizationName', 'loginLink', 'supportEmail'],
  security_alert: ['userEmail', 'alertType', 'details', 'timestamp', 'supportEmail'],
  admin_notification: ['subject', 'message', 'timestamp'],
  welcome: ['userName', 'organizationName', 'loginLink', 'supportEmail']
};

class EmailTemplateService {
  constructor(pool, logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
  })) {
    this.pool = pool;
    this.logger = logger;
  }

  /**
   * Initialize default email templates
   */
  async initializeDefaultTemplates() {
    const defaultTemplates = this.getDefaultTemplates();
    
    for (const template of defaultTemplates) {
      try {
        await this.createOrUpdateTemplate(template);
        this.logger.info(`Template initialized: ${template.key}`);
      } catch (error) {
        this.logger.error(`Failed to initialize template ${template.key}:`, error);
      }
    }
  }

  /**
   * Create or update email template
   */
  async createOrUpdateTemplate(templateData) {
    try {
      const validatedData = templateSchema.parse(templateData);
      
      const query = `
        INSERT INTO email_templates (key, subject, html_content, text_content, locale, variables)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (key, locale) 
        DO UPDATE SET
          subject = EXCLUDED.subject,
          html_content = EXCLUDED.html_content,
          text_content = EXCLUDED.text_content,
          variables = EXCLUDED.variables,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const values = [
        validatedData.key,
        validatedData.subject,
        validatedData.htmlContent,
        validatedData.textContent,
        validatedData.locale,
        JSON.stringify(validatedData.variables || {})
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0].id;

    } catch (error) {
      this.logger.error('Failed to create/update template:', error);
      throw error;
    }
  }

  /**
   * Get template by key and locale
   */
  async getTemplate(key, locale = 'fr') {
    try {
      const query = `
        SELECT id, key, subject, html_content, text_content, locale, variables, created_at, updated_at
        FROM email_templates 
        WHERE key = $1 AND locale = $2
      `;
      
      const result = await this.pool.query(query, [key, locale]);
      return result.rows[0] || null;

    } catch (error) {
      this.logger.error('Failed to get template:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  async getAllTemplates() {
    try {
      const query = `
        SELECT id, key, subject, html_content, text_content, locale, variables, created_at, updated_at
        FROM email_templates 
        ORDER BY key, locale
      `;
      
      const result = await this.pool.query(query);
      return result.rows;

    } catch (error) {
      this.logger.error('Failed to get all templates:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(key, locale = 'fr') {
    try {
      const query = 'DELETE FROM email_templates WHERE key = $1 AND locale = $2 RETURNING id';
      const result = await this.pool.query(query, [key, locale]);
      
      return result.rowCount > 0;

    } catch (error) {
      this.logger.error('Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(key, content) {
    const expectedVars = templateVariables[key] || [];
    const usedVars = this.extractTemplateVariables(content);
    
    const missing = expectedVars.filter(v => !usedVars.includes(v));
    const extra = usedVars.filter(v => !expectedVars.includes(v));
    
    return {
      valid: missing.length === 0,
      missing,
      extra,
      expectedVars,
      usedVars
    };
  }

  /**
   * Extract template variables from content
   */
  extractTemplateVariables(content) {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
  }

  /**
   * Get default email templates
   */
  getDefaultTemplates() {
    return [
      // User Invitation Template
      {
        key: 'user_invitation',
        subject: 'Invitation à rejoindre {{organizationName}} sur NOURX',
        locale: 'fr',
        htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation NOURX</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .tagline {
            color: #666;
            font-size: 14px;
        }
        .content {
            margin-bottom: 30px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
        }
        .security-note {
            background-color: #fef3cd;
            border: 1px solid #fbbf24;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">NOURX</div>
            <div class="tagline">Votre plateforme de gestion client</div>
        </div>
        
        <div class="content">
            <h2>Vous êtes invité(e) à rejoindre {{organizationName}}</h2>
            
            <p>Bonjour,</p>
            
            <p>Vous avez été invité(e) à rejoindre <strong>{{organizationName}}</strong> sur la plateforme NOURX. Cette invitation vous permettra d'accéder au portail client et de collaborer efficacement avec l'équipe.</p>
            
            <div class="info-box">
                <h3>Que pouvez-vous faire avec NOURX ?</h3>
                <ul>
                    <li>📊 Suivre l'avancement de vos projets en temps réel</li>
                    <li>📁 Accéder aux livrables et documents</li>
                    <li>💬 Communiquer directement avec l'équipe</li>
                    <li>📋 Gérer les tickets de support</li>
                    <li>📄 Consulter vos factures et documents</li>
                </ul>
            </div>
            
            <p>Pour activer votre compte, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
                <a href="{{activationLink}}" class="cta-button">Activer mon compte</a>
            </div>
            
            <div class="security-note">
                <strong>⚠️ Important :</strong> Ce lien d'activation expire le <strong>{{expiresAt}}</strong>. Si vous ne l'utilisez pas avant cette date, vous devrez demander une nouvelle invitation.
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{activationLink}}</p>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé à <strong>{{userEmail}}</strong></p>
            <p>Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
            <p>Besoin d'aide ? Contactez-nous : <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
            <p>© 2024 NOURX. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`,
        textContent: `NOURX - Invitation à rejoindre {{organizationName}}

Bonjour,

Vous avez été invité(e) à rejoindre {{organizationName}} sur la plateforme NOURX.

Pour activer votre compte, cliquez sur ce lien :
{{activationLink}}

Ce lien expire le {{expiresAt}}.

Avec NOURX, vous pourrez :
- Suivre l'avancement de vos projets
- Accéder aux livrables et documents  
- Communiquer avec l'équipe
- Gérer vos tickets de support
- Consulter vos factures

Si vous n'attendiez pas cette invitation, ignorez cet email.

Besoin d'aide ? Contactez-nous : {{supportEmail}}

© 2024 NOURX`
      },

      // Password Reset Template
      {
        key: 'password_reset',
        subject: 'Réinitialisation de votre mot de passe NOURX',
        locale: 'fr',
        htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation mot de passe NOURX</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .cta-button {
            display: inline-block;
            background-color: #dc2626;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .security-note {
            background-color: #fef3cd;
            border: 1px solid #fbbf24;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">NOURX</div>
            <div style="color: #dc2626;">🔐 Réinitialisation de mot de passe</div>
        </div>
        
        <div class="content">
            <h2>Demande de réinitialisation de mot de passe</h2>
            
            <p>Bonjour,</p>
            
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte NOURX associé à l'adresse email : <strong>{{userEmail}}</strong></p>
            
            <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
                <a href="{{resetLink}}" class="cta-button">Réinitialiser mon mot de passe</a>
            </div>
            
            <div class="security-note">
                <strong>⚠️ Important :</strong> Ce lien expire à <strong>{{expiresAt}}</strong> pour des raisons de sécurité. Si vous ne l'utilisez pas avant cette heure, vous devrez refaire une demande.
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">{{resetLink}}</p>
            
            <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <strong>🛡️ Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.
            </div>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé à <strong>{{userEmail}}</strong></p>
            <p>Besoin d'aide ? Contactez-nous : <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
            <p>© 2024 NOURX. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`,
        textContent: `NOURX - Réinitialisation de mot de passe

Bonjour,

Nous avons reçu une demande de réinitialisation de mot de passe pour {{userEmail}}.

Pour créer un nouveau mot de passe, utilisez ce lien :
{{resetLink}}

Ce lien expire à {{expiresAt}} pour des raisons de sécurité.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Besoin d'aide ? Contactez-nous : {{supportEmail}}

© 2024 NOURX`
      },

      // Account Activation Template  
      {
        key: 'account_activation',
        subject: 'Bienvenue sur NOURX, {{userName}} !',
        locale: 'fr',
        htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur NOURX</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .welcome-banner {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            text-align: center;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #16a34a;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .feature-list {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">NOURX</div>
        </div>
        
        <div class="welcome-banner">
            <h1>🎉 Bienvenue {{userName}} !</h1>
            <p>Votre compte a été activé avec succès</p>
        </div>
        
        <div class="content">
            <p>Félicitations ! Votre compte NOURX pour <strong>{{organizationName}}</strong> est maintenant actif.</p>
            
            <p>Vous pouvez dès maintenant vous connecter à votre portail client pour :</p>
            
            <div class="feature-list">
                <h3>🚀 Fonctionnalités disponibles</h3>
                <ul>
                    <li><strong>📊 Tableau de bord</strong> - Vue d'ensemble de vos projets</li>
                    <li><strong>📁 Gestion de projets</strong> - Suivi détaillé et jalons</li>
                    <li><strong>📎 Livrables</strong> - Téléchargement et validation</li>
                    <li><strong>💬 Support</strong> - Système de tickets intégré</li>
                    <li><strong>📄 Facturation</strong> - Consultation et téléchargement</li>
                    <li><strong>📋 Documents</strong> - Bibliothèque centralisée</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="{{loginLink}}" class="cta-button">Accéder à mon portail</a>
            </div>
            
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3>💡 Premiers pas recommandés</h3>
                <ol>
                    <li>Explorez votre tableau de bord</li>
                    <li>Consultez les projets en cours</li>
                    <li>Vérifiez vos informations de profil</li>
                    <li>Parcourez les documents disponibles</li>
                </ol>
            </div>
        </div>
        
        <div class="footer">
            <p>Connectez-vous avec : <strong>{{userEmail}}</strong></p>
            <p>Besoin d'aide pour débuter ? Contactez-nous : <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
            <p>© 2024 NOURX. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`,
        textContent: `NOURX - Bienvenue {{userName}} !

Félicitations ! Votre compte NOURX pour {{organizationName}} est maintenant actif.

Connectez-vous à votre portail client :
{{loginLink}}

Fonctionnalités disponibles :
- Tableau de bord des projets
- Gestion des livrables
- Système de support
- Consultation des factures
- Bibliothèque de documents

Premiers pas recommandés :
1. Explorez votre tableau de bord
2. Consultez les projets en cours  
3. Vérifiez votre profil
4. Parcourez les documents

Connectez-vous avec : {{userEmail}}

Besoin d'aide ? Contactez-nous : {{supportEmail}}

© 2024 NOURX`
      },

      // Security Alert Template
      {
        key: 'security_alert',
        subject: 'Alerte de sécurité NOURX',
        locale: 'fr',
        htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerte de sécurité NOURX</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .alert-header {
            background-color: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
        }
        .alert-icon {
            font-size: 48px;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .details-box {
            background-color: #f9fafb;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="alert-header">
            <div class="alert-icon">🚨</div>
            <h1 style="color: #dc2626; margin: 0;">Alerte de sécurité</h1>
            <p style="margin: 10px 0 0 0; color: #7f1d1d;">Activité suspecte détectée sur votre compte</p>
        </div>
        
        <div class="content">
            <p>Bonjour,</p>
            
            <p>Nous avons détecté une activité inhabituelle sur votre compte NOURX (<strong>{{userEmail}}</strong>).</p>
            
            <div class="details-box">
                <h3>🔍 Détails de l'alerte</h3>
                <p><strong>Type d'alerte :</strong> {{alertType}}</p>
                <p><strong>Détails :</strong> {{details}}</p>
                <p><strong>Date et heure :</strong> {{timestamp}}</p>
            </div>
            
            <div style="background-color: #fef3cd; border: 1px solid #fbbf24; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <h3>🛡️ Actions recommandées</h3>
                <ul>
                    <li>Vérifiez l'activité récente de votre compte</li>
                    <li>Changez votre mot de passe immédiatement</li>
                    <li>Activez l'authentification à deux facteurs si disponible</li>
                    <li>Vérifiez que personne d'autre n'a accès à votre compte</li>
                </ul>
            </div>
            
            <p><strong>Si cette activité vous semble normale</strong>, vous pouvez ignorer cet email. Sinon, contactez immédiatement notre équipe de sécurité.</p>
        </div>
        
        <div class="footer">
            <p style="color: #dc2626;"><strong>⚠️ N'ignorez jamais les alertes de sécurité</strong></p>
            <p>Contact sécurité urgent : <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
            <p>© 2024 NOURX. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`,
        textContent: `NOURX - Alerte de sécurité

🚨 ALERTE DE SÉCURITÉ 🚨

Activité suspecte détectée sur votre compte {{userEmail}}.

Détails :
- Type : {{alertType}}
- Détails : {{details}}
- Date : {{timestamp}}

Actions recommandées :
- Vérifiez votre activité récente
- Changez votre mot de passe
- Activez l'authentification 2FA
- Vérifiez l'accès à votre compte

Si cette activité ne vous concerne pas, contactez immédiatement :
{{supportEmail}}

© 2024 NOURX`
      },

      // Admin Notification Template
      {
        key: 'admin_notification',
        subject: '[NOURX Admin] {{subject}}',
        locale: 'fr',
        htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification Admin NOURX</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .admin-header {
            background-color: #1f2937;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }
        .message-box {
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="admin-header">
            <h1>⚡ NOURX Admin</h1>
            <p>Notification système</p>
        </div>
        
        <div class="content">
            <h2>{{subject}}</h2>
            
            <div class="message-box">
                {{message}}
            </div>
            
            <p><strong>Date :</strong> {{timestamp}}</p>
        </div>
        
        <div class="footer">
            <p>Notification automatique du système NOURX</p>
            <p>© 2024 NOURX Admin</p>
        </div>
    </div>
</body>
</html>`,
        textContent: `NOURX Admin - {{subject}}

{{message}}

Date: {{timestamp}}

---
Notification automatique du système NOURX
© 2024 NOURX`
      }
    ];
  }

  /**
   * Validate template content for XSS and other security issues
   */
  validateTemplateContent(content) {
    // Basic XSS prevention - check for suspicious patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<embed\b/gi,
      /<object\b/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          valid: false,
          error: 'Template contains potentially dangerous content'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(key, locale = 'fr', sampleData = {}) {
    try {
      const template = await this.getTemplate(key, locale);
      if (!template) {
        throw new Error('Template not found');
      }

      // Get default sample data for template type
      const defaultData = this.getDefaultSampleData(key);
      const mergedData = { ...defaultData, ...sampleData };

      // Render template
      const rendered = this.renderTemplateContent(template, mergedData);
      
      return {
        template: template,
        sampleData: mergedData,
        rendered: rendered
      };

    } catch (error) {
      this.logger.error('Failed to preview template:', error);
      throw error;
    }
  }

  /**
   * Render template content with data
   */
  renderTemplateContent(template, data) {
    const renderContent = (content) => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    };

    return {
      subject: renderContent(template.subject),
      html: renderContent(template.html_content),
      text: renderContent(template.text_content)
    };
  }

  /**
   * Get default sample data for template types
   */
  getDefaultSampleData(key) {
    const sampleData = {
      user_invitation: {
        userEmail: 'utilisateur@exemple.com',
        organizationName: 'Exemple Corp',
        activationLink: 'https://app.nourx.fr/activate?token=example',
        expiresAt: '15/12/2024',
        supportEmail: 'support@nourx.fr'
      },
      password_reset: {
        userEmail: 'utilisateur@exemple.com',
        resetLink: 'https://app.nourx.fr/reset-password?token=example',
        expiresAt: '14:30',
        supportEmail: 'support@nourx.fr'
      },
      account_activation: {
        userName: 'Jean Dupont',
        userEmail: 'jean.dupont@exemple.com',
        organizationName: 'Exemple Corp',
        loginLink: 'https://app.nourx.fr/login',
        supportEmail: 'support@nourx.fr'
      },
      security_alert: {
        userEmail: 'utilisateur@exemple.com',
        alertType: 'Connexion suspecte',
        details: 'Connexion depuis une nouvelle adresse IP',
        timestamp: '15/12/2024 à 14:30',
        supportEmail: 'support@nourx.fr'
      },
      admin_notification: {
        subject: 'Nouveau compte créé',
        message: 'Un nouveau compte utilisateur a été créé pour Exemple Corp.',
        timestamp: '15/12/2024 à 14:30'
      }
    };

    return sampleData[key] || {};
  }
}

export default EmailTemplateService;