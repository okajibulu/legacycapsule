// ============================================================
// FILE PATH: app/api/display/config/route.ts
// PURPOSE:   GET and PATCH display configuration for a capsule.
//            Creates default config record on first GET if none
//            exists. Controls card durations, tempo preset,
//            interstitial frequencies for Offline HTML display.
// ARCHITECTURE: EDS / EDSVR P0 — Phase 1
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkManageAuth } from '@/lib/manageAuth'

// ═══ SECTION 1 — Supabase Client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Default Config ═══

const DEFAULT_CONFIG = {
  theme_override: null,
  voice_duration_secs: 15,
  photo_duration_secs: 8,
  story_duration_secs: 18,
  story_photo_duration_secs: 20,
  story_photos_duration_secs: 22,
  lc_brand_duration_secs: 6,
  qr_screen_duration_secs: 15,
  lc_interstitial_every_n: 10,
  qr_interstitial_every_n: 15,
  tempo_preset: 'standard',
  featured_voice_limit: 3,
  featured_story_limit: 3,
  featured_photo_limit: 5,
}

// ═══ SECTION 3 — Shared Auth + Capsule Resolution ═══

async function resolveAuth(req: NextRequest) {
  const slug =
    req.headers.get('x-capsule-slug') ||
    req.nextUrl.searchParams.get('slug')

  if (!slug) return { error: 'Missing capsule slug', status: 400 }

  const auth = await checkManageAuth(slug)

  if (
    auth.accountType === 'coadmin' &&
    !auth.permissions.includes('event_display')
  ) {
    return { error: 'Unauthorised', status: 403 }
  }

  let capsuleId = auth.capsuleId
  if (!capsuleId) {
    const { data: capsuleRow } = await db
      .from('capsules')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!capsuleRow) return { error: 'Capsule not found', status: 404 }
    capsuleId = capsuleRow.id
  }

  return { capsuleId, accountType: auth.accountType }
}

// ═══ SECTION 4 — GET Handler ═══
// Returns config for capsule. Creates defaults on first access.

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveAuth(req)
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }
    const { capsuleId } = resolved

    const { data: existing } = await db
      .from('event_display_config')
      .select('*')
      .eq('capsule_id', capsuleId)
      .maybeSingle()

    if (existing) return NextResponse.json({ config: existing })

    // First access — create defaults
    const { data: created, error: createError } = await db
      .from('event_display_config')
      .insert({ capsule_id: capsuleId, ...DEFAULT_CONFIG })
      .select()
      .single()

    if (createError) {
      console.error('[EDS config GET] Create default failed:', createError)
      return NextResponse.json({ error: 'Failed to initialise display config.' }, { status: 500 })
    }

    return NextResponse.json({ config: created })
  } catch (err) {
    console.error('[EDS config GET] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ═══ SECTION 5 — PATCH Handler ═══
// Updates allowed config fields. Ignores unknown fields.

const PATCHABLE_FIELDS = [
  'theme_override',
  'voice_duration_secs',
  'photo_duration_secs',
  'story_duration_secs',
  'story_photo_duration_secs',
  'story_photos_duration_secs',
  'lc_brand_duration_secs',
  'qr_screen_duration_secs',
  'lc_interstitial_every_n',
  'qr_interstitial_every_n',
  'tempo_preset',
  'featured_voice_limit',
  'featured_story_limit',
  'featured_photo_limit',
]

export async function PATCH(req: NextRequest) {
  try {
    const resolved = await resolveAuth(req)
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }
    const { capsuleId } = resolved

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    // Allow only known fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of PATCHABLE_FIELDS) {
      if (field in body) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data: config, error: updateError } = await db
      .from('event_display_config')
      .update(updates)
      .eq('capsule_id', capsuleId)
      .select()
      .single()

    if (updateError) {
      console.error('[EDS config PATCH] Update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update display config.' }, { status: 500 })
    }

    return NextResponse.json({ config })
  } catch (err) {
    console.error('[EDS config PATCH] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}