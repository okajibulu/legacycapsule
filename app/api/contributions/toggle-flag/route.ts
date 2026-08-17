// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/contributions/toggle-flag/route.ts
// PURPOSE:   Toggles a boolean flag on a contribution (e.g. include_in_publication,
//            include_in_programme_export). Replaces the direct Supabase call in
//            manage/[slug]/page.tsx handleToggleFlag handler.
//            Allowlisted fields only — prevents arbitrary column toggling.
//            Logs action to capsule_activity_log.
// ARCHITECTURE: CA-SPEC-001 — Step 14.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.14
// DATE:      16 August 2026
//
// POST body: {
//   contribution_id: string
//   capsule_id: string
//   field: string        — must be in ALLOWED_FLAGS
//   current_value: boolean
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

// ═══ SECTION 2 — Allowlisted toggle fields ═══

const ALLOWED_FLAGS = new Set([
  'include_in_publication',
  'include_in_programme_export',
  'is_featured',
  'is_pinned',
])

// ═══ SECTION 3 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const {
      contribution_id,
      capsule_id,
      field,
      current_value,
      actor_name,
      actor_email,
    } = await req.json()

    if (!contribution_id || !capsule_id || !field) {
      return NextResponse.json(
        { error: 'contribution_id, capsule_id and field are required.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_FLAGS.has(field)) {
      return NextResponse.json(
        { error: `Field "${field}" cannot be toggled via this route.` },
        { status: 400 }
      )
    }

    const newValue = !current_value

    // ── Fetch contribution for log label ─────────────────────────────────
    const { data: contribution } = await db
      .from('contributions')
      .select('id, contributor_name')
      .eq('id', contribution_id)
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found.' }, { status: 404 })
    }

    // ── Toggle field ──────────────────────────────────────────────────────
    const { error: updateError } = await db
      .from('contributions')
      .update({ [field]: newValue })
      .eq('id', contribution_id)
      .eq('capsule_id', capsule_id)

    if (updateError) {
      console.error('[contributions/toggle-flag] Update error:', updateError)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // ── Log action ─────────────────────────────────────────────────────────
    const fieldLabel = field.replace(/_/g, ' ')
    await logAction({
      capsule_id,
      actor_type:   'organiser',
      actor_name:   actor_name  ?? 'Organiser',
      actor_email:  actor_email ?? '',
      action_key:   ACTION_KEYS.CONTRIBUTION_EDITED,
      action_label: `${newValue ? 'Enabled' : 'Disabled'} "${fieldLabel}" for ${contribution.contributor_name}'s voice`,
      entity_type:  'contribution',
      entity_id:    contribution_id,
      payload:      { field, old_value: current_value, new_value: newValue },
    })

    return NextResponse.json({ ok: true, new_value: newValue })

  } catch (err) {
    console.error('[contributions/toggle-flag]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}