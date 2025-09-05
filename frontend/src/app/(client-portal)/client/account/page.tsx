'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Key,
  Users,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import useSWR from 'swr';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  inviteUser,
  resendInvitation,
  unlockUser,
  forcePasswordReset,
  type User as UserType,
  type InviteUserInput,
  type UpdateUserInput
} from '@/lib/api/users';

export default function ClientAccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simuler le rôle de l'utilisateur actuel (en production, cela viendrait de la session)
  const currentUserRole = 'owner'; // 'owner', 'manager', ou autre
  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'manager';

  // Charger les utilisateurs si l'utilisateur peut les gérer
  const { data: usersData, error: usersError, mutate: mutateUsers, isLoading } = useSWR(
    canManageUsers ? 'users' : null,
    () => getUsers({}, 1, 50),
    { refreshInterval: 30000 }
  );

  const handleInviteUser = async (data: InviteUserInput) => {
    setIsSubmitting(true);
    try {
      await inviteUser(data);
      toast.success('Invitation envoyée avec succès');
      setInviteDialogOpen(false);
      mutateUsers();
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userId: string, data: UpdateUserInput) => {
    setIsSubmitting(true);
    try {
      await updateUser(userId, data);
      toast.success('Utilisateur mis à jour avec succès');
      setEditDialogOpen(false);
      setSelectedUser(null);
      mutateUsers();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      await deleteUser(userId);
      toast.success('Utilisateur supprimé avec succès');
      mutateUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      await resendInvitation(userId);
      toast.success('Invitation renvoyée avec succès');
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
      toast.error('Erreur lors du renvoi de l\'invitation');
    }
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      await unlockUser(userId);
      toast.success('Utilisateur déverrouillé avec succès');
      mutateUsers();
    } catch (error) {
      console.error('Erreur lors du déverrouillage:', error);
      toast.error('Erreur lors du déverrouillage de l\'utilisateur');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      reader: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      owner: 'Propriétaire',
      manager: 'Manager',
      reader: 'Lecteur',
    };

    return (
      <Badge className={variants[role as keyof typeof variants] || variants.reader}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    const labels = {
      active: 'Actif',
      inactive: 'Inactif',
      pending: 'En attente',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const userColumns = [
    {
      key: 'name',
      header: 'Utilisateur',
      render: (user: UserType) => (
        <div>
          <p className="font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (user: UserType) => getRoleBadge(user.role),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (user: UserType) => getStatusBadge(user.status),
    },
    {
      key: 'lastLogin',
      header: 'Dernière connexion',
      render: (user: UserType) => (
        <span className="text-sm text-gray-600">
          {user.lastLoginAt
            ? formatDistanceToNow(new Date(user.lastLoginAt), {
                addSuffix: true,
                locale: fr
              })
            : 'Jamais'
          }
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: UserType) => (
        <div className="flex items-center space-x-2">
          <Dialog open={editDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedUser(null);
          }}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(user)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <EditUserDialog
              user={selectedUser}
              onSubmit={(data) => handleUpdateUser(user.id, data)}
              isSubmitting={isSubmitting}
            />
          </Dialog>

          {user.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResendInvitation(user.id)}
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}

          {user.status === 'inactive' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUnlockUser(user.id)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteUser(user.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mon compte"
        description="Gérez vos informations personnelles et paramètres de sécurité"
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'profile' | 'users')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Utilisateurs</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Informations personnelles</span>
                  </CardTitle>
                  <CardDescription>
                    Mettez à jour vos informations de contact
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" defaultValue="Jean" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" defaultValue="Dupont" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input id="email" type="email" defaultValue="jean.dupont@entreprise.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" type="tel" defaultValue="+33 6 12 34 56 78" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Entreprise</Label>
                    <Input id="company" defaultValue="Entreprise XYZ" />
                  </div>
                  <Button>Mettre à jour</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Sécurité</span>
                  </CardTitle>
                  <CardDescription>
                    Gérez votre mot de passe et l'authentification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>
                    <Key className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statut du compte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">État du compte</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Actif
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dernière connexion</span>
                    <span className="text-sm text-gray-600">Aujourd'hui</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rôle</span>
                    <span className="text-sm text-gray-600">Administrateur</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Modifier l'e-mail
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Modifier le téléphone
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-2" />
                    Changer d'entreprise
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Besoin d'aide ? Contactez notre équipe support.
                  </p>
                  <Link href="/client/support">
                    <Button className="w-full">
                      Contacter le support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestion des utilisateurs</CardTitle>
                  <CardDescription>
                    Gérez les utilisateurs de votre organisation
                  </CardDescription>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Inviter un utilisateur
                    </Button>
                  </DialogTrigger>
                  <InviteUserDialog
                    onSubmit={handleInviteUser}
                    isSubmitting={isSubmitting}
                  />
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <DataTable
                    data={usersData?.users || []}
                    columns={userColumns}
                    pagination={usersData?.pagination}
                    onPageChange={() => {}} // TODO: Implémenter la pagination
                    currentPage={1}
                    emptyMessage="Aucun utilisateur trouvé"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Composant pour le dialogue d'invitation d'utilisateur
function InviteUserDialog({ onSubmit, isSubmitting }: {
  onSubmit: (data: InviteUserInput) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<InviteUserInput>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'reader',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Inviter un utilisateur</DialogTitle>
        <DialogDescription>
          Envoyez une invitation par email pour rejoindre votre organisation.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              Prénom
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Nom
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Rôle
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'owner' | 'manager' | 'reader') =>
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">Lecteur</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="owner">Propriétaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Composant pour le dialogue d'édition d'utilisateur
function EditUserDialog({ user, onSubmit, isSubmitting }: {
  user: UserType | null;
  onSubmit: (data: UpdateUserInput) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<UpdateUserInput>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'reader',
    status: user && (user.status === 'active' || user.status === 'inactive') ? user.status : 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!user) return null;

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Modifier l'utilisateur</DialogTitle>
        <DialogDescription>
          Modifiez les informations de {user.firstName} {user.lastName}.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-firstName" className="text-right">
              Prénom
            </Label>
            <Input
              id="edit-firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-lastName" className="text-right">
              Nom
            </Label>
            <Input
              id="edit-lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-role" className="text-right">
              Rôle
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'owner' | 'manager' | 'reader') =>
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">Lecteur</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="owner">Propriétaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-status" className="text-right">
              Statut
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') =>
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
