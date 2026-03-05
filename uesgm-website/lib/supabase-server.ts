import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Or SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
