/* eslint-disable */

exports.up = pgm => {
  pgm.createTable('user_admin', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    email: {
      type: 'citext',
      notNull: true,
      unique: true
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
      type: 'admin_role',
      notNull: true,
      default: 'agent'
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true
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
    }
  });

  // Index pour les recherches et la performance
  pgm.createIndex('user_admin', 'email');
  pgm.createIndex('user_admin', 'role');
  pgm.createIndex('user_admin', 'is_active');
  pgm.createIndex('user_admin', 'locked_until');

  // Contraintes de validation
  pgm.addConstraint('user_admin', 'user_admin_email_format',
    "CHECK (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$')");
  
  pgm.addConstraint('user_admin', 'user_admin_failed_attempts_positive',
    'CHECK (failed_login_attempts >= 0)');

  // Commentaires
  pgm.sql("COMMENT ON TABLE user_admin IS 'Utilisateurs internes NOURX avec différents rôles'");
  pgm.sql("COMMENT ON COLUMN user_admin.password_hash IS 'Hash bcrypt du mot de passe'");
  pgm.sql("COMMENT ON COLUMN user_admin.failed_login_attempts IS 'Compteur de tentatives de connexion échouées'");
  pgm.sql("COMMENT ON COLUMN user_admin.locked_until IS 'Date de fin de verrouillage du compte'");
};

exports.down = pgm => {
  pgm.dropTable('user_admin');
};