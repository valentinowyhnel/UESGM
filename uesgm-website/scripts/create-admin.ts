/**
 * Script pour créer un administrateur avec un mot de passe sécurisé
 * 
 * Usage: node scripts/create-admin.js
 * 
 * ou utiliser directement:
 * npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface AdminUser {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'SUPER_ADMIN'
}

const ADMIN_USERS: AdminUser[] = [
  {
    email: 'admin@uesgm.ma',
    name: 'Administrateur Principal',
    password: '7d99755735371a9f891309e336bf8f71',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'president@uesgm.ma',
    name: 'Président UESGM',
    password: 'UESGM_President_2025_Secret!',
    role: 'ADMIN'
  }
]

async function createAdminUsers() {
  console.log('🔐 Création des utilisateurs administrateurs...')
  
  for (const admin of ADMIN_USERS) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: admin.email }
      })
      
      if (existingUser) {
        // Mettre à jour le mot de passe et le rôle
        const hashedPassword = await bcrypt.hash(admin.password, 12)
        
        await prisma.user.update({
          where: { email: admin.email },
          data: {
            password: hashedPassword,
            role: admin.role,
            name: admin.name
          }
        })
        
        console.log(`✅ Utilisateur mis à jour: ${admin.email} (${admin.role})`)
      } else {
        // Créer un nouvel utilisateur
        const hashedPassword = await bcrypt.hash(admin.password, 12)
        
        await prisma.user.create({
          data: {
            email: admin.email,
            name: admin.name,
            password: hashedPassword,
            role: admin.role,
            emailVerified: new Date()
          }
        })
        
        console.log(`✅ Utilisateur créé: ${admin.email} (${admin.role})`)
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${admin.email}:`, error)
    }
  }
  
  console.log('🎉 Opération terminée!')
}

createAdminUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
