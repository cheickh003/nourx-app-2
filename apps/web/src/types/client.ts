export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  main_contact_name: string;
  main_contact_email: string;
  main_contact_phone?: string;
  industry?: string;
  company_size?: string;
  status: 'prospect' | 'active' | 'inactive' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  messages_count: number
  project?: { id: number; title: string } | null
  assigned_to?: { id: number; first_name: string; last_name: string } | null
}
