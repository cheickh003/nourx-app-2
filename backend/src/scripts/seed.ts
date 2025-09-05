import { config } from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5434'),
  user: process.env.POSTGRES_USER || 'nourx',
  password: process.env.POSTGRES_PASSWORD || 'nourx_dev_password',
  database: process.env.POSTGRES_DB || 'nourx_app',
});

async function seedDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Démarrage du seeding de la base de données...');

    // 1. Créer l'admin par défaut
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@nourx.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'SecurePassword123!';
    const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin NOURX';

    console.log('👤 Création de l\'utilisateur admin par défaut...');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await client.query(
      'SELECT id FROM user_admin WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✅ L\'utilisateur admin existe déjà');
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await client.query(`
        INSERT INTO user_admin (email, password_hash, name, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [adminEmail, hashedPassword, adminName, 'admin', true]);

      console.log(`✅ Utilisateur admin créé: ${adminEmail}`);
    }

    // 2. Créer les catégories de tickets par défaut
    console.log('🎫 Création des catégories de tickets par défaut...');

    const ticketCategories = [
      {
        name: 'Support Technique',
        description: 'Problèmes techniques, bugs et dysfonctionnements',
        color: '#dc2626',
        sla_response: 4,
        sla_resolution: 24,
        form_schema: {
          fields: [
            { name: 'severity', type: 'select', label: 'Sévérité', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
            { name: 'browser', type: 'text', label: 'Navigateur utilisé', required: false },
            { name: 'steps', type: 'textarea', label: 'Étapes pour reproduire', required: true }
          ]
        }
      },
      {
        name: 'Demande de Fonctionnalité',
        description: 'Nouvelles fonctionnalités et améliorations',
        color: '#2563eb',
        sla_response: 8,
        sla_resolution: 72,
        form_schema: {
          fields: [
            { name: 'priority', type: 'select', label: 'Priorité', options: ['Low', 'Medium', 'High'], required: true },
            { name: 'use_case', type: 'textarea', label: 'Cas d\'usage', required: true },
            { name: 'mockup', type: 'file', label: 'Maquette/Schéma', required: false }
          ]
        }
      },
      {
        name: 'Facturation',
        description: 'Questions sur les factures, paiements et contrats',
        color: '#059669',
        sla_response: 24,
        sla_resolution: 48,
        form_schema: {
          fields: [
            { name: 'invoice_number', type: 'text', label: 'Numéro de facture', required: false },
            { name: 'amount', type: 'number', label: 'Montant concerné', required: false }
          ]
        }
      },
      {
        name: 'Général',
        description: 'Questions générales et autres demandes',
        color: '#6b7280',
        sla_response: 8,
        sla_resolution: 48,
        form_schema: {
          fields: []
        }
      }
    ];

    for (const category of ticketCategories) {
      const existing = await client.query(
        'SELECT id FROM ticket_category WHERE name = $1',
        [category.name]
      );

      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO ticket_category (name, description, color, sla_response_hours, sla_resolution_hours, form_schema)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          category.name,
          category.description,
          category.color,
          category.sla_response,
          category.sla_resolution,
          JSON.stringify(category.form_schema)
        ]);

        console.log(`✅ Catégorie créée: ${category.name}`);
      }
    }

    // 3. Créer les templates d'e-mails par défaut
    console.log('📧 Création des templates d\'e-mails par défaut...');

    const emailTemplates = [
      {
        name: 'activate_account',
        subject: 'Activez votre compte Nourx',
        html_content: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Activation de compte</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Bienvenue sur Nourx</h1>
            <p>Bonjour {{user_name}},</p>
            <p>Votre compte a été créé avec succès. Pour l'activer, cliquez sur le lien ci-dessous :</p>
            <p><a href="{{activation_link}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Activer mon compte</a></p>
            <p>Ce lien expire dans 24 heures.</p>
            <p>Cordialement,<br>L'équipe Nourx</p>
          </body>
          </html>
        `,
        text_content: `
          Bienvenue sur Nourx
          
          Bonjour {{user_name}},
          
          Votre compte a été créé avec succès. Pour l'activer, suivez ce lien : {{activation_link}}
          
          Ce lien expire dans 24 heures.
          
          Cordialement,
          L'équipe Nourx
        `,
        variables: ['user_name', 'activation_link']
      },
      {
        name: 'deactivate_account',
        subject: 'Votre compte a été désactivé',
        html_content: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Compte désactivé</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Compte désactivé</h1>
            <p>Bonjour {{user_name}},</p>
            <p>Votre compte a été désactivé pour la raison suivante :</p>
            <blockquote style="background: #f3f4f6; padding: 16px; margin: 20px 0; border-left: 4px solid #dc2626;">
              {{reason}}
            </blockquote>
            <p>Pour plus d'informations, contactez notre support.</p>
            <p>Cordialement,<br>L'équipe Nourx</p>
          </body>
          </html>
        `,
        text_content: `
          Compte désactivé
          
          Bonjour {{user_name}},
          
          Votre compte a été désactivé pour la raison suivante : {{reason}}
          
          Pour plus d'informations, contactez notre support.
          
          Cordialement,
          L'équipe Nourx
        `,
        variables: ['user_name', 'reason']
      },
      {
        name: 'reset_password',
        subject: 'Réinitialisation de votre mot de passe',
        html_content: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Réinitialisation mot de passe</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Réinitialisation de mot de passe</h1>
            <p>Bonjour {{user_name}},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
            <p><a href="{{reset_link}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Réinitialiser mon mot de passe</a></p>
            <p>Ce lien expire dans 1 heure.</p>
            <p>Si vous n'avez pas fait cette demande, ignorez ce message.</p>
            <p>Cordialement,<br>L'équipe Nourx</p>
          </body>
          </html>
        `,
        text_content: `
          Réinitialisation de mot de passe
          
          Bonjour {{user_name}},
          
          Vous avez demandé à réinitialiser votre mot de passe. Suivez ce lien : {{reset_link}}
          
          Ce lien expire dans 1 heure.
          
          Si vous n'avez pas fait cette demande, ignorez ce message.
          
          Cordialement,
          L'équipe Nourx
        `,
        variables: ['user_name', 'reset_link']
      },
      {
        name: 'ticket_status_update',
        subject: 'Mise à jour de votre ticket #{{ticket_id}}',
        html_content: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Mise à jour ticket</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Mise à jour de ticket</h1>
            <p>Bonjour {{user_name}},</p>
            <p>Votre ticket <strong>#{{ticket_id}} - {{ticket_title}}</strong> a été mis à jour.</p>
            <p><strong>Nouveau statut :</strong> {{new_status}}</p>
            {{#if message}}
            <p><strong>Message :</strong></p>
            <blockquote style="background: #f3f4f6; padding: 16px; margin: 20px 0; border-left: 4px solid #2563eb;">
              {{message}}
            </blockquote>
            {{/if}}
            <p><a href="{{ticket_link}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Voir le ticket</a></p>
            <p>Cordialement,<br>L'équipe Nourx</p>
          </body>
          </html>
        `,
        text_content: `
          Mise à jour de ticket
          
          Bonjour {{user_name}},
          
          Votre ticket #{{ticket_id}} - {{ticket_title}} a été mis à jour.
          
          Nouveau statut : {{new_status}}
          
          {{#if message}}
          Message : {{message}}
          {{/if}}
          
          Voir le ticket : {{ticket_link}}
          
          Cordialement,
          L'équipe Nourx
        `,
        variables: ['user_name', 'ticket_id', 'ticket_title', 'new_status', 'message', 'ticket_link']
      }
    ];

    for (const template of emailTemplates) {
      const existing = await client.query(
        'SELECT id FROM email_template WHERE name = $1',
        [template.name]
      );

      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO email_template (name, subject, html_content, text_content, variables)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          template.name,
          template.subject,
          template.html_content,
          template.text_content,
          JSON.stringify(template.variables)
        ]);

        console.log(`✅ Template créé: ${template.name}`);
      }
    }

    console.log('🎉 Seeding terminé avec succès !');
    console.log('');
    console.log('🔐 Informations de connexion admin :');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Mot de passe: ${adminPassword}`);
    console.log('');
    console.log('⚠️  N\'oubliez pas de changer le mot de passe par défaut !');

  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Erreur fatale :', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
