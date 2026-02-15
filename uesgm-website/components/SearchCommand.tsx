"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SearchCommand() {
    const [mounted, setMounted] = React.useState(false)
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        setMounted(true)
        
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    if (!mounted) {
        return (
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 border-primary/20 hover:border-gold/50 hover:bg-gold/5 text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 xl:mr-2 text-primary" />
                <span className="hidden xl:inline-flex">Rechercher...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
        )
    }

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 border-primary/20 hover:border-gold/50 hover:bg-gold/5 text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 xl:mr-2 text-primary" />
                <span className="hidden xl:inline-flex">Rechercher...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Rechercher..." />
                <CommandList>
                    <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                    <CommandGroup heading="Pages">
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/a-propos"))}
                        >
                            <span>À propos</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/bureau-executif"))}
                        >
                            <span>Bureau Exécutif</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/evenements"))}
                        >
                            <span>Événements</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/bibliotheque"))}
                        >
                            <span>Bibliothèque</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/contact"))}
                        >
                            <span>Contact</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Actions">
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/recensement"))}
                        >
                            <span>Se recenser</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => router.push("/login"))}
                        >
                            <span>Connexion Admin</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}
