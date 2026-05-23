/* =========================================================
   lib/supabaseAuth.ts
   Browser-side Supabase client specifically for Auth operations.
   Singleton — avoids multiple GoTrueClient warnings.
   
   Usage:
     import { getAuthClient } from '@/lib/supabaseAuth'
     const supabase = getAuthClient()
     await supabase.auth.signInWithOtp({ email })
========================================================= */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let authClient: SupabaseClient | null = null

export function getAuthClient(): SupabaseClient {
  if (!authClient) {
    authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return authClient
}
