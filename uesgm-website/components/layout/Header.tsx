"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    const routes = [
        { href: "/a-propos", label: "À propos" },
        { href: "/bureau-executif", label: "Le Bureau" },
        { href: "/antennes", label: "Antennes" },
        { href: "/evenements", label: "Événements" },
        { href: "/projets", label: "Projets" },
        { href: "/partenaires", label: "Partenaires" },
        { href: "/bibliotheque", label: "Bibliothèque" },
        { href: "/contact", label: "Contact" },
    ]

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center justify-center">
                        <div className="w-12 h-10 rounded-md overflow-hidden bg-white flex items-center justify-center">
                            <img 
                                src="/images/UESM_logo.jpg" 
                                alt="UESGM Logo" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation - Centered */}
                    <nav className="hidden md:flex items-center justify-center flex-1">
                        <div className="flex items-center space-x-6">
                            {routes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 whitespace-nowrap"
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Right Side - Spacer to balance layout */}
                    <div className="flex-shrink-0 w-10"></div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900 ml-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100">
                        <nav className="flex flex-col space-y-3">
                            {routes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="text-base text-gray-600 hover:text-gray-900 py-2"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
