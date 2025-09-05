/* eslint-disable */

exports.up = pgm => {
  // Extensions PostgreSQL
  pgm.createExtension('uuid-ossp', { ifNotExists: true });
  pgm.createExtension('citext', { ifNotExists: true });
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  // Types ENUM pour les rôles
  pgm.createType('admin_role', ['admin', 'manager', 'agent', 'accountant', 'readonly']);
  pgm.createType('client_role', ['owner', 'manager', 'reader']);
  
  // Types ENUM pour les statuts
  pgm.createType('project_status', ['draft', 'active', 'completed', 'cancelled']);
  pgm.createType('milestone_status', ['pending', 'in_progress', 'completed']);
  pgm.createType('task_status', ['todo', 'in_progress', 'done']);
  pgm.createType('deliverable_status', ['pending', 'delivered', 'approved', 'revision_requested']);
  pgm.createType('ticket_status', ['open', 'in_progress', 'waiting_client', 'resolved', 'closed']);
  pgm.createType('ticket_priority', ['low', 'medium', 'high', 'urgent']);
  pgm.createType('invoice_type', ['quote', 'invoice', 'credit_note']);
  pgm.createType('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);
  pgm.createType('email_status', ['pending', 'sent', 'failed']);
  pgm.createType('actor_type', ['admin', 'client']);
};

exports.down = pgm => {
  // Supprimer les types ENUM
  pgm.dropType('actor_type');
  pgm.dropType('email_status');
  pgm.dropType('invoice_status');
  pgm.dropType('invoice_type');
  pgm.dropType('ticket_priority');
  pgm.dropType('ticket_status');
  pgm.dropType('deliverable_status');
  pgm.dropType('task_status');
  pgm.dropType('milestone_status');
  pgm.dropType('project_status');
  pgm.dropType('client_role');
  pgm.dropType('admin_role');

  // Les extensions sont gardées car elles peuvent être utilisées par d'autres applications
};