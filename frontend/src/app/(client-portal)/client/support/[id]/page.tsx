'use client';

import { use, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Clock,
  User,
  MessageSquare,
  Paperclip,
  Send,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Circle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getTicket, getTicketReplies, createTicketReply } from '@/lib/api/tickets';
import type { Ticket, TicketReply } from '@nourx/shared';

// Schéma pour l'ajout d'une réponse
const replySchema = z.object({
  content: z.string().min(5, 'Le message doit contenir au moins 5 caractères').max(5000),
});

type ReplyFormData = z.infer<typeof replySchema>;

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [slaInfo, setSlaInfo] = useState<{
    responseTime: number;
    resolutionTime: number;
    responseBreach: boolean;
    resolutionBreach: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
  });

  // Charger les données du ticket
  useEffect(() => {
    const loadTicketData = async () => {
      try {
        const [ticketData, repliesData] = await Promise.all([
          getTicket(id),
          getTicketReplies(id),
        ]);

        setTicket(ticketData);
        setReplies(repliesData);

        // Calculer les informations SLA
        if (ticketData.createdAt) {
          const createdAt = new Date(ticketData.createdAt);
          const now = new Date();
          const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

          // SLA par défaut (à adapter selon la catégorie)
          const responseSla = 8; // 8 heures
          const resolutionSla = 48; // 48 heures

          setSlaInfo({
            responseTime: hoursElapsed,
            resolutionTime: ticketData.resolvedAt ?
              (new Date(ticketData.resolvedAt).getTime() - createdAt.getTime()) / (1000 * 60 * 60) :
              hoursElapsed,
            responseBreach: hoursElapsed > responseSla && ticketData.status !== 'resolved',
            resolutionBreach: hoursElapsed > resolutionSla && ticketData.status !== 'resolved',
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du ticket:', error);
        toast.error('Erreur lors du chargement du ticket');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadTicketData();
    }
  }, [id]);

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

  const onSubmitReply = async (data: ReplyFormData) => {
    if (!ticket) return;

    setIsSubmittingReply(true);

    try {
      const replyData = {
        ticketId: ticket.id,
        content: data.content,
        isInternal: false,
        // TODO: Gérer les pièces jointes
        attachments: attachments.map(file => ({
          filename: file.name,
          url: '', // Sera défini par l'API
          size: file.size,
          mimeType: file.type,
        })),
      };

      const newReply = await createTicketReply(replyData);
      setReplies(prev => [...prev, newReply]);
      setAttachments([]);
      reset();
      toast.success('Réponse envoyée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'waiting_client':
        return <PauseCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      resolved: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_client: 'bg-yellow-100 text-yellow-800',
      open: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      resolved: 'Résolu',
      in_progress: 'En cours',
      waiting_client: 'En attente',
      open: 'Ouvert',
      closed: 'Fermé',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.open}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    const labels = {
      low: 'Faible',
      medium: 'Normale',
      high: 'Haute',
      urgent: 'Urgente',
    };

    return (
      <Badge className={variants[priority as keyof typeof variants] || variants.medium}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Ticket non trouvé"
          description="Le ticket demandé n'existe pas ou vous n'y avez pas accès"
          actions={
            <Link href="/client/support">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la liste
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Ticket #${ticket.id.slice(-8)}`}
        description={ticket.title}
        actions={
          <Link href="/client/support">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails du ticket */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(ticket.status)}
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
              </div>
              <CardDescription>
                Créé {formatDistanceToNow(new Date(ticket.createdAt), {
                  addSuffix: true,
                  locale: fr
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* SLA Information */}
          {slaInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Service Level Agreement (SLA)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Temps de réponse</span>
                      <Badge variant={slaInfo.responseBreach ? "destructive" : "secondary"}>
                        {slaInfo.responseTime.toFixed(1)}h / 8h
                      </Badge>
                    </div>
                    {slaInfo.responseBreach && (
                      <p className="text-xs text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        SLA dépassé
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Temps de résolution</span>
                      <Badge variant={slaInfo.resolutionBreach ? "destructive" : "secondary"}>
                        {slaInfo.resolutionTime.toFixed(1)}h / 48h
                      </Badge>
                    </div>
                    {slaInfo.resolutionBreach && (
                      <p className="text-xs text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        SLA dépassé
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fil de discussion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Discussion</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Message initial */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Vous</span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(ticket.createdAt), 'PPP à p', { locale: fr })}
                  </span>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>

              {/* Réponses */}
              {replies.map((reply) => (
                <div key={reply.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {reply.isInternal ? 'Support' : 'Vous'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(reply.createdAt), 'PPP à p', { locale: fr })}
                    </span>
                  </div>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{reply.content}</p>
                  </div>
                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {reply.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Paperclip className="h-4 w-4" />
                          <span>{attachment.filename}</span>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Formulaire de réponse */}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmitReply)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="content">Votre réponse</Label>
                        <Textarea
                          id="content"
                          placeholder="Tapez votre réponse ici..."
                          rows={4}
                          {...register('content')}
                        />
                        {errors.content && (
                          <p className="text-sm text-red-500">{errors.content.message}</p>
                        )}
                      </div>

                      {/* Pièces jointes */}
                      <div className="space-y-2">
                        <Label>Pièces jointes</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="reply-attachments"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('reply-attachments')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Ajouter des fichiers
                          </Button>
                        </div>

                        {attachments.length > 0 && (
                          <div className="space-y-2">
                            {attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm">{file.name}</span>
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

                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmittingReply}>
                          {isSubmittingReply ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Envoyer la réponse
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec informations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">{getStatusBadge(ticket.status)}</div>
              </div>

              <div>
                <Label className="text-sm font-medium">Priorité</Label>
                <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
              </div>

              <div>
                <Label className="text-sm font-medium">Créé le</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(ticket.createdAt), 'PPP à p', { locale: fr })}
                </p>
              </div>

              {ticket.dueDate && (
                <div>
                  <Label className="text-sm font-medium">Échéance</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(ticket.dueDate), 'PPP', { locale: fr })}
                  </p>
                </div>
              )}

              {ticket.resolvedAt && (
                <div>
                  <Label className="text-sm font-medium">Résolu le</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(ticket.resolvedAt), 'PPP à p', { locale: fr })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
