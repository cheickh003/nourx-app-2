/* eslint-disable */

exports.up = pgm => {
  // Table audit_log
  pgm.createTable('audit_log', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    actor_type: {
      type: 'actor_type',
      notNull: true
    },
    actor_id: {
      type: 'uuid',
      notNull: true
    },
    action: {
      type: 'varchar(100)',
      notNull: true
    },
    resource_type: {
      type: 'varchar(100)',
      notNull: true
    },
    resource_id: {
      type: 'uuid'
    },
    details_json: {
      type: 'jsonb'
    },
    ip_address: {
      type: 'inet'
    },
    user_agent: {
      type: 'text'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Table system_settings
  pgm.createTable('system_settings', {
    key: {
      type: 'varchar(100)',
      primaryKey: true
    },
    value: {
      type: 'text',
      notNull: true
    },
    description: {
      type: 'text'
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Index pour audit_log (critiques pour la performance des recherches)
  pgm.createIndex('audit_log', 'actor_type');
  pgm.createIndex('audit_log', 'actor_id');
  pgm.createIndex('audit_log', 'action');
  pgm.createIndex('audit_log', 'resource_type');
  pgm.createIndex('audit_log', 'resource_id');
  pgm.createIndex('audit_log', 'created_at');
  pgm.createIndex('audit_log', ['actor_type', 'actor_id']);
  pgm.createIndex('audit_log', ['resource_type', 'resource_id']);

  // Index pour system_settings
  pgm.createIndex('system_settings', 'key');

  // Vue pour faciliter les requêtes d'audit avec détails des acteurs
  pgm.createView('audit_log_with_actors', {}, `
    SELECT 
      al.*,
      CASE 
        WHEN al.actor_type = 'admin' THEN ua.name
        WHEN al.actor_type = 'client' THEN uc.name
        ELSE 'Unknown'
      END as actor_name,
      CASE 
        WHEN al.actor_type = 'admin' THEN ua.email
        WHEN al.actor_type = 'client' THEN uc.email
        ELSE NULL
      END as actor_email,
      CASE 
        WHEN al.actor_type = 'client' THEN o.name
        ELSE NULL
      END as organization_name
    FROM audit_log al
    LEFT JOIN user_admin ua ON al.actor_type = 'admin' AND al.actor_id = ua.id
    LEFT JOIN user_client uc ON al.actor_type = 'client' AND al.actor_id = uc.id
    LEFT JOIN organization o ON uc.organization_id = o.id
  `);

  // Insertion des paramètres système par défaut
  pgm.sql(`
    INSERT INTO system_settings (key, value, description) VALUES 
    ('app.version', '1.0.0', 'Version de l''application'),
    ('app.maintenance_mode', 'false', 'Mode maintenance activé/désactivé'),
    ('security.max_login_attempts', '5', 'Nombre maximum de tentatives de connexion échouées'),
    ('security.lockout_duration_minutes', '30', 'Durée de verrouillage en minutes après échec de connexion'),
    ('security.password_min_length', '8', 'Longueur minimum des mots de passe'),
    ('security.password_require_special_chars', 'true', 'Exiger des caractères spéciaux dans les mots de passe'),
    ('email.from_name', 'Nourx Support', 'Nom d''expéditeur par défaut des e-mails'),
    ('email.max_retry_attempts', '3', 'Nombre maximum de tentatives d''envoi d''e-mail'),
    ('sla.default_response_hours', '8', 'SLA par défaut pour la première réponse (heures)'),
    ('sla.default_resolution_hours', '48', 'SLA par défaut pour la résolution (heures)'),
    ('upload.max_file_size_mb', '10', 'Taille maximum des fichiers uploadés (MB)'),
    ('upload.allowed_mime_types', '["image/jpeg","image/png","image/gif","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 'Types MIME autorisés pour les uploads')
  `);

  // Fonction pour mettre à jour automatiquement updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Triggers pour updated_at sur toutes les tables qui en ont besoin
  const tablesWithUpdatedAt = [
    'organization', 'user_admin', 'user_client', 'project', 'milestone', 'task', 
    'deliverable', 'ticket', 'invoice', 'document', 'email_template', 'system_settings'
  ];

  tablesWithUpdatedAt.forEach(table => {
    pgm.createTrigger(table, 'update_updated_at_trigger', {
      when: 'BEFORE',
      operation: 'UPDATE',
      function: 'update_updated_at_column',
      level: 'ROW'
    });
  });

  // Commentaires
  pgm.sql("COMMENT ON TABLE audit_log IS 'Journal d''audit de toutes les actions sensibles'");
  pgm.sql("COMMENT ON TABLE system_settings IS 'Paramètres de configuration système'");
  pgm.sql("COMMENT ON VIEW audit_log_with_actors IS 'Vue enrichie du journal d''audit avec informations des acteurs'");
};

exports.down = pgm => {
  // Supprimer les triggers
  const tablesWithUpdatedAt = [
    'organization', 'user_admin', 'user_client', 'project', 'milestone', 'task', 
    'deliverable', 'ticket', 'invoice', 'document', 'email_template', 'system_settings'
  ];

  tablesWithUpdatedAt.forEach(table => {
    pgm.dropTrigger(table, 'update_updated_at_trigger', { ifExists: true });
  });

  // Supprimer la fonction
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column()');

  // Supprimer les tables
  pgm.dropView('audit_log_with_actors');
  pgm.dropTable('system_settings');
  pgm.dropTable('audit_log');
};