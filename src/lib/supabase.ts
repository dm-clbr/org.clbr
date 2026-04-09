import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { supabaseCookieStorage } from './supabaseCookieStorage'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Standalone auth cookie key for the CLBR org app.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseCookieStorage,
    storageKey: 'sb-clbr-org-auth',
    autoRefreshToken: true,
    persistSession: true,
  },
})
