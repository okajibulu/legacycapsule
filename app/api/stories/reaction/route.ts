// ============================================================
// FILE PATH: app/api/stories/reactions/route.ts
// PURPOSE:   GET reaction counts per story and which ones
//            the current device has already reacted to.
//            Called once on Stories room load.
//            Query: ?story_ids=id1,id2,id3&device_token=abc
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storyIdsParam   = searchParams.get('story_ids')
    const deviceToken     = searchParams.get('device_token')

    if (!storyIdsParam) {
      return NextResponse.json({ error: 'story_ids is required' }, { status: 400 })
    }

    const storyIds = storyIdsParam.split(',').filter(Boolean)
    if (storyIds.length === 0) {
      return NextResponse.json({ ok: true, counts: {}, my_reactions: {} })
    }

    // ── Fetch all reactions for these stories ─────────────────────────────────
    const { data: rows } = await db
      .from('story_reactions')
      .select('contribution_id, emoji, ip_hash')
      .in('contribution_id', storyIds)

    // ── Build counts map ──────────────────────────────────────────────────────
    const counts: Record<string, Record<string, number>> = {}
    const myReactions: Record<string, string[]>          = {}

    for (const storyId of storyIds) {
      counts[storyId]     = { heart: 0, prayer: 0, star: 0, sad: 0, clap: 0, dove: 0 }
      myReactions[storyId] = []
    }

    for (const row of rows ?? []) {
      const { contribution_id, emoji, ip_hash } = row
      if (!counts[contribution_id]) continue
      if (emoji in counts[contribution_id]) {
        counts[contribution_id][emoji]++
      }
      if (deviceToken && ip_hash === deviceToken) {
        myReactions[contribution_id].push(emoji)
      }
    }

    return NextResponse.json({ ok: true, counts, my_reactions: myReactions })

  } catch (e: any) {
    console.error('[stories/reactions]', e)
    return NextResponse.json({ error: e.message ?? 'Failed' }, { status: 500 })
  }
}
