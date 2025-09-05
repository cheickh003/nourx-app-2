/* eslint-disable */

exports.up = pgm => {
  pgm.createTable('organization', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    siret: {
      type: 'varchar(20)',
      unique: true
    },
    address: {
      type: 'text'
    },
    contact_email: {
      type: 'citext'
    },
    contact_phone: {
      type: 'varchar(20)'
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

  // Index pour les recherches
  pgm.createIndex('organization', 'name');
  pgm.createIndex('organization', 'siret');
  pgm.createIndex('organization', 'deleted_at');

  // Contrainte de validation pour l'email
  pgm.addConstraint('organization', 'organization_contact_email_format', 
    "CHECK (contact_email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$')");

  // Commentaires pour la documentation
  pgm.sql("COMMENT ON TABLE organization IS 'Table des organisations/entreprises clientes'");
  pgm.sql("COMMENT ON COLUMN organization.siret IS 'Numéro SIRET français ou équivalent RCCM'");
  pgm.sql("COMMENT ON COLUMN organization.deleted_at IS 'Soft delete - date de suppression'");
};

exports.down = pgm => {
  pgm.dropTable('organization');
};