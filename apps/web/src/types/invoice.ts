
export interface InvoiceItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client: string; // client ID
  client_name?: string;
  project: string; // project ID
  project_title?: string;
  title: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  invoice_date: string;
  due_date: string;
  total_ttc: number;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}
