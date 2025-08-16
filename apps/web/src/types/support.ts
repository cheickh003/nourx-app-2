
export interface Ticket {
  id: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent'
  messages_count?: number
  assigned_to?: { id: number; first_name: string; last_name: string } | null
  project?: { id: number; title: string } | null
  created_at: string
  updated_at: string
}
