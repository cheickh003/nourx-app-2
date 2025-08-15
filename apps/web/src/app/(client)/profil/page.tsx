'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  Save,
  Edit
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

function PersonalInfo() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    address: ''
  })

  const handleSave = () => {
    // TODO: Implement API call to update profile
    console.log('Saving profile:', formData)
    setIsEditing(false)
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Gérez vos informations de profil</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1">
                {(user?.role || user?.profile?.role) === 'client' ? 'Client' : 'Administrateur'}
              </Badge>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                disabled={!isEditing}
                placeholder="(optionnel)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleChange('address')}
                disabled={!isEditing}
                placeholder="(optionnel)"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    project_updates: true,
    task_assignments: true,
    invoice_reminders: true,
    support_responses: true,
    marketing: false
  })

  const handleToggle = (key: string) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  const notifications = [
    {
      key: 'email_notifications',
      title: 'Notifications par email',
      description: 'Recevoir des notifications par email en général'
    },
    {
      key: 'project_updates',
      title: 'Mises à jour de projets',
      description: 'Notifications sur l\'avancement de vos projets'
    },
    {
      key: 'task_assignments',
      title: 'Assignation de tâches',
      description: 'Notifications lorsqu\'une nouvelle tâche vous est assignée'
    },
    {
      key: 'invoice_reminders',
      title: 'Rappels de factures',
      description: 'Rappels pour les factures dues et en retard'
    },
    {
      key: 'support_responses',
      title: 'Réponses support',
      description: 'Notifications pour les réponses à vos tickets de support'
    },
    {
      key: 'marketing',
      title: 'Communications marketing',
      description: 'Newsletters et informations sur les nouveautés NOURX'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Préférences de Notification</CardTitle>
            <CardDescription>Configurez comment vous souhaitez être notifié</CardDescription>
          </div>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {notifications.map((notification) => (
            <div key={notification.key} className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">{notification.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.description}
                </p>
              </div>
              <Button
                variant={preferences[notification.key as keyof typeof preferences] ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggle(notification.key)}
                className="ml-4"
              >
                {preferences[notification.key as keyof typeof preferences] ? 'Activé' : 'Désactivé'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SecuritySettings() {
  const { user } = useAuth()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sécurité</CardTitle>
        <CardDescription>Gérez vos paramètres de sécurité</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Account Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Compte sécurisé</p>
                <p className="text-sm text-muted-foreground">
                  Votre compte utilise une authentification sécurisée
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Nom d'utilisateur</p>
                <p className="text-sm text-muted-foreground">{user?.username}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Actions de sécurité</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Changer le mot de passe</p>
                    <p className="text-sm text-muted-foreground">
                      Mettez à jour votre mot de passe régulièrement
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sessions actives</p>
                    <p className="text-sm text-muted-foreground">
                      Gérez vos sessions de connexion actives
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <ClientLayout title="Mon Profil">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et préférences
          </p>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Informations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <PersonalInfo />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationPreferences />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  )
}
