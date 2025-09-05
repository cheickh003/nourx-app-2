'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getTicketCategories, createTicket } from '@/lib/api/tickets';
import type { TicketCategory, CreateTicketInput } from '@nourx/shared';

// Schéma de validation dynamique basé sur la catégorie sélectionnée
const createBaseSchema = (selectedCategory?: TicketCategory) => {
  const baseSchema = z.object({
    title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(255),
    description: z.string().min(10, 'La description doit contenir au moins 10 caractères').max(5000),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
  });

  // Si une catégorie est sélectionnée, ajouter les champs du formulaire dynamique
  if (selectedCategory?.formSchema?.fields) {
    const dynamicFields: Record<string, z.ZodType<any>> = {};

    selectedCategory.formSchema.fields.forEach(field => {
      let fieldSchema: z.ZodType<any>;

      switch (field.type) {
        case 'text':
        case 'textarea':
          fieldSchema = z.string();
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'date':
          fieldSchema = z.string();
          break;
        case 'select':
          fieldSchema = z.string();
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        case 'file':
          fieldSchema = z.any().optional();
          break;
        default:
          fieldSchema = z.any();
      }

        if (field.required) {
        if (field.type === 'number') {
          fieldSchema = (fieldSchema as z.ZodNumber).min(0);
        } else if (field.type !== 'checkbox' && field.type !== 'file') {
          fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} est requis`);
        }
      } else {
        fieldSchema = fieldSchema.optional();
      }

      dynamicFields[field.name] = fieldSchema;
    });

    return baseSchema.extend({
      categoryId: z.string().uuid('Catégorie invalide'),
      formData: z.object(dynamicFields),
    });
  }

  return baseSchema.extend({
    categoryId: z.string().uuid().optional(),
    formData: z.record(z.string(), z.any()).optional(),
  });
};

type FormData = z.infer<ReturnType<typeof createBaseSchema>>;

export default function NewTicketPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const schema = createBaseSchema(selectedCategory || undefined);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const watchedCategoryId = watch('categoryId');

  // Charger les catégories au montage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getTicketCategories();
        setCategories(categoriesData.categories);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        toast.error('Erreur lors du chargement des catégories');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Mettre à jour la catégorie sélectionnée
  useEffect(() => {
    if (watchedCategoryId) {
      const category = categories.find(c => c.id === watchedCategoryId);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [watchedCategoryId, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const ticketData: Omit<CreateTicketInput, 'organizationId'> = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        categoryId: data.categoryId,
        formData: data.formData,
      };

      const ticket = await createTicket(ticketData);
      toast.success('Ticket créé avec succès !');

      // Rediriger vers la page du ticket
      router.push(`/client/support/${ticket.id}`);
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      toast.error('Erreur lors de la création du ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field: any) => {
    const fieldName = `formData.${field.name}`;
    const error = errors.formData?.[field.name as keyof typeof errors.formData]?.message;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              placeholder={field.placeholder}
              {...register(fieldName as any)}
            />
            {error && <p className="text-sm text-red-500">{String(error)}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              {...register(fieldName as any)}
            />
            {error && <p className="text-sm text-red-500">{String(error)}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              {...register(fieldName as any, { valueAsNumber: true })}
            />
            {error && <p className="text-sm text-red-500">{String(error)}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              {...register(fieldName as any)}
            />
            {error && <p className="text-sm text-red-500">{String(error)}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => setValue(fieldName as any, value)}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Sélectionner...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{String(error)}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              {...register(fieldName as any)}
            />
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-red-500">{String(error)}</p>}
          </div>
        );

      case 'file':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
            />
            {error && <p className="text-sm text-red-500">{String(error)}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nouvelle demande de support"
        description="Créez une nouvelle demande d'assistance"
        actions={
          <Link href="/client/support">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Renseignez les détails de votre demande
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="categoryId">Catégorie</Label>
                <Select
                  value={watchedCategoryId || ''}
                  onValueChange={(value) => setValue('categoryId', value)}
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCategories ? 'Chargement...' : 'Sélectionner une catégorie'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-500">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Résumez votre demande en quelques mots"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Priorité */}
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priorité <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setValue('priority', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-red-500">{errors.priority.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez en détail votre demande..."
                  rows={6}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Champs dynamiques de la catégorie */}
              {selectedCategory?.formSchema?.fields && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informations supplémentaires</h3>
                  {selectedCategory.formSchema.fields.map(renderFormField)}
                </div>
              )}

              {/* Pièces jointes */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attachments">Pièces jointes</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="attachments"
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('attachments')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Ajouter des fichiers
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Formats acceptés: images, PDF, documents Word, texte
                  </p>
                </div>

                {/* Liste des fichiers attachés */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/client/support">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Création en cours...' : 'Créer le ticket'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
