// ============================================================
// FILE PATH: app/api/stories/react/route.ts
// PURPOSE:   Toggle a reaction on a community story.
//            Uses story_reactions table (contribution_id FK).
//            One reaction type per device per story.
//            Same device can react with multiple types.
//            Returns updated counts for that story.
// ARCHITECTURE: LC05
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.56
// DATE:      9 August 2026
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_REACTIONS = new Set(['heart', 'prayer', 'star', 'sad', 'clap', 'dove'])

export async function POST(req: NextRequest) {
  try {
    const { story_id, capsule_id, reaction, device_token } = await req.json()

    if (!story_id || !capsule_id || !reaction || !device_token) {
      return NextResponse.json({ error: 'story_id, capsule_id, reaction and device_token are required' }, { status: 400 })
    }

    if (!VALID_REACTIONS.has(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    // ── Check if reaction exists ─────────────────────────────────────────────
    const { data: existing } = await db
      .from('story_reactions')
      .select('id')
      .eq('contribution_id', story_id)
      .eq('ip_hash', device_token)
      .eq('emoji', reaction)
      .maybeSingle()

    if (existing) {
      // Toggle off — delete
      await db
        .from('story_reactions')
        .delete()
        .eq('id', existing.id)
    } else {
      // Toggle on — insert
      await db
        .from('story_reactions')
        .insert({
          contribution_id: story_id,
          capsule_id,
          emoji:           reaction,
          ip_hash:         device_token,
        })
    }

    // ── Return updated counts ────────────────────────────────────────────────
    const { data: rows } = await db
      .from('story_reactions')
      .select('emoji')
      .eq('contribution_id', story_id)

    const counts: Record<string, number> = { heart: 0, prayer: 0, star: 0, sad: 0, clap: 0, dove: 0 }
    for (const row of rows ?? []) {
      if (row.emoji in counts) counts[row.emoji]++
    }

    return NextResponse.json({ ok: true, counts, toggled: reaction, state: existing ? 'removed' : 'added' })

  } catch (e: any) {
    console.error('[stories/react]', e)
    return NextResponse.json({ error: e.message ?? 'Failed' }, { status: 500 })
  }
}
