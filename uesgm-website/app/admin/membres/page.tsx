import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminMembersPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role === "MEMBER") {
        redirect("/login")
    }

    const members = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        }
    })

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-montserrat">Gestion du Recensement</h1>
                <Badge variant="outline" className="text-primary border-primary">
                    {members.length} Étudiants Enregistrés
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des Étudiants</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Date d'inscription</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.name}</TableCell>
                                    <TableCell className="text-sm text-slate-500">{m.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={m.role === 'ADMIN' || m.role === 'SUPER_ADMIN' ? 'default' : 'outline'}>
                                            {m.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400">
                                        {new Date(m.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
