import type { User } from './auth'

export interface Client {
  id: string  // UUID
  name: string
  email: string
  phone?: string
  address?: string
  main_contact_name: string
  main_contact_email: string
  main_contact_phone?: string
  industry?: string
  company_size?: string
  status: 'prospect' | 'active' | 'inactive' | 'archived'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string  // UUID
  title: string
  description?: string
  status: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  progress: number
  start_date?: string
  end_date?: string
  completed_at?: string
  estimated_hours?: number
  actual_hours?: number
  notes?: string
  client_name?: string  // From serializer
  project_manager?: User
  project_manager_name?: string
  team_members?: User[]
  team_size?: number
  milestones?: Milestone[]
  is_overdue: boolean
  task_counts?: {
    total: number
    todo: number
    in_progress: number
    review: number
    done: number
    blocked: number
    cancelled?: number
  }
  recent_activity?: ActivityItem[]
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string  // UUID
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  due_date: string
  completed_at?: string
  order: number
  progress: number
  is_overdue: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string  // UUID
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  task_type: 'feature' | 'bug' | 'task' | 'improvement' | 'documentation' | 'testing'
  progress: number
  due_date?: string
  started_at?: string
  completed_at?: string
  estimated_hours?: number
  actual_hours?: number
  order: number
  tags?: string
  tag_list: string[]
  
  // Relations
  assigned_to?: User
  created_by?: User
  project_title?: string
  client_name?: string
  project?: {
    id: string
    title: string
    status: string
    client_name: string
  }
  milestone?: {
    id: string
    title: string
    due_date: string
    status: string
  }
  parent_task?: {
    id: string
    title: string
    status: string
  }
  subtasks?: Array<{
    id: string
    title: string
    status: string
    progress: number
    assigned_to?: string
  }>
  
  // Stats
  is_overdue: boolean
  comment_count: number
  attachment_count: number
  can_edit: boolean
  
  // For detail view
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
  
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string  // UUID
  body: string
  attachment_url?: string
  is_internal: boolean
  author_name: string
  author_avatar?: string
  can_edit: boolean
  created_at: string
  updated_at: string
}

export interface TaskAttachment {
  id: string  // UUID
  file_name: string
  file_size: number
  mime_type: string
  file_url?: string
  uploaded_by_name: string
  created_at: string
}

export interface Invoice {
  id: number
  client_id: number
  project_id?: number
  invoice_number: string
  title: string
  description?: string
  total_ht: number
  total_ttc: number
  currency: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  payment_status: 'pending' | 'processing' | 'completed' | 'failed'
  external_ref?: string
  pdf_url?: string
  created_at: string
  updated_at: string
  items: InvoiceItem[]
}

export interface InvoiceItem {
  id: number
  invoice_id: number
  label: string
  description?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Document {
  id: number
  project_id: number
  title: string
  description?: string
  filename: string
  size: number
  mimetype: string
  visibility: 'public' | 'client' | 'internal'
  download_url?: string
  created_at: string
  updated_at: string
  uploaded_by: User
}

export interface SupportTicket {
  id: number
  client_id: number
  project_id?: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: User
  created_at: string
  updated_at: string
  messages_count: number
}

// Dashboard Data Types
export interface DashboardStats {
  active_projects: number
  pending_tasks: number
  overdue_tasks: number
  pending_invoices: number
  overdue_invoices: number
  recent_activity: ActivityItem[]
}

export interface ActivityItem {
  id: number
  type: 'project' | 'task' | 'invoice' | 'document' | 'support'
  title: string
  description: string
  date: string
  project?: Project
  related_id: number
}
