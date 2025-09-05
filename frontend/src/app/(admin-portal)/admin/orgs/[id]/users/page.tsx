'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Activity,
  Clock,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';

// Types pour les données utilisateur
interface OrganizationUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'reader';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  disabledAt?: string;
  disabledReason?: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  actorName?: string;
}

// Données mockées pour la démonstration
const mockUsers: OrganizationUser[] = [
  {
    id: 'user-1',
    email: 'owner@company.com',
    name: 'Jean Dupont',
    role: 'owner',
    isActive: true,
    lastLoginAt: '2024-09-04T10:30:00Z',
    createdAt: '2024-01-15T08:00:00Z',
    failedLoginAttempts: 0,
  },
  {
    id: 'user-2',
    email: 'manager@company.com',
    name: 'Marie Martin',
    role: 'manager',
    isActive: true,
    lastLoginAt: '2024-09-03T16:45:00Z',
    createdAt: '2024-02-01T09:15:00Z',
    failedLoginAttempts: 1,
  },
  {
    id: 'user-3',
    email: 'reader@company.com',
    name: 'Pierre Durand',
    role: 'reader',
    isActive: false,
    lastLoginAt: '2024-08-30T14:20:00Z',
    createdAt: '2024-03-10T11:30:00Z',
    failedLoginAttempts: 0,
    disabledAt: '2024-09-01T12:00:00Z',
    disabledReason: 'Licence expirée',
  },
];

const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    action: 'LOGIN_SUCCESS',
    details: 'Connexion réussie',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120.0',
    createdAt: '2024-09-04T10:30:00Z',
    actorName: 'Jean Dupont',
  },
  {
    id: 'log-2',
    action: 'ROLE_CHANGED',
    details: 'Rôle changé de reader à manager',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120.0',
    createdAt: '2024-09-03T09:15:00Z',
    actorName: 'Administrateur',
  },
  {
    id: 'log-3',
    action: 'USER_DISABLED',
    details: 'Utilisateur désactivé - Licence expirée',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120.0',
    createdAt: '2024-09-01T12:00:00Z',
    actorName: 'Administrateur',
  },
];

export default function OrganizationUsersPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;

  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données
    const loadData = async () => {
      setLoading(true);
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(mockUsers);
      setSelectedUser(mockUsers[0]);
      setAuditLogs(mockAuditLogs);
      setLoading(false);
    };

    loadData();
  }, [organizationId]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'reader':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'manager':
        return 'Manager';
      case 'reader':
        return 'Lecteur';
      default:
        return role;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LOGIN_FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'USER_DISABLED':
        return <UserX className="h-4 w-4 text-orange-500" />;
      case 'USER_ENABLED':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'ROLE_CHANGED':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nom',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{String(value)}</div>
            <div className="text-sm text-gray-500">{String(item.email)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      render: (value: unknown) => (
        <Badge variant={getRoleBadgeVariant(String(value))}>
          {getRoleLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (value: unknown) => (
        <div className="flex items-center space-x-2">
          {Boolean(value) ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className={Boolean(value) ? 'text-green-700' : 'text-red-700'}>
            {Boolean(value) ? 'Actif' : 'Inactif'}
          </span>
        </div>
      ),
    },
    {
      key: 'lastLoginAt',
      label: 'Dernière connexion',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(String(value)).toLocaleDateString('fr-FR') : 'Jamais'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedUser(item as unknown as OrganizationUser)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Utilisateurs de l'organisation"
        description="Gérez les utilisateurs et consultez l'historique d'audit"
        actions={
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/orgs/${organizationId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'organisation
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des utilisateurs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Utilisateurs ({users.length})</span>
              </CardTitle>
              <CardDescription>
                Liste complète des utilisateurs de cette organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={users as unknown as Record<string, unknown>[]}
                columns={columns}
                searchable={true}
                searchPlaceholder="Rechercher un utilisateur..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Panneau de détails utilisateur */}
        <div>
          {selectedUser ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>{selectedUser.name}</span>
                </CardTitle>
                <CardDescription>{selectedUser.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Détails</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Statut</span>
                        <Badge variant={selectedUser.isActive ? 'default' : 'destructive'}>
                          {selectedUser.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rôle</span>
                        <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                          {getRoleLabel(selectedUser.role)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Dernière connexion</span>
                        <span className="text-sm text-gray-500">
                          {selectedUser.lastLoginAt
                            ? new Date(selectedUser.lastLoginAt).toLocaleDateString('fr-FR')
                            : 'Jamais'
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Échecs de connexion</span>
                        <span className="text-sm text-gray-500">
                          {selectedUser.failedLoginAttempts}
                        </span>
                      </div>

                      {selectedUser.disabledAt && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Désactivé le:</strong> {new Date(selectedUser.disabledAt).toLocaleDateString('fr-FR')}
                            {selectedUser.disabledReason && (
                              <div className="mt-1"><strong>Raison:</strong> {selectedUser.disabledReason}</div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Actions contextuelles */}
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="text-sm font-medium">Actions</h4>
                      <div className="space-y-2">
                        {selectedUser.isActive ? (
                          <Button variant="outline" size="sm" className="w-full">
                            <UserX className="h-4 w-4 mr-2" />
                            Désactiver
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Réactiver
                          </Button>
                        )}

                        <Button variant="outline" size="sm" className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Changer le rôle
                        </Button>

                        <Button variant="outline" size="sm" className="w-full">
                          <Mail className="h-4 w-4 mr-2" />
                          Envoyer un e-mail
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="audit" className="space-y-4">
                    <div className="space-y-3">
                      {auditLogs
                        .filter(log => log.actorName === selectedUser.name)
                        .map((log) => (
                        <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 mt-0.5">
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {log.action.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {log.details}
                            </p>
                            {log.ipAddress && (
                              <p className="text-xs text-gray-500 mt-1">
                                IP: {log.ipAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un utilisateur pour voir les détails</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}