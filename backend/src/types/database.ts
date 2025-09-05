import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  organization: OrganizationTable;
  user_admin: UserAdminTable;
  user_client: UserClientTable;
  project: ProjectTable;
  milestone: MilestoneTable;
  task: TaskTable;
  deliverable: DeliverableTable;
  ticket: TicketTable;
  ticket_reply: TicketReplyTable;
  ticket_category: TicketCategoryTable;
  invoice: InvoiceTable;
  invoice_line: InvoiceLineTable;
  document: DocumentTable;
  email_template: EmailTemplateTable;
  email_outbox: EmailOutboxTable;
  audit_log: AuditLogTable;
  system_settings: SystemSettingsTable;
}

export interface OrganizationTable {
  id: Generated<string>;
  name: string;
  siret?: string | null;
  address?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at?: Date | null;
}

export interface UserAdminTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'manager' | 'agent' | 'accountant' | 'readonly';
  is_active: Generated<boolean>;
  last_login_at?: Date;
  failed_login_attempts: Generated<number>;
  locked_until?: Date;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface UserClientTable {
  id: Generated<string>;
  organization_id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'owner' | 'manager' | 'reader';
  is_active: Generated<boolean>;
  activation_token?: string | null;
  activation_expires_at?: Date | null;
  reset_password_token?: string | null;
  reset_password_expires_at?: Date | null;
  disabled_reason?: string | null;
  last_login_at?: Date;
  failed_login_attempts: Generated<number>;
  locked_until?: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at?: Date;
}

export interface ProjectTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date?: Date;
  end_date?: Date;
  visible_to_client: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface MilestoneTable {
  id: Generated<string>;
  project_id: string;
  name: string;
  description?: string;
  due_date?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  order_index: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TaskTable {
  id: Generated<string>;
  milestone_id?: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  assignee_id?: string;
  due_date?: Date;
  visible_to_client: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DeliverableTable {
  id: Generated<string>;
  project_id: string;
  milestone_id?: string;
  name: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: Generated<number>;
  status: 'pending' | 'delivered' | 'approved' | 'revision_requested';
  approval_comment?: string;
  uploaded_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TicketTable {
  id: Generated<string>;
  organization_id: string;
  category_id?: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  assigned_to?: string;
  due_date?: Date;
  resolved_at?: Date;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TicketReplyTable {
  id: Generated<string>;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: Generated<boolean>;
  attachments?: string;
  created_at: Generated<Date>;
}

export interface TicketCategoryTable {
  id: Generated<string>;
  name: string;
  description?: string;
  color?: string;
  form_schema?: string;
  sla_response_hours: Generated<number>;
  sla_resolution_hours: Generated<number>;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface InvoiceTable {
  id: Generated<string>;
  organization_id: string;
  invoice_number: string;
  type: 'quote' | 'invoice' | 'credit_note';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: Date;
  due_date?: Date;
  paid_date?: Date;
  total_amount: number;
  currency: Generated<string>;
  notes?: string;
  created_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface InvoiceLineTable {
  id: Generated<string>;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order_index: number;
}

export interface DocumentTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: Generated<number>;
  is_shared_with_client: Generated<boolean>;
  uploaded_by: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at?: Date;
}

export interface EmailTemplateTable {
  id: Generated<string>;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: string;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface EmailOutboxTable {
  id: Generated<string>;
  template_id?: string;
  to_email: string;
  to_name?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: Generated<number>;
  last_attempt_at?: Date;
  error_message?: string | null;
  scheduled_at?: Date;
  created_at: Generated<Date>;
}

export interface AuditLogTable {
  id: Generated<string>;
  actor_type: 'admin' | 'client';
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details_json?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Generated<Date>;
}

export interface SystemSettingsTable {
  key: string;
  value: string;
  description?: string;
  updated_at: Generated<Date>;
}

// Types utilitaires
export type Organization = Selectable<OrganizationTable>;
export type NewOrganization = Insertable<OrganizationTable>;
export type OrganizationUpdate = Updateable<OrganizationTable>;

export type UserAdmin = Selectable<UserAdminTable>;
export type NewUserAdmin = Insertable<UserAdminTable>;
export type UserAdminUpdate = Updateable<UserAdminTable>;

export type UserClient = Selectable<UserClientTable>;
export type NewUserClient = Insertable<UserClientTable>;
export type UserClientUpdate = Updateable<UserClientTable>;

export type Project = Selectable<ProjectTable>;
export type NewProject = Insertable<ProjectTable>;
export type ProjectUpdate = Updateable<ProjectTable>;

export type Ticket = Selectable<TicketTable>;
export type NewTicket = Insertable<TicketTable>;
export type TicketUpdate = Updateable<TicketTable>;

export type Invoice = Selectable<InvoiceTable>;
export type NewInvoice = Insertable<InvoiceTable>;
export type InvoiceUpdate = Updateable<InvoiceTable>;

export type AuditLog = Selectable<AuditLogTable>;
export type NewAuditLog = Insertable<AuditLogTable>;
export type EmailTemplate = Selectable<EmailTemplateTable>;
