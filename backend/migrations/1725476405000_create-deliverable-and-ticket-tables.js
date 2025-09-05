/* eslint-disable */

exports.up = pgm => {
  // Table deliverable
  pgm.createTable('deliverable', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'project(id)',
      onDelete: 'CASCADE'
    },
    milestone_id: {
      type: 'uuid',
      references: 'milestone(id)',
      onDelete: 'SET NULL'
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    file_path: {
      type: 'varchar(512)',
      notNull: true
    },
    file_name: {
      type: 'varchar(255)',
      notNull: true
    },
    file_size: {
      type: 'bigint',
      notNull: true
    },
    mime_type: {
      type: 'varchar(128)',
      notNull: true
    },
    version: {
      type: 'integer',
      notNull: true,
      default: 1
    },
    status: {
      type: 'deliverable_status',
      notNull: true,
      default: 'pending'
    },
    approval_comment: {
      type: 'text'
    },
    uploaded_by: {
      type: 'uuid',
      notNull: true,
      references: 'user_admin(id)'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Table ticket_category
  pgm.createTable('ticket_category', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    description: {
      type: 'text'
    },
    color: {
      type: 'varchar(7)'
    },
    form_schema: {
      type: 'jsonb'
    },
    sla_response_hours: {
      type: 'integer',
      notNull: true,
      default: 24
    },
    sla_resolution_hours: {
      type: 'integer',
      notNull: true,
      default: 72
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Table ticket
  pgm.createTable('ticket', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    organization_id: {
      type: 'uuid',
      notNull: true,
      references: 'organization(id)',
      onDelete: 'CASCADE'
    },
    category_id: {
      type: 'uuid',
      references: 'ticket_category(id)',
      onDelete: 'SET NULL'
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text',
      notNull: true
    },
    status: {
      type: 'ticket_status',
      notNull: true,
      default: 'open'
    },
    priority: {
      type: 'ticket_priority',
      notNull: true,
      default: 'medium'
    },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'user_client(id)'
    },
    assigned_to: {
      type: 'uuid',
      references: 'user_admin(id)',
      onDelete: 'SET NULL'
    },
    due_date: {
      type: 'timestamptz'
    },
    resolved_at: {
      type: 'timestamptz'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Table ticket_reply
  pgm.createTable('ticket_reply', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    ticket_id: {
      type: 'uuid',
      notNull: true,
      references: 'ticket(id)',
      onDelete: 'CASCADE'
    },
    author_id: {
      type: 'uuid',
      notNull: true
    },
    content: {
      type: 'text',
      notNull: true
    },
    is_internal: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    attachments: {
      type: 'jsonb'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Index pour deliverable
  pgm.createIndex('deliverable', 'project_id');
  pgm.createIndex('deliverable', 'milestone_id');
  pgm.createIndex('deliverable', 'status');
  pgm.createIndex('deliverable', 'uploaded_by');
  pgm.createIndex('deliverable', ['project_id', 'version']);

  // Index pour ticket_category
  pgm.createIndex('ticket_category', 'is_active');

  // Index pour ticket
  pgm.createIndex('ticket', 'organization_id');
  pgm.createIndex('ticket', 'category_id');
  pgm.createIndex('ticket', 'status');
  pgm.createIndex('ticket', 'priority');
  pgm.createIndex('ticket', 'created_by');
  pgm.createIndex('ticket', 'assigned_to');
  pgm.createIndex('ticket', 'created_at');

  // Index pour ticket_reply
  pgm.createIndex('ticket_reply', 'ticket_id');
  pgm.createIndex('ticket_reply', 'author_id');
  pgm.createIndex('ticket_reply', 'created_at');

  // Contraintes
  pgm.addConstraint('deliverable', 'deliverable_file_size_positive',
    'CHECK (file_size > 0)');

  pgm.addConstraint('deliverable', 'deliverable_version_positive',
    'CHECK (version > 0)');

  pgm.addConstraint('ticket_category', 'ticket_category_sla_positive',
    'CHECK (sla_response_hours > 0 AND sla_resolution_hours > 0)');

  pgm.addConstraint('ticket_category', 'ticket_category_color_hex',
    "CHECK (color ~ '^#[0-9A-Fa-f]{6}$')");

  // Commentaires
  pgm.sql("COMMENT ON TABLE deliverable IS 'Fichiers livrables versionnés des projets'");
  pgm.sql("COMMENT ON TABLE ticket_category IS 'Catégories de tickets avec SLA et formulaires dynamiques'");
  pgm.sql("COMMENT ON TABLE ticket IS 'Tickets de support client avec workflow'");
  pgm.sql("COMMENT ON TABLE ticket_reply IS 'Réponses aux tickets, internes ou publiques'");
};

exports.down = pgm => {
  pgm.dropTable('ticket_reply');
  pgm.dropTable('ticket');
  pgm.dropTable('ticket_category');
  pgm.dropTable('deliverable');
};