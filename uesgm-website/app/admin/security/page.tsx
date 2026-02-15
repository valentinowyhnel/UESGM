import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle, Lock, FileText, Users, Settings } from "lucide-react"

export default async function AdminSecurityPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role === "MEMBER") {
        redirect("/login")
    }

    const userRole = (session.user as any)?.role

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-4xl font-bold font-montserrat text-slate-900 mb-4 flex items-center justify-center gap-3">
                    <Shield className="w-10 h-10 text-gold" />
                    Sécurité Administrative
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                    Système de sécurité complet pour protéger les actions critiques de l'administration
                </p>
            </div>

            {/* Rôle actuel */}
            <Card className="border-l-4 border-l-gold">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Votre Rôle Actuel
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Badge 
                            variant={userRole === 'SUPER_ADMIN' ? 'default' : 'secondary'}
                            className={`px-4 py-2 text-sm font-bold ${
                                userRole === 'SUPER_ADMIN' 
                                    ? 'bg-red-100 text-red-800 border-red-200' 
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                        >
                            {userRole === 'SUPER_ADMIN' ? '🔴 SUPER ADMIN' : '🔵 ADMIN'}
                        </Badge>
                        <div className="text-sm text-slate-600">
                            {userRole === 'SUPER_ADMIN' 
                                ? 'Accès complet à toutes les fonctionnalités' 
                                : 'Accès limité aux fonctionnalités standard'
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions Sécurisées */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            Actions Autorisées
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Création</div>
                                <div className="text-sm text-slate-600">Projets, événements, documents, newsletters</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Modification</div>
                                <div className="text-sm text-slate-600">Mise à jour de toutes les ressources</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Publication/Suspension</div>
                                <div className="text-sm text-slate-600">Contrôle de visibilité des contenus</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Upload de fichiers</div>
                                <div className="text-sm text-slate-600">Documents et images avec validation</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                            Restrictions Super Admin
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Suppression</div>
                                <div className="text-sm text-slate-600">Uniquement les super admins peuvent supprimer</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Gestion des utilisateurs</div>
                                <div className="text-sm text-slate-600">Création et suppression de comptes</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Configuration système</div>
                                <div className="text-sm text-slate-600">Paramètres critiques de l'application</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                                <div className="font-semibold">Audit et logs</div>
                                <div className="text-sm text-slate-600">Accès aux journaux d'audit</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Limites de Sécurité */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Mesures de Sécurité Implémentées
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Authentification</h3>
                            <p className="text-sm text-slate-600">Vérification systématique des sessions et rôles</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Validation</h3>
                            <p className="text-sm text-slate-600">Contrôle strict des données et fichiers uploadés</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Confirmation</h3>
                            <p className="text-sm text-slate-600">Dialogues de confirmation pour actions critiques</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="font-semibold mb-2">Audit</h3>
                            <p className="text-sm text-slate-600">Journalisation de toutes les actions administratives</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Limites de Fichiers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Limites de Upload
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-3 text-blue-700">Documents</h4>
                            <ul className="space-y-2 text-sm">
                                <li>• Taille max: 10MB</li>
                                <li>• Formats: PDF, Word, Excel, PowerPoint</li>
                                <li>• Validation MIME type</li>
                            </ul>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-3 text-green-700">Images</h4>
                            <ul className="space-y-2 text-sm">
                                <li>• Taille max: 5MB</li>
                                <li>• Formats: JPEG, PNG, WebP</li>
                                <li>• Optimisation automatique</li>
                            </ul>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-3 text-purple-700">Vidéos</h4>
                            <ul className="space-y-2 text-sm">
                                <li>• Taille max: 50MB</li>
                                <li>• Formats: MP4 uniquement</li>
                                <li>• Compression requise</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bonnes Pratiques */}
            <Card className="border-l-4 border-l-amber-400">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                        <Settings className="w-5 h-5" />
                        Bonnes Pratiques de Sécurité
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-3 text-green-700">✅ À FAIRE</h4>
                            <ul className="space-y-2 text-sm">
                                <li>• Vérifier toujours les permissions avant les actions</li>
                                <li>• Utiliser des mots de passe forts</li>
                                <li>• Confirmer les actions critiques</li>
                                <li>• Surveiller les logs d'audit</li>
                                <li>• Maintenir le navigateur à jour</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3 text-red-700">❌ À ÉVITER</h4>
                            <ul className="space-y-2 text-sm">
                                <li>• Partager les identifiants admin</li>
                                <li>• Ignorer les alertes de sécurité</li>
                                <li>• Upload de fichiers non vérifiés</li>
                                <li>• Actions sans confirmation</li>
                                <li>• Contourner les restrictions</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
