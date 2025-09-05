'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Building,
  Calendar,
  Paperclip,
  Send,
  Eye,
  Download,
  Flag,
  Reply,
  UserCheck,
  XCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';

// Types pour les tickets et réponses
interface TicketResponse {
  id: string;
  content: string;
  authorName: string;
  authorRole: 'admin' | 'client';
  createdAt: string;
  attachments?: {
    id: string;
    name: string;
    size: number;
    type: string;
  }[];
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
  slaBreachAt?: string;
  slaStatus: 'within_sla' | 'warning' | 'breached';
  clientName: string;
  clientEmail: string;
  assignedTo?: string;
  organizationName: string;
  projectName?: string;
  responses: TicketResponse[];
}

// Données mockées pour la démonstration
const mockTicket: Ticket = {
  id: 'TICK-001',
  title: 'Problème de connexion au portail client',
  description: `Bonjour,

Je rencontre un problème depuis ce matin pour me connecter au portail client. Voici ce que j'ai essayé :

1. Vérification de mes identifiants (login/mot de passe)
2. Réinitialisation de mon mot de passe
3. Test sur différents navigateurs (Chrome, Firefox, Safari)
4. Test sur différents appareils (ordinateur, téléphone)

Le message d'erreur affiché est : "Identifiants incorrects" même avec les bonnes informations.

Pouvez-vous m'aider à résoudre ce problème ?

Cordialement,
Jean Dupont`,
  status: 'in_progress',
  priority: 'high',
  category: 'Authentification',
  createdAt: '2024-09-04T08:30:00Z',
  updatedAt: '2024-09-04T10:15:00Z',
  slaBreachAt: '2024-09-04T14:30:00Z',
  slaStatus: 'warning',
  clientName: 'Jean Dupont',
  clientEmail: 'jean.dupont@company.com',
  assignedTo: 'Alice Admin',
  organizationName: 'TechCorp SA',
  projectName: 'Plateforme E-commerce',
  responses: [
    {
      id: 'resp-1',
      content: `Bonjour Jean,

Merci pour votre message détaillé. Je comprends que vous rencontrez des difficultés de connexion malgré plusieurs tentatives.

Pouvez-vous me confirmer :
- L'URL exacte que vous utilisez pour accéder au portail ?
- Avez-vous reçu un e-mail de confirmation après la réinitialisation de mot de passe ?

Je vais également vérifier les logs de connexion de votre compte.

Cordialement,
Alice Admin`,
      authorName: 'Alice Admin',
      authorRole: 'admin',
      createdAt: '2024-09-04T09:45:00Z',
    },
    {
      id: 'resp-2',
      content: `Bonjour Alice,

Merci pour votre réponse rapide.

L'URL que j'utilise est : https://portail.nourx.com/login

J'ai bien reçu l'e-mail de réinitialisation et j'ai pu changer mon mot de passe. Cependant, je n'arrive toujours pas à me connecter.

Pouvez-vous vérifier s'il y a un problème avec mon compte ?

Cordialement,
Jean Dupont`,
      authorName: 'Jean Dupont',
      authorRole: 'client',
      createdAt: '2024-09-04T10:15:00Z',
      attachments: [
        {
          id: 'att-1',
          name: 'capture-ecran-connexion.png',
          size: 245760,
          type: 'image/png',
        }
      ],
    }
  ],
};

const macroResponses = [
  {
    id: 'macro-1',
    title: 'Confirmation de réception',
    content: 'Bonjour,\n\nNous avons bien reçu votre demande et nous l\'étudions actuellement. Nous reviendrons vers vous dans les plus brefs délais.\n\nCordialement,\nL\'équipe Nourx'
  },
  {
    id: 'macro-2',
    title: 'Demande d\'informations complémentaires',
    content: 'Bonjour,\n\nPour traiter votre demande de manière optimale, pourriez-vous nous fournir les informations suivantes :\n\n- [Liste des informations demandées]\n\nCela nous permettra de résoudre votre problème plus rapidement.\n\nCordialement,\nL\'équipe Nourx'
  },
  {
    id: 'macro-3',
    title: 'Résolution du problème',
    content: 'Bonjour,\n\nLe problème que vous rencontriez a été résolu. Vous pouvez maintenant [description de la solution].\n\nSi vous rencontrez d\'autres difficultés, n\'hésitez pas à nous contacter.\n\nCordialement,\nL\'équipe Nourx'
  },
];

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [selectedMacro, setSelectedMacro] = useState('');
  const [responseAttachments, setResponseAttachments] = useState<File[]>([]);

  useEffect(() => {
    // Simuler le chargement des données
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTicket(mockTicket);
      setLoading(false);
    };

    loadData();
  }, [ticketId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'waiting_client':
        return 'secondary';
      case 'resolved':
        return 'outline';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'waiting_client':
        return 'Attente client';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSlaStatus = (slaStatus: string) => {
    if (slaStatus === 'breached') {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">SLA dépassé</span>
        </div>
      );
    } else if (slaStatus === 'warning') {
      return (
        <div className="flex items-center space-x-2 text-yellow-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">SLA proche</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Dans les SLA</span>
        </div>
      );
    }
  };

  const handleSendResponse = () => {
    if (!newResponse.trim()) return;

    // Simulation d'envoi de réponse
    console.log('Envoi de la réponse:', newResponse);

    // Réinitialiser le formulaire
    setNewResponse('');
    setSelectedMacro('');
    setResponseAttachments([]);
  };

  const handleStatusChange = (newStatus: string) => {
    if (ticket) {
      setTicket({
        ...ticket,
        status: newStatus as Ticket['status'],
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleMacroSelect = (macroId: string) => {
    const macro = macroResponses.find(m => m.id === macroId);
    if (macro) {
      setNewResponse(macro.content);
      setSelectedMacro(macroId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Ticket non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ticket ${ticket.id}`}
        description={ticket.title}
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/admin/tickets">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="waiting_client">Attente client</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Flag className="h-4 w-4 mr-2" />
              Macros
            </Button>
          </div>
        }
      />

      {/* Informations du ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description du ticket */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Description du problème</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(ticket.status)}>
                    {getStatusLabel(ticket.status)}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Créé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')} à {new Date(ticket.createdAt).toLocaleTimeString('fr-FR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {ticket.description}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Fil de discussion */}
          <Card>
            <CardHeader>
              <CardTitle>Discussion ({ticket.responses.length + 1})</CardTitle>
              <CardDescription>
                Historique des échanges sur ce ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Message initial */}
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">{ticket.clientName}</span>
                    <Badge variant="outline">Client</Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR')} à {new Date(ticket.createdAt).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {ticket.description}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Réponses */}
              {ticket.responses.map((response, index) => (
                <div key={response.id}>
                  <Separator />
                  <div className="flex space-x-4 pt-6">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        response.authorRole === 'admin'
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}>
                        <User className={`h-5 w-5 ${
                          response.authorRole === 'admin'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{response.authorName}</span>
                        <Badge variant={response.authorRole === 'admin' ? 'default' : 'outline'}>
                          {response.authorRole === 'admin' ? 'Support' : 'Client'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(response.createdAt).toLocaleDateString('fr-FR')} à {new Date(response.createdAt).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {response.content}
                        </pre>
                      </div>
                      {response.attachments && response.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Pièces jointes :</p>
                          {response.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{attachment.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(attachment.size / 1024).toFixed(1)} KB)
                              </span>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Nouvelle réponse */}
          <Card>
            <CardHeader>
              <CardTitle>Répondre au ticket</CardTitle>
              <CardDescription>
                Ajoutez une réponse ou utilisez une macro de réponse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Macro de réponse (optionnel)</label>
                <Select value={selectedMacro} onValueChange={handleMacroSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une macro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {macroResponses.map((macro) => (
                      <SelectItem key={macro.id} value={macro.id}>
                        {macro.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Votre réponse</label>
                <Textarea
                  placeholder="Tapez votre réponse ici..."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Ajouter une pièce jointe
                </Button>
                <Button onClick={handleSendResponse} disabled={!newResponse.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer la réponse
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Client</label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{ticket.clientName}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{ticket.clientEmail}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Organisation</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{ticket.organizationName}</span>
                </div>
              </div>

              {ticket.projectName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Projet</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{ticket.projectName}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Catégorie</label>
                <div className="mt-1">
                  <Badge variant="outline">{ticket.category}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Assigné à</label>
                <div className="flex items-center space-x-2 mt-1">
                  <UserCheck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{ticket.assignedTo || 'Non assigné'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">SLA</label>
                <div className="mt-1">
                  {getSlaStatus(ticket.slaStatus)}
                  {ticket.slaBreachAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Échéance : {new Date(ticket.slaBreachAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertes */}
          {ticket.slaStatus === 'breached' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>SLA dépassé !</strong> Ce ticket nécessite une attention immédiate.
              </AlertDescription>
            </Alert>
          )}

          {ticket.slaStatus === 'warning' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>SLA proche.</strong> Réponse requise avant {new Date(ticket.slaBreachAt!).toLocaleString('fr-FR')}.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <UserCheck className="h-4 w-4 mr-2" />
                Changer l'assignation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Flag className="h-4 w-4 mr-2" />
                Modifier la priorité
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Marquer comme lu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
