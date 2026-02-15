"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet"

import { SearchCommand } from "@/components/SearchCommand"

export function Header() {
    const routes = [
        { href: "/a-propos", label: "À propos" },
        { href: "/bureau-executif", label: "Bureau" },
        { href: "/antennes", label: "Antennes" },
        { href: "/evenements", label: "Événements" },
        { href: "/projets", label: "Projets" },
        { href: "/bibliotheque", label: "Bibliothèque" },
        { href: "/partenaires", label: "Partenaires" },
        { href: "/contact", label: "Contact" },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between mx-auto px-4">
                <Link href="/" className="flex items-center space-x-2">
                    {/* Use CSS classes for text logo as requested if no image */}
                    <span className="font-montserrat text-2xl font-bold text-primary">UESGM</span>
                </Link>
                <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className="transition-colors hover:text-primary"
                        >
                            {route.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center space-x-4">
                    <div className="hidden lg:block">
                        <SearchCommand />
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                            <nav className="flex flex-col space-y-4 mt-8">
                                {routes.map((route) => (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        className="text-lg font-medium transition-colors hover:text-primary"
                                    >
                                        {route.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
