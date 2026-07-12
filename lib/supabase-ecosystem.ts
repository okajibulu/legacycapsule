// lib/supabase-ecosystem.ts
// ─── RW-Ecosystem Supabase Client ────────────────────────────────────────────
// Read-only connection to RW-Ecosystem for shared config and feature flags.
// Never use this client for LC operational data — use the LC client for that.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

export const ecosystemClient = createClient(
  process.env.NEXT_PUBLIC_RW_ECOSYSTEM_URL!,
  process.env.RW_ECOSYSTEM_SERVICE_ROLE_KEY!
)