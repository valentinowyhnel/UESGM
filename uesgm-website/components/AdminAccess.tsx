'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock } from 'lucide-react'

/**
 * Composant discret pour accéder à la page d'authentification admin
 * S'active via un double-clic sur le logo UESGM dans le footer
 * ou via un code secret (5 clics sur le copyright)
 */
export function AdminAccess() {
    const router = useRouter()
    const [clickCount, setClickCount] = useState(0)
    const [logoClicks, setLogoClicks] = useState(0)
    const [showAccess, setShowAccess] = useState(false)

    // Reset du compteur après 3 secondes
    useEffect(() => {
        if (clickCount > 0) {
            const timer = setTimeout(() => {
                setClickCount(0)
            }, 3000)
            return () => clearTimeout(timer)
        }
        return undefined;
    }, [clickCount])

    // Reset du compteur logo après 2 secondes
    useEffect(() => {
        if (logoClicks > 0) {
            const timer = setTimeout(() => {
                setLogoClicks(0)
            }, 2000)
            return () => clearTimeout(timer)
        }
        return undefined;
    }, [logoClicks])

    // Détection du double-clic sur le logo
    const handleLogoClick = () => {
        setLogoClicks(prev => {
            const newCount = prev + 1
            if (newCount >= 2) {
                setShowAccess(true)
                setTimeout(() => {
                    router.push('/login')
                }, 500)
                return 0
            }
            return newCount
        })
    }

    // Détection du code secret (5 clics sur le copyright)
    const handleCopyrightClick = () => {
        setClickCount(prev => {
            const newCount = prev + 1
            if (newCount >= 5) {
                setShowAccess(true)
                setTimeout(() => {
                    router.push('/login')
                }, 500)
                return 0
            }
            return newCount
        })
    }

    return (
        <>
            {/* Zone invisible pour le double-clic sur le logo */}
            <div
                onClick={handleLogoClick}
                className="absolute inset-0 cursor-pointer"
                style={{ 
                    position: 'absolute',
                    width: '100px',
                    height: '40px',
                    left: '0',
                    top: '0',
                    zIndex: 1
                }}
                aria-hidden="true"
            />

            {/* Zone invisible pour le code secret sur le copyright */}
            <div
                onClick={handleCopyrightClick}
                className="absolute inset-0 cursor-pointer"
                style={{ 
                    position: 'absolute',
                    width: '100%',
                    height: '20px',
                    bottom: '0',
                    left: '0',
                    zIndex: 1
                }}
                aria-hidden="true"
            />

            {/* Animation discrète lors de l'activation */}
            {showAccess && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center space-y-4 p-8 bg-slate-900/95 rounded-lg border border-primary/30 shadow-2xl">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Shield className="w-8 h-8 text-primary animate-pulse" />
                            <Lock className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <p className="text-white font-montserrat text-lg">
                            Accès administrateur détecté
                        </p>
                        <p className="text-gray-400 text-sm">
                            Redirection en cours...
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}

/**
 * Version simplifiée pour le footer
 * S'active via double-clic sur le logo UESGM
 */
export function AdminAccessFooter({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [clickCount, setClickCount] = useState(0)

    useEffect(() => {
        if (clickCount > 0) {
            const timer = setTimeout(() => {
                setClickCount(0)
            }, 2000)
            return () => clearTimeout(timer)
        }
        return undefined;
    }, [clickCount])

    const handleClick = () => {
        setClickCount(prev => {
            const newCount = prev + 1
            if (newCount >= 2) {
                router.push('/login')
                return 0
            }
            return newCount
        })
    }

    return (
        <div
            onClick={handleClick}
            className="inline-block cursor-pointer"
            aria-hidden="true"
        >
            {children}
        </div>
    )
}

/**
 * Composant pour le copyright - code secret (5 clics)
 */
export function AdminAccessCopyright() {
    const router = useRouter()
    const [clickCount, setClickCount] = useState(0)

    useEffect(() => {
        if (clickCount > 0) {
            const timer = setTimeout(() => {
                setClickCount(0)
            }, 3000)
            return () => clearTimeout(timer)
        }
        return undefined;
    }, [clickCount])

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setClickCount(prev => {
            const newCount = prev + 1
            if (newCount >= 5) {
                router.push('/login')
                return 0
            }
            return newCount
        })
    }

    return (
        <div
            onClick={handleClick}
            className="absolute inset-0 cursor-pointer"
            aria-hidden="true"
            style={{ zIndex: 1 }}
        />
    )
}
