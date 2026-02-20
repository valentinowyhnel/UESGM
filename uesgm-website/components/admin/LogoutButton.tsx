'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
    const handleLogout = async () => {
        // Clear any stored data
        if (typeof window !== 'undefined') {
            sessionStorage.clear();
            localStorage.clear();
            
            // Sign out first, then replace the URL to prevent back button
            await signOut({
                callbackUrl: '/',
                redirect: false
            })
            
            // Replace the current URL to prevent back button navigation
            window.location.replace('/')
        }
    }

    return (
        <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
        >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
        </Button>
    )
}
