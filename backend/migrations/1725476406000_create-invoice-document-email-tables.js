/* eslint-disable */

exports.up = pgm => {
  // Table invoice
  pgm.createTable('invoice', {
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
    invoice_number: {
      type: 'varchar(50)',
      notNull: true,
      unique: true
    },
    type: {
      type: 'invoice_type',
      notNull: true,
      default: 'invoice'
    },
    status: {
      type: 'invoice_status',
      notNull: true,
      default: 'draft'
    },
    issue_date: {
      type: 'date',
      notNull: true
    },
    due_date: {
      type: 'date'
    },
    paid_date: {
      type: 'date'
    },
    total_amount: {
      type: 'decimal(10,2)',
      notNull: true
    },
    currency: {
      type: 'char(3)',
      notNull: true,
      default: 'EUR'
    },
    notes: {
      type: 'text'
    },
    created_by: {
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

  // Table invoice_line
  pgm.createTable('invoice_line', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    invoice_id: {
      type: 'uuid',
      notNull: true,
      references: 'invoice(id)',
      onDelete: 'CASCADE'
    },
    description: {
      type: 'varchar(512)',
      notNull: true
    },
    quantity: {
      type: 'decimal(10,3)',
      notNull: true
    },
    unit_price: {
      type: 'decimal(10,2)',
      notNull: true
    },
    total_price: {
      type: 'decimal(10,2)',
      notNull: true
    },
    order_index: {
      type: 'integer',
      notNull: true
    }
  });

  // Table document
  pgm.createTable('document', {
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
    is_shared_with_client: {
      type: 'boolean',
      notNull: true,
      default: false
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
    },
    deleted_at: {
      type: 'timestamptz'
    }
  });

  // Table email_template
  pgm.createTable('email_template', {
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
    subject: {
      type: 'varchar(255)',
      notNull: true
    },
    html_content: {
      type: 'text',
      notNull: true
    },
    text_content: {
      type: 'text'
    },
    variables: {
      type: 'jsonb',
      notNull: true,
      default: '[]'
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
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Table email_outbox
  pgm.createTable('email_outbox', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    template_id: {
      type: 'uuid',
      references: 'email_template(id)',
      onDelete: 'SET NULL'
    },
    to_email: {
      type: 'citext',
      notNull: true
    },
    to_name: {
      type: 'varchar(255)'
    },
    subject: {
      type: 'varchar(255)',
      notNull: true
    },
    html_content: {
      type: 'text',
      notNull: true
    },
    text_content: {
      type: 'text'
    },
    status: {
      type: 'email_status',
      notNull: true,
      default: 'pending'
    },
    attempts: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    last_attempt_at: {
      type: 'timestamptz'
    },
    error_message: {
      type: 'text'
    },
    scheduled_at: {
      type: 'timestamptz'
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Index pour invoice
  pgm.createIndex('invoice', 'organization_id');
  pgm.createIndex('invoice', 'invoice_number');
  pgm.createIndex('invoice', 'type');
  pgm.createIndex('invoice', 'status');
  pgm.createIndex('invoice', 'issue_date');
  pgm.createIndex('invoice', 'due_date');

  // Index pour invoice_line
  pgm.createIndex('invoice_line', 'invoice_id');
  pgm.createIndex('invoice_line', ['invoice_id', 'order_index']);

  // Index pour document
  pgm.createIndex('document', 'organization_id');
  pgm.createIndex('document', 'is_shared_with_client');
  pgm.createIndex('document', 'uploaded_by');
  pgm.createIndex('document', 'deleted_at');

  // Index pour email_template
  pgm.createIndex('email_template', 'is_active');

  // Index pour email_outbox
  pgm.createIndex('email_outbox', 'status');
  pgm.createIndex('email_outbox', 'scheduled_at');
  pgm.createIndex('email_outbox', 'created_at');

  // Contraintes
  pgm.addConstraint('invoice', 'invoice_dates_logical',
    'CHECK (due_date IS NULL OR issue_date <= due_date)');

  pgm.addConstraint('invoice', 'invoice_paid_date_logical',
    'CHECK (paid_date IS NULL OR issue_date <= paid_date)');

  pgm.addConstraint('invoice', 'invoice_total_positive',
    'CHECK (total_amount >= 0)');

  pgm.addConstraint('invoice_line', 'invoice_line_quantity_positive',
    'CHECK (quantity > 0)');

  pgm.addConstraint('invoice_line', 'invoice_line_prices_positive',
    'CHECK (unit_price >= 0 AND total_price >= 0)');

  pgm.addConstraint('document', 'document_file_size_positive',
    'CHECK (file_size > 0)');

  pgm.addConstraint('email_outbox', 'email_outbox_attempts_positive',
    'CHECK (attempts >= 0)');

  // Commentaires
  pgm.sql("COMMENT ON TABLE invoice IS 'Factures, devis et avoirs'");
  pgm.sql("COMMENT ON TABLE invoice_line IS 'Lignes de facturation détaillées'");
  pgm.sql("COMMENT ON TABLE document IS 'Documents partagés avec versioning'");
  pgm.sql("COMMENT ON TABLE email_template IS $$Templates d'e-mails avec variables$$");
  pgm.sql("COMMENT ON TABLE email_outbox IS $$File d'attente des e-mails à envoyer$$");
};

exports.down = pgm => {
  pgm.dropTable('email_outbox');
  pgm.dropTable('email_template');
  pgm.dropTable('document');
  pgm.dropTable('invoice_line');
  pgm.dropTable('invoice');
};
