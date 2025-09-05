/* eslint-disable */

exports.up = pgm => {
  // Table project
  pgm.createTable('project', {
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
    status: {
      type: 'project_status',
      notNull: true,
      default: 'draft'
    },
    start_date: {
      type: 'date'
    },
    end_date: {
      type: 'date'
    },
    visible_to_client: {
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

  // Table milestone
  pgm.createTable('milestone', {
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
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    due_date: {
      type: 'date'
    },
    status: {
      type: 'milestone_status',
      notNull: true,
      default: 'pending'
    },
    order_index: {
      type: 'integer',
      notNull: true,
      default: 0
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

  // Table task
  pgm.createTable('task', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    milestone_id: {
      type: 'uuid',
      references: 'milestone(id)',
      onDelete: 'SET NULL'
    },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'project(id)',
      onDelete: 'CASCADE'
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text'
    },
    status: {
      type: 'task_status',
      notNull: true,
      default: 'todo'
    },
    assignee_id: {
      type: 'uuid',
      references: 'user_admin(id)',
      onDelete: 'SET NULL'
    },
    due_date: {
      type: 'date'
    },
    visible_to_client: {
      type: 'boolean',
      notNull: true,
      default: false
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

  // Index pour project
  pgm.createIndex('project', 'organization_id');
  pgm.createIndex('project', 'status');
  pgm.createIndex('project', ['start_date', 'end_date']);

  // Index pour milestone  
  pgm.createIndex('milestone', 'project_id');
  pgm.createIndex('milestone', 'status');
  pgm.createIndex('milestone', 'due_date');
  pgm.createIndex('milestone', ['project_id', 'order_index']);

  // Index pour task
  pgm.createIndex('task', 'project_id');
  pgm.createIndex('task', 'milestone_id');
  pgm.createIndex('task', 'assignee_id');
  pgm.createIndex('task', 'status');
  pgm.createIndex('task', 'due_date');

  // Contraintes
  pgm.addConstraint('project', 'project_dates_logical',
    'CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)');

  pgm.addConstraint('milestone', 'milestone_order_positive',
    'CHECK (order_index >= 0)');

  // Commentaires
  pgm.sql("COMMENT ON TABLE project IS 'Projets clients avec jalons et tâches'");
  pgm.sql("COMMENT ON TABLE milestone IS 'Jalons/étapes importantes des projets'");
  pgm.sql("COMMENT ON TABLE task IS 'Tâches individuelles liées aux projets et jalons'");
};

exports.down = pgm => {
  pgm.dropTable('task');
  pgm.dropTable('milestone');
  pgm.dropTable('project');
};