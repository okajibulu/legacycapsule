// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/team/platform-services/route.ts
// PURPOSE:   Returns the list of available co-admin permissions from the
//            RW-Ecosystem Supabase platform_services table.
//            Called by PermissionPicker component when creating/editing a
//            co-admin account. New services added to platform_services
//            automatically appear here without any code change.
// ARCHITECTURE: CA-SPEC-001 — Step 10.
//               Reads from RW-Ecosystem Supabase via lib/supabase-ecosystem.ts.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
//
// GET — no params required
// Returns: { services: PlatformService[] }
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse }        from 'next/server'
import { ecosystemClient } from '@/lib/supabase-ecosystem'

// ═══ SECTION 1 — Route handler ═══

export async function GET() {
  try {
    const { data, error } = await ecosystemClient
      .from('platform_services')
      .select('key, display_name, description, sort_order')
      .eq('platform', 'legacycapsule')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('[team/platform-services]', error)
      return NextResponse.json(
        { error: 'Could not load permission list. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ services: data ?? [] })
  } catch (err) {
    console.error('[team/platform-services]', err)
    return NextResponse.json(
      { error: 'Could not load permission list. Please try again.' },
      { status: 500 }
    )
  }
}