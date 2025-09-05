/* eslint-disable */

exports.up = pgm => {
  pgm.createTable('user_client', {
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
    email: {
      type: 'citext',
      notNull: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    role: {
      type: 'client_role',
      notNull: true,
      default: 'reader'
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    activation_token: {
      type: 'varchar(255)'
    },
    activation_expires_at: {
      type: 'timestamptz'
    },
    reset_password_token: {
      type: 'varchar(255)'
    },
    reset_password_expires_at: {
      type: 'timestamptz'
    },
    disabled_reason: {
      type: 'text'
    },
    last_login_at: {
      type: 'timestamptz'
    },
    failed_login_attempts: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    locked_until: {
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
    },
    deleted_at: {
      type: 'timestamptz'
    }
  });

  // Index pour les recherches et la performance
  pgm.createIndex('user_client', 'email');
  pgm.createIndex('user_client', 'organization_id');
  pgm.createIndex('user_client', 'role');
  pgm.createIndex('user_client', 'is_active');
  pgm.createIndex('user_client', 'activation_token');
  pgm.createIndex('user_client', 'reset_password_token');
  pgm.createIndex('user_client', 'deleted_at');

  // Contrainte unique combinée (email unique par organisation)
  pgm.addConstraint('user_client', 'user_client_email_organization_unique',
    'UNIQUE (email, organization_id)');

  // Contraintes de validation
  pgm.addConstraint('user_client', 'user_client_email_format',
    "CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$')");

  pgm.addConstraint('user_client', 'user_client_failed_attempts_positive',
    'CHECK (failed_login_attempts >= 0)');

  // Commentaires
  pgm.sql("COMMENT ON TABLE user_client IS 'Utilisateurs clients liés aux organisations'");
  pgm.sql("COMMENT ON COLUMN user_client.activation_token IS 'Token pour activation du compte lors de la création'");
  pgm.sql("COMMENT ON COLUMN user_client.disabled_reason IS 'Motif de désactivation du compte, requis pour audit'");
  pgm.sql("COMMENT ON COLUMN user_client.deleted_at IS 'Soft delete - date de suppression'");
};

exports.down = pgm => {
  pgm.dropTable('user_client');
};