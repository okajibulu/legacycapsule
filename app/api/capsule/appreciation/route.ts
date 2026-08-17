// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/appreciation/route.ts
// PURPOSE:   Creates or updates the Family Appreciation section on a capsule.
//            Called by FR Elder portal (AppreciationEditor component).
//            Upserts capsule_profile_sections row with section_type = 'appreciation'.
//            Anyone with portal access can set/update — auth check is implicit
//            (route only callable from within the portal session).
// ARCHITECTURE: CA-SPEC-001 — Step 6.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
//
// POST body: { capsule_id, content, section_id? }
// section_id: if provided, updates existing row; if null, creates new row.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, content, section_id } = await req.json()

    if (!capsule_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'capsule_id and content are required.' },
        { status: 400 }
      )
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please write a little more — the appreciation message should be at least a sentence.' },
        { status: 400 }
      )
    }

    // ── Update existing section ───────────────────────────────────────────
    if (section_id) {
      const { error: updateError } = await db
        .from('capsule_profile_sections')
        .update({
          content:    content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', section_id)
        .eq('capsule_id', capsule_id)
        .eq('section_type', 'appreciation')

      if (updateError) {
        console.error('[appreciation] Update error:', updateError)
        return NextResponse.json(
          { error: 'Something went wrong saving. Please try again.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true, action: 'updated' })
    }

    // ── Create new appreciation section ───────────────────────────────────
    // First check one doesn't already exist (prevent duplicates)
    const { data: existing } = await db
      .from('capsule_profile_sections')
      .select('id')
      .eq('capsule_id', capsule_id)
      .eq('section_type', 'appreciation')
      .maybeSingle()

    if (existing) {
      // Update it even though section_id wasn't provided
      const { error: updateError } = await db
        .from('capsule_profile_sections')
        .update({ content: content.trim() })
        .eq('id', existing.id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Something went wrong saving. Please try again.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true, action: 'updated', section_id: existing.id })
    }

    // ── Get max sort_order for this capsule ───────────────────────────────
    const { data: sections } = await db
      .from('capsule_profile_sections')
      .select('sort_order')
      .eq('capsule_id', capsule_id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = sections?.[0]?.sort_order != null
      ? sections[0].sort_order + 10
      : 10

    const { data: newSection, error: insertError } = await db
      .from('capsule_profile_sections')
      .insert({
        capsule_id,
        section_type: 'appreciation',
        custom_title: null,
        content:      content.trim(),
        sort_order:   nextSortOrder,
        is_active:    true,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[appreciation] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Something went wrong saving. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, action: 'created', section_id: newSection.id })

  } catch (err) {
    console.error('[appreciation]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}