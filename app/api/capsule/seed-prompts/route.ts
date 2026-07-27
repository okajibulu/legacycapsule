// ============================================================
// FILE PATH: app/api/capsule/seed-prompts/route.ts
// PURPOSE:   Seeds event-type-aware + general story prompts into
//            community_story_topics for a capsule at creation time.
//            Called once after capsule is created and verified.
// ARCHITECTURE: LC02 LC05
// BUILT BY:  AI13 - Claude Opus 4.6
// VERSION:   v2.1.7
// DATE:      27 July 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// SECTION 1 -- POST handler
// Body: { capsule_id, event_type }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, event_type: eventTypeParam } = await req.json()

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
    }

    // If event_type not passed, fetch it from the capsule directly
    let event_type = eventTypeParam
    if (!event_type) {
      const { data: cap } = await db
        .from('capsules')
        .select('event_type')
        .eq('id', capsule_id)
        .single()
      event_type = cap?.event_type ?? 'general'
    }

    // Check if prompts already seeded for this capsule
    const { count } = await db
      .from('community_story_topics')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('topic_source', 'system')

    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, skipped: 'prompts already seeded' })
    }

    // Fetch general prompts (added to all capsules)
    const { data: generalPrompts } = await db
      .from('story_prompt_library')
      .select('prompt_text, sort_order')
      .eq('is_general', true)
      .order('sort_order', { ascending: true })

    // Fetch event-type-specific prompts
    const { data: eventPrompts } = await db
      .from('story_prompt_library')
      .select('prompt_text, sort_order')
      .eq('event_type', event_type)
      .eq('is_general', false)
      .order('sort_order', { ascending: true })

    // Combine: event-specific first, then general
    const allPrompts = [
      ...(eventPrompts ?? []).map((p, i) => ({
        capsule_id,
        topic_name:    p.prompt_text,
        topic_source:  'system' as const,
        status:        'active' as const,
        display_order: (i + 1) * 10,
      })),
      ...(generalPrompts ?? []).map((p, i) => ({
        capsule_id,
        topic_name:    p.prompt_text,
        topic_source:  'system' as const,
        status:        'active' as const,
        display_order: ((eventPrompts?.length ?? 0) + i + 1) * 10,
      })),
    ]

    if (allPrompts.length === 0) {
      return NextResponse.json({ ok: true, skipped: 'no prompts found for event type' })
    }

    // Insert all prompts in one operation
    const { error: insertError } = await db
      .from('community_story_topics')
      .insert(allPrompts)

    if (insertError) {
      console.error('[seed-prompts] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to seed prompts' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: allPrompts.length })

  } catch (err) {
    console.error('[seed-prompts]', err)
    return NextResponse.json({ error: 'Failed to seed prompts' }, { status: 500 })
  }
}