import { redirect } from "next/navigation"

export default function NouveauEventPage() {
    // Rediriger vers la route anglaise pour maintenir la cohérence
    redirect("/admin/evenements/new")
}
