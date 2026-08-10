// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/publication/purge-section/route.ts
// ROUTE: POST /api/publication/purge-section
// PURPOSE: Purges and rebuilds a specific phase_photos section from current
//          gallery_items. Clears stale slots. Returns new layout_config.
// BUILT BY: AI19 · Claude Sonnet 4.6 · 9 August 2026
// VERSION: AI19v2.11.89
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { buildPhaseSection }         from '@/lib/publication/autoArrange'
import type { LayoutConfig, PhasePhotosSection } from '@/lib/publication/types'

// ═══ SECTION 1 — Client ═══

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, section_id } = await req.json()

    if (!capsule_id || !section_id) {
      return NextResponse.json(
        { error: 'capsule_id and section_id are required' },
        { status: 400 }
      )
    }

    // ── Fetch current publication ─────────────────────────────────────────
    const { data: pub, error: pubErr } = await adminClient
      .from('publications')
      .select('id, layout_config')
      .eq('capsule_id', capsule_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (pubErr || !pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 })
    }

    const layout     = pub.layout_config as LayoutConfig
    const sectionIdx = layout.sections.findIndex(s => s.id === section_id)

    if (sectionIdx === -1) {
      return NextResponse.json({ error: 'Section not found in layout' }, { status: 404 })
    }

    const section = layout.sections[sectionIdx] as PhasePhotosSection
    if (section.type !== 'phase_photos') {
      return NextResponse.json(
        { error: 'Only phase_photos sections can be purged' },
        { status: 400 }
      )
    }

    // ── Fetch phase metadata ──────────────────────────────────────────────
    const { data: phaseData } = await adminClient
      .from('capsule_phases')
      .select('id, name, event_date, venue')
      .eq('id', section.phase_id)
      .maybeSingle()

    if (!phaseData) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    // ── Fetch current approved photos for this phase ──────────────────────
    const { data: photos } = await adminClient
      .from('gallery_items')
      .select('id, phase_id, image_url, caption, width_px, height_px, aspect_ratio, created_at, approved')
      .eq('capsule_id', capsule_id)
      .eq('phase_id', section.phase_id)
      .eq('approved', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // ── Rebuild section from scratch ──────────────────────────────────────
    const rebuilt = buildPhaseSection(phaseData, photos ?? [])

    // ── Splice rebuilt section into layout ────────────────────────────────
    const newSections    = [...layout.sections]
    newSections[sectionIdx] = rebuilt as unknown as typeof newSections[number]

    const newLayout: LayoutConfig = { ...layout, sections: newSections }

    // ── Save back to DB ───────────────────────────────────────────────────
    const { error: saveErr } = await adminClient
      .from('publications')
      .update({
        layout_config: newLayout,
        updated_at:    new Date().toISOString(),
      })
      .eq('id', pub.id)

    if (saveErr) {
      return NextResponse.json(
        { error: `Failed to save: ${saveErr.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok:            true,
      photo_count:   (photos ?? []).length,
      slot_count:    rebuilt.slots.length,
      layout_config: newLayout,
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Purge failed'
    console.error('[purge-section]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}