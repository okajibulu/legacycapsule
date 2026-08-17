// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/update/route.ts
// PURPOSE:   Updates capsule fields from the organiser manage dashboard.
//            Replaces the direct supabase.from('capsules').update() call in
//            manage/[slug]/page.tsx updateCapsule handler.
//            Logs field changes to capsule_activity_log via logAction.
//            Validates that only safe fields can be updated via this route.
//            Uses service role — browser anon client must not update capsules.
// ARCHITECTURE: CA-SPEC-001 — Step 14.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.14
// DATE:      16 August 2026
//
// PATCH body: {
//   capsule_id: string
//   fields: Partial<Capsule>   — only allowlisted fields accepted
//   actor_name?: string
//   actor_email?: string
// }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAction, ACTION_KEYS }    from '@/lib/activity/logAction'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Allowlisted fields ═══
// Only these fields can be updated via this route.
// Never expose page_state, organiser_email, tier, or billing fields
// to browser-initiated updates.

const ALLOWED_FIELDS = new Set([
  'honouree_name',
  'honouree_title',
  'event_type',
  'event_tag',
  'event_date',
  'slug',
  'theme',
  'hero_image_url',
  'hero_image_position',
  'hero_image_zoom',
  'hero_image_fit',
  'hero_panel_size',
  'hero_full_bleed',
  'notification_frequency',
  'organiser_upgraded_to_full_access',
  'organiser_upgraded_at',
])

// ═══ SECTION 3 — Route handler ═══

export async function PATCH(req: NextRequest) {
  try {
    const { capsule_id, fields, actor_name, actor_email } = await req.json()

    if (!capsule_id || !fields || typeof fields !== 'object') {
      return NextResponse.json(
        { error: 'capsule_id and fields are required.' },
        { status: 400 }
      )
    }

    // ── Filter to allowed fields only ─────────────────────────────────────
    const safeFields: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (ALLOWED_FIELDS.has(key)) {
        safeFields[key] = value
      }
    }

    if (Object.keys(safeFields).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 }
      )
    }

    // ── Update capsule ─────────────────────────────────────────────────────
    const { error: updateError } = await db
      .from('capsules')
      .update(safeFields)
      .eq('id', capsule_id)

    if (updateError) {
      console.error('[capsule/update] Update error:', updateError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // ── Determine action key from fields ──────────────────────────────────
    const fieldKeys   = Object.keys(safeFields)
    const isTheme     = fieldKeys.includes('theme')
    const actionKey   = isTheme
      ? ACTION_KEYS.CAPSULE_THEME_CHANGED
      : ACTION_KEYS.CAPSULE_FIELD_UPDATED

    const fieldLabels = fieldKeys
      .map(k => k.replace(/_/g, ' '))
      .join(', ')

    const actionLabel = isTheme
      ? `Changed visual style to ${safeFields.theme}`
      : `Updated capsule details: ${fieldLabels}`

    // ── Log action ─────────────────────────────────────────────────────────
    await logAction({
      capsule_id,
      actor_type:   'organiser',
      actor_name:   actor_name  ?? 'Organiser',
      actor_email:  actor_email ?? '',
      action_key:   actionKey,
      action_label: actionLabel,
      entity_type:  'capsule',
      entity_id:    capsule_id,
      payload:      { fields: fieldKeys },
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[capsule/update]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}