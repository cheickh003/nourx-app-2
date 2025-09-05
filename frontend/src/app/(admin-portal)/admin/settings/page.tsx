'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Mail,
  Shield,
  FileText,
  TestTube,
  Save,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  User,
  Key,
  Database,
  AlertTriangle
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';

// Types pour les paramètres
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  type: 'welcome' | 'password_reset' | 'invoice' | 'ticket_response' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
  createdAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}

// Données mockées pour la démonstration
const mockSmtpConfig: SmtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  username: 'noreply@nourx.com',
  password: '••••••••',
  fromEmail: 'noreply@nourx.com',
  fromName: 'Nourx Support',
};

const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'template-1',
    name: 'Bienvenue',
    subject: 'Bienvenue chez Nourx - Activation de votre compte',
    content: `Bonjour {{userName}},

Bienvenue chez Nourx ! Votre compte a été créé avec succès.

Pour activer votre compte, cliquez sur le lien suivant :
{{activationLink}}

Ce lien expirera dans 24 heures.

Cordialement,
L'équipe Nourx`,
    variables: ['userName', 'activationLink'],
    type: 'welcome',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'template-2',
    name: 'Réinitialisation mot de passe',
    subject: 'Réinitialisation de votre mot de passe Nourx',
    content: `Bonjour {{userName}},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien suivant pour définir un nouveau mot de passe :
{{resetLink}}

Ce lien expirera dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.

Cordialement,
L'équipe Nourx`,
    variables: ['userName', 'resetLink'],
    type: 'password_reset',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-08-15T00:00:00Z',
  },
];

const mockRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: ['all'],
    isSystem: true,
    userCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Gestion des projets et utilisateurs de l\'organisation',
    permissions: ['projects.manage', 'users.manage', 'billing.view', 'tickets.manage'],
    isSystem: true,
    userCount: 8,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-agent',
    name: 'Agent Support',
    description: 'Traitement des tickets de support',
    permissions: ['tickets.manage', 'users.view', 'projects.view'],
    isSystem: true,
    userCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-accountant',
    name: 'Comptable',
    description: 'Gestion de la facturation et paiements',
    permissions: ['billing.manage', 'projects.view', 'users.view'],
    isSystem: true,
    userCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export default function AdminSettingsPage() {
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(mockSmtpConfig);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [activeTab, setActiveTab] = useState('smtp');
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

  useEffect(() => {
    // Simulation du chargement des données
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Les données sont déjà initialisées avec les mocks
    };

    loadData();
  }, []);

  const handleSmtpTest = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    // Simulation du test SMTP
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSmtpTestResult({
      success: Math.random() > 0.3, // 70% de succès pour la démo
      message: Math.random() > 0.3
        ? 'Connexion SMTP réussie ! Les e-mails peuvent être envoyés.'
        : 'Erreur de connexion SMTP. Vérifiez vos paramètres.'
    });

    setIsTestingSmtp(false);
  };

  const handleSmtpSave = () => {
    // Simulation de la sauvegarde
    console.log('Sauvegarde de la config SMTP:', smtpConfig);
    // Ici on appellerait l'API pour sauvegarder
  };

  const handleTemplateSave = (template: EmailTemplate) => {
    if (selectedTemplate) {
      // Modification
      setEmailTemplates(prev =>
        prev.map(t => t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t)
      );
    } else {
      // Nouveau
      const newTemplate: EmailTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEmailTemplates(prev => [...prev, newTemplate]);
    }

    setSelectedTemplate(null);
    setIsEditingTemplate(false);
  };

  const handleTemplateDelete = (templateId: string) => {
    setEmailTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const templateColumns = [
    {
      key: 'name',
      label: 'Nom du template',
      render: (value: unknown) => (
        <span className="font-medium">{String(value)}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: unknown) => (
        <Badge variant="outline">
          {String(value).replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (value: unknown) => (
        <Badge variant={Boolean(value) ? 'default' : 'secondary'}>
          {Boolean(value) ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Dernière modification',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(item as unknown as EmailTemplate);
              setIsEditingTemplate(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(item as unknown as EmailTemplate);
              setIsEditingTemplate(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!item.isSystem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTemplateDelete(String(item.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const roleColumns = [
    {
      key: 'name',
      label: 'Nom du rôle',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div>
          <div className="font-medium">{String(value)}</div>
          {item.isSystem && Boolean(item.isSystem) && <Badge variant="outline" className="text-xs">Système</Badge>}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: unknown) => (
        <span className="text-sm text-gray-600">{String(value)}</span>
      ),
    },
    {
      key: 'userCount',
      label: 'Utilisateurs',
      render: (value: unknown) => (
        <span className="text-sm">{String(value)} utilisateurs</span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (value: unknown) => {
        const permissions = value as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.slice(0, 3).map((perm: string) => (
              <Badge key={perm} variant="secondary" className="text-xs">
                {perm}
              </Badge>
            ))}
            {permissions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{permissions.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          {!item.isSystem && (
            <>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres système"
        description="Configuration SMTP, templates d'e-mails et gestion des rôles"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="templates">Templates e-mails</TabsTrigger>
          <TabsTrigger value="roles">Rôles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Configuration SMTP */}
        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Configuration SMTP</span>
              </CardTitle>
              <CardDescription>
                Paramètres pour l'envoi d'e-mails automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Serveur SMTP</Label>
                  <Input
                    id="smtp-host"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Nom d'utilisateur</Label>
                  <Input
                    id="smtp-username"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Mot de passe</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-from-email">E-mail expéditeur</Label>
                  <Input
                    id="smtp-from-email"
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-from-name">Nom expéditeur</Label>
                  <Input
                    id="smtp-from-name"
                    value={smtpConfig.fromName}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, fromName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp-secure"
                  checked={smtpConfig.secure}
                  onCheckedChange={(checked: boolean) => setSmtpConfig(prev => ({ ...prev, secure: checked }))}
                />
                <Label htmlFor="smtp-secure">Connexion sécurisée (SSL/TLS)</Label>
              </div>

              <Separator />

              <div className="flex items-center space-x-4">
                <Button onClick={handleSmtpSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSmtpTest}
                  disabled={isTestingSmtp}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {isTestingSmtp ? 'Test en cours...' : 'Tester la connexion'}
                </Button>
              </div>

              {smtpTestResult && (
                <Alert variant={smtpTestResult.success ? 'default' : 'destructive'}>
                  {smtpTestResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{smtpTestResult.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates d'e-mails */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Templates d'e-mails</h2>
              <p className="text-sm text-gray-600">Gestion des modèles d'e-mails automatiques</p>
            </div>
            <Button onClick={() => {
              setSelectedTemplate(null);
              setIsEditingTemplate(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
          </div>

          <Card>
            <CardContent>
              <DataTable
                data={emailTemplates as unknown as Record<string, unknown>[]}
                columns={templateColumns}
                searchable={true}
                searchPlaceholder="Rechercher un template..."
              />
            </CardContent>
          </Card>

          {/* Modal d'édition de template (simulé) */}
          {isEditingTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTemplate ? 'Modifier le template' : 'Nouveau template'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du template</Label>
                    <Input
                      defaultValue={selectedTemplate?.name || ''}
                      placeholder="Ex: Bienvenue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select defaultValue={selectedTemplate?.type || 'custom'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Bienvenue</SelectItem>
                        <SelectItem value="password_reset">Réinitialisation mot de passe</SelectItem>
                        <SelectItem value="invoice">Facture</SelectItem>
                        <SelectItem value="ticket_response">Réponse ticket</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input
                    defaultValue={selectedTemplate?.subject || ''}
                    placeholder="Sujet de l'e-mail"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contenu</Label>
                  <Textarea
                    defaultValue={selectedTemplate?.content || ''}
                    placeholder="Contenu du template avec variables comme {{userName}}"
                    rows={10}
                  />
                </div>

                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setIsEditingTemplate(false);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button onClick={() => {
                    // Simulation de sauvegarde
                    setSelectedTemplate(null);
                    setIsEditingTemplate(false);
                  }}>
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rôles et permissions */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Rôles et permissions</h2>
              <p className="text-sm text-gray-600">Gestion des rôles utilisateur et de leurs permissions</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rôle
            </Button>
          </div>

          <Card>
            <CardContent>
              <DataTable
                data={roles as unknown as Record<string, unknown>[]}
                columns={roleColumns}
                searchable={true}
                searchPlaceholder="Rechercher un rôle..."
              />
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Rôles système :</strong> Les rôles marqués comme "Système" ne peuvent pas être modifiés ou supprimés.
              Ils sont essentiels au fonctionnement de l'application.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Audit log */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Journal d'audit</span>
              </CardTitle>
              <CardDescription>
                Historique des actions effectuées dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Journal d'audit en cours d'implémentation</p>
                <p className="text-sm">Les logs d'audit seront disponibles dans une version ultérieure</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
