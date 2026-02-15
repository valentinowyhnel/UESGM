import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase client for Browser/Client-side usage.
 * Uses the ANON key for public access (protected by RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
