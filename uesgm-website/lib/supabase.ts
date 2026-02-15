// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

// Prisma Client is not directly imported to avoid module issues
const prismaClient = (): PrismaClient => {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error']
    });
  } else {
    // In development, use a global variable to prevent multiple instances
    if (!global.prisma) {
      global.prisma = new PrismaClient({
        log: ['query', 'error', 'warn']
      });
    }
    return global.prisma;
  }
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = prismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export { prisma };