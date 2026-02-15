import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DocumentForm from "@/components/admin/DocumentForm"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function NewDocumentPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role === "MEMBER") {
        redirect("/login")
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/bibliotheque" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold font-montserrat text-slate-900">Nouveau Document</h1>
            </div>

            <DocumentForm />
        </div>
    )
}
