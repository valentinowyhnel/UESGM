"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Server,
  HardDrive,
  Globe,
  Activity,
  Settings,
  Terminal,
  Zap,
  FileJson,
  Shield
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DbStats = {
  users: number
  events: number
  projects: number
  documents: number
  partners: number
  antennes: number
  contactMessages: number
  newsletters: number
  totalRecords: number
}

type ModelInfo = {
  name: string
  count: number
  key: string
}

type HealthCheck = {
  database: boolean
  databaseLatency?: number
  error?: string
}

type EnvInfo = {
  nodeEnv: string
  nextAuthUrl: string
  nextAuthSecret: string
  databaseUrl: string
  supabaseUrl: string
  googleClientId: string
}

function ParametresContent() {
  const [activeTab, setActiveTab] = useState("database")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<DbStats | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [jsonData, setJsonData] = useState("")
  const [deleteId, setDeleteId] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setModels(data.models)
        setHealth(data.health)
        setEnvInfo(data.envInfo)
      } else {
        toast.error(data.error || "Erreur lors du chargement des données")
      }
    } catch (error: any) {
      toast.error("Erreur: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-connection" })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        loadData()
      } else {
        toast.error(data.error || "Échec de la connexion")
      }
    } catch (error: any) {
      toast.error("Erreur: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!selectedModel || !jsonData) {
      toast.error("Veuillez sélectionner un modèle et entrer les données JSON")
      return
    }

    try {
      const parsedData = JSON.parse(jsonData)
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "create", 
          model: selectedModel, 
          data: parsedData 
        })
      })
      const data = await response.json()
      
      if (data.success || data.id) {
        toast.success("Enregistrement créé avec succès!")
        setIsCreateDialogOpen(false)
        setJsonData("")
        loadData()
      } else {
        toast.error(data.error || "Erreur lors de la création")
      }
    } catch (error: any) {
      toast.error("Erreur JSON: " + error.message)
    }
  }

  const handleDelete = async () => {
    if (!selectedModel || !deleteId) {
      toast.error("Veuillez sélectionner un modèle et entrer l'ID")
      return
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "delete", 
          model: selectedModel, 
          id: deleteId 
        })
      })
      const data = await response.json()
      
      if (data.success || data.id) {
        toast.success("Enregistrement supprimé avec succès!")
        setIsDeleteDialogOpen(false)
        setDeleteId("")
        loadData()
      } else {
        toast.error(data.error || "Erreur lors de la suppression")
      }
    } catch (error: any) {
      toast.error("Erreur: " + error.message)
    }
  }

  const clearCache = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-cache" })
      })
      const data = await response.json()
      toast.success(data.message)
    } catch (error: any) {
      toast.error("Erreur: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const availableModels = [
    { value: "User", label: "Utilisateur" },
    { value: "ExecutiveMember", label: "Membre du bureau" },
    { value: "Antenne", label: "Antenne" },
    { value: "Event", label: "Événement" },
    { value: "Project", label: "Projet" },
    { value: "Document", label: "Document" },
    { value: "Partner", label: "Partenaire" },
    { value: "Newsletter", label: "Newsletter" },
    { value: "ContactMessage", label: "Message de contact" }
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres & Diagnostic</h1>
          <p className="text-muted-foreground">Gérez la base de données et diagnostiquez les problèmes</p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Base de données
          </TabsTrigger>
          <TabsTrigger value="crud" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            CRUD
          </TabsTrigger>
          <TabsTrigger value="environment" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="troubleshoot" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Dépannage
          </TabsTrigger>
        </TabsList>

        {/* DATABASE TAB */}
        <TabsContent value="database">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Health Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">État de la Base de Données</CardTitle>
                {health?.database ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                {health?.database ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Connectée
                      </Badge>
                      {health.databaseLatency && (
                        <span className="text-xs text-muted-foreground">
                          {health.databaseLatency}ms
                        </span>
                      )}
                    </div>
                    <Button onClick={testConnection} variant="outline" size="sm" className="w-full">
                      Tester la connexion
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      Déconnectée
                    </Badge>
                    <p className="text-xs text-red-500">{health?.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total des Enregistrements</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRecords || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Répartis sur {models.length} tables
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions Rapides</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={clearCache} variant="outline" size="sm" className="w-full">
                  Vider le cache
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Models Table */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Statistiques par Table</CardTitle>
              <CardDescription>Nombre d'enregistrements dans chaque table</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Enregistrements</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.key}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{model.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRUD TAB */}
        <TabsContent value="crud">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Create */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un Enregistrement
                </CardTitle>
                <CardDescription>
                  Ajouter un nouvel enregistrement dans la base de données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Modèle</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Données JSON</Label>
                  <Textarea 
                    placeholder='{"name": "Valeur", "description": "Description"}' 
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>

                <Button onClick={handleCreate} className="w-full" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Créer l'enregistrement
                </Button>
              </CardContent>
            </Card>

            {/* Delete */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Supprimer un Enregistrement
                </CardTitle>
                <CardDescription>
                  Supprimer un enregistrement par son ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Modèle</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ID de l'enregistrement</Label>
                  <Input 
                    placeholder="Entrer l'ID à supprimer" 
                    value={deleteId}
                    onChange={(e) => setDeleteId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Attention: Cette action est irréversible!
                  </p>
                </div>

                <Button onClick={handleDelete} variant="destructive" className="w-full" disabled={loading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer l'enregistrement
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* JSON Examples */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Exemples de JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Antenne</Label>
                  <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
{`{
  "name": "Antenne Rabat",
  "city": "Rabat",
  "country": "Maroc",
  "memberCount": 25
}`}
                  </pre>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Événement</Label>
                  <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
{`{
  "title": "Mon Événement",
  "description": "Description",
  "location": "Rabat",
  "startDate": "2024-12-01T14:00:00Z",
  "slug": "mon-evenement",
  "status": "DRAFT",
  "category": "EVENT"
}`}
                  </pre>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Projet</Label>
                  <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
{`{
  "title": "Mon Projet",
  "description": "Description",
  "shortDesc": "Résumé",
  "slug": "mon-projet",
  "category": "EDUCATION",
  "status": "PLANNING"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENVIRONMENT TAB */}
        <TabsContent value="environment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Variables d'Environnement
              </CardTitle>
              <CardDescription>
                Configuration actuelle de l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">NODE_ENV</TableCell>
                    <TableCell>
                      <Badge variant={envInfo?.nodeEnv === 'production' ? 'default' : 'secondary'}>
                        {envInfo?.nodeEnv || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{envInfo?.nodeEnv || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">NEXTAUTH_URL</TableCell>
                    <TableCell>
                      <Badge variant={envInfo?.nextAuthUrl === 'configured' ? 'default' : 'destructive'}>
                        {envInfo?.nextAuthUrl || 'missing'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{envInfo?.nextAuthUrl || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">NEXTAUTH_SECRET</TableCell>
                    <TableCell>
                      <Badge variant={envInfo?.nextAuthSecret === 'configured' ? 'default' : 'destructive'}>
                        {envInfo?.nextAuthSecret || 'missing'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{'•'.repeat(20)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">DATABASE_URL</TableCell>
                    <TableCell>
                      <Badge variant={envInfo?.databaseUrl === 'configured' ? 'default' : 'destructive'}>
                        {envInfo?.databaseUrl || 'missing'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {envInfo?.databaseUrl === 'configured' ? 'postgresql://****' : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">SUPABASE_URL</TableCell>
                    <TableCell>
                      <Badge variant={envInfo?.supabaseUrl === 'configured' ? 'default' : 'secondary'}>
                        {envInfo?.supabaseUrl || 'missing'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {envInfo?.supabaseUrl === 'configured' ? 'https://****.supabase.co' : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">GOOGLE_CLIENT_ID</TableCell>
                    <TableCell>
                      <Badge variant={envInfo?.googleClientId === 'configured' ? 'default' : 'secondary'}>
                        {envInfo?.googleClientId || 'not configured'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">N/A</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TROUBLESHOOT TAB */}
        <TabsContent value="troubleshoot">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Diagnostic Système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Base de données</span>
                  </div>
                  {health?.database ? (
                    <Badge className="bg-green-500">OK</Badge>
                  ) : (
                    <Badge variant="destructive">Erreur</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Authentification</span>
                  </div>
                  <Badge className="bg-green-500">OK</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">API Routes</span>
                  </div>
                  <Badge className="bg-green-500">OK</Badge>
                </div>

                <Button onClick={loadData} variant="outline" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Relancer le diagnostic
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Informations de Débogage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Version Node.js</p>
                  <code className="text-sm">{process.env.NODE_ENV || 'development'}</code>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Dernière actualisation</p>
                  <code className="text-sm">{new Date().toLocaleString()}</code>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Latence DB</p>
                  <code className="text-sm">{health?.databaseLatency || 'N/A'}ms</code>
                </div>

                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Actualiser la page
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Commandes Utiles</CardTitle>
              <CardDescription>Commandes pour maintenir et dépanner l'application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Regénérer Prisma</p>
                  <code className="text-sm block bg-muted p-2 rounded">npx prisma generate</code>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Synchroniser la DB</p>
                  <code className="text-sm block bg-muted p-2 rounded">npx prisma db push</code>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Réinitialiser la DB</p>
                  <code className="text-sm block bg-muted p-2 rounded">npx prisma db push --force-reset</code>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Exécuter le seed</p>
                  <code className="text-sm block bg-muted p-2 rounded">npx tsx prisma/seed.ts</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ParametresPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ParametresContent />
    </Suspense>
  )
}
