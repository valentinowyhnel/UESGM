'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
    const handleLogout = async () => {
        await signOut({
            callbackUrl: '/',  // Redirect to home page
            redirect: true
        })
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
