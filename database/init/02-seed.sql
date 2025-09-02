-- Initial seed data for NOURX application

-- Insert default email templates
INSERT INTO email_templates (key, subject, html_content, text_content, locale, variables) VALUES
('user_activation', 'Activation de votre compte NOURX', 
'<h1>Bienvenue sur NOURX</h1><p>Bonjour {{user_name}},</p><p>Votre compte a été créé. Cliquez sur le lien ci-dessous pour l''activer :</p><p><a href="{{activation_link}}">Activer mon compte</a></p><p>Ce lien expire dans 24 heures.</p><p>Cordialement,<br>L''équipe NOURX</p>',
'Bienvenue sur NOURX\n\nBonjour {{user_name}},\n\nVotre compte a été créé. Utilisez le lien ci-dessous pour l''activer :\n{{activation_link}}\n\nCe lien expire dans 24 heures.\n\nCordialement,\nL''équipe NOURX',
'fr', '{"user_name": "string", "activation_link": "string", "organization_name": "string"}'),

('user_deactivation', 'Désactivation de votre compte NOURX', 
'<h1>Compte désactivé</h1><p>Bonjour {{user_name}},</p><p>Votre compte NOURX a été désactivé.</p><p><strong>Motif :</strong> {{reason}}</p><p>Pour toute question, contactez notre support à {{support_email}}</p><p>Cordialement,<br>L''équipe NOURX</p>',
'Compte désactivé\n\nBonjour {{user_name}},\n\nVotre compte NOURX a été désactivé.\n\nMotif : {{reason}}\n\nPour toute question, contactez notre support à {{support_email}}\n\nCordialement,\nL''équipe NOURX',
'fr', '{"user_name": "string", "reason": "string", "support_email": "string"}'),

('password_reset', 'Réinitialisation de votre mot de passe NOURX',
'<h1>Réinitialisation du mot de passe</h1><p>Bonjour {{user_name}},</p><p>Une demande de réinitialisation de mot de passe a été faite pour votre compte.</p><p><a href="{{reset_link}}">Réinitialiser mon mot de passe</a></p><p>Ce lien expire dans 1 heure.</p><p>Si vous n''avez pas fait cette demande, ignorez cet email.</p><p>Cordialement,<br>L''équipe NOURX</p>',
'Réinitialisation du mot de passe\n\nBonjour {{user_name}},\n\nUne demande de réinitialisation de mot de passe a été faite pour votre compte.\n\nUtilisez ce lien : {{reset_link}}\n\nCe lien expire dans 1 heure.\n\nSi vous n''avez pas fait cette demande, ignorez cet email.\n\nCordialement,\nL''équipe NOURX',
'fr', '{"user_name": "string", "reset_link": "string"}'),

('ticket_created', 'Nouveau ticket créé',
'<h1>Ticket créé</h1><p>Bonjour {{user_name}},</p><p>Votre ticket #{{ticket_number}} a été créé avec succès.</p><p><strong>Sujet :</strong> {{ticket_title}}</p><p><strong>Priorité :</strong> {{ticket_priority}}</p><p>Notre équipe va traiter votre demande dans les meilleurs délais.</p><p><a href="{{ticket_link}}">Voir le ticket</a></p><p>Cordialement,<br>L''équipe NOURX</p>',
'Ticket créé\n\nBonjour {{user_name}},\n\nVotre ticket #{{ticket_number}} a été créé avec succès.\n\nSujet : {{ticket_title}}\nPriorité : {{ticket_priority}}\n\nNotre équipe va traiter votre demande dans les meilleurs délais.\n\nVoir le ticket : {{ticket_link}}\n\nCordialement,\nL''équipe NOURX',
'fr', '{"user_name": "string", "ticket_number": "string", "ticket_title": "string", "ticket_priority": "string", "ticket_link": "string"}'),

('ticket_updated', 'Mise à jour de votre ticket',
'<h1>Ticket mis à jour</h1><p>Bonjour {{user_name}},</p><p>Votre ticket #{{ticket_number}} a été mis à jour.</p><p><strong>Nouveau statut :</strong> {{ticket_status}}</p><p>{{update_message}}</p><p><a href="{{ticket_link}}">Voir le ticket</a></p><p>Cordialement,<br>L''équipe NOURX</p>',
'Ticket mis à jour\n\nBonjour {{user_name}},\n\nVotre ticket #{{ticket_number}} a été mis à jour.\n\nNouveau statut : {{ticket_status}}\n\n{{update_message}}\n\nVoir le ticket : {{ticket_link}}\n\nCordialement,\nL''équipe NOURX',
'fr', '{"user_name": "string", "ticket_number": "string", "ticket_status": "string", "update_message": "string", "ticket_link": "string"}'),

('invoice_sent', 'Nouvelle facture disponible',
'<h1>Nouvelle facture</h1><p>Bonjour {{user_name}},</p><p>Une nouvelle facture est disponible pour votre organisation.</p><p><strong>Numéro :</strong> {{invoice_number}}</p><p><strong>Montant :</strong> {{invoice_amount}} {{currency}}</p><p><strong>Échéance :</strong> {{due_date}}</p><p><a href="{{invoice_link}}">Voir la facture</a></p><p>{{payment_link_html}}</p><p>Cordialement,<br>L''équipe NOURX</p>',
'Nouvelle facture\n\nBonjour {{user_name}},\n\nUne nouvelle facture est disponible pour votre organisation.\n\nNuméro : {{invoice_number}}\nMontant : {{invoice_amount}} {{currency}}\nÉchéance : {{due_date}}\n\nVoir la facture : {{invoice_link}}\n{{payment_link_text}}\n\nCordialement,\nL''équipe NOURX',
'fr', '{"user_name": "string", "invoice_number": "string", "invoice_amount": "string", "currency": "string", "due_date": "string", "invoice_link": "string", "payment_link_html": "string", "payment_link_text": "string"}');

-- Insert default admin user (password: admin123 - should be changed immediately)
-- Password hash for 'admin123' using bcrypt with salt rounds 12
INSERT INTO user_admin (email, password_hash, role, active) VALUES
('admin@nourx.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBUrA/mNKkLnhOu', 'admin', true);

-- Insert sample organization for testing
INSERT INTO organizations (name, rc_or_rccm, address, billing_email) VALUES
('NOURX Demo Client', 'RC123456', '123 Rue de la Demo, 75001 Paris, France', 'billing@democlient.com');

-- Get the organization ID for the demo client
DO $$
DECLARE
    demo_org_id UUID;
BEGIN
    SELECT id INTO demo_org_id FROM organizations WHERE name = 'NOURX Demo Client';
    
    -- Insert sample client user for testing
    INSERT INTO user_client (organization_id, email, password_hash, role, active) VALUES
    (demo_org_id, 'client@democlient.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewBUrA/mNKkLnhOu', 'owner', true);
END $$;