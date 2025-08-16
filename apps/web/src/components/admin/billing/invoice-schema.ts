
import { z } from "zod";

export const invoiceItemSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "La quantité doit être positive"),
  unit_price: z.coerce.number().min(0, "Le prix doit être positif"),
});

export const invoiceSchema = z.object({
  client: z.string().min(1, "Le client est requis"),
  project: z.string().min(1, "Le projet est requis"),
  status: z.enum(['draft', 'sent', 'paid', 'cancelled', 'overdue']),
  title: z.string().min(1, "Le titre est requis"),
  invoice_date: z.string(),
  due_date: z.string(),
  items: z.array(invoiceItemSchema).min(1, "La facture doit contenir au moins un article."),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
