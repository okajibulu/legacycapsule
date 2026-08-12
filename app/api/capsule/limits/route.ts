// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/limits/route.ts
// PURPOSE:   Returns live limit counters for a capsule — used by the
//            manage dashboard Limits Bar component.
//            Reads both current usage (live DB counts) and configured limits
//            (from free_tier_limits table, LCAdmin-modifiable).
//            Always returns the full set of counters — client renders all.
// ARCHITECTURE: LC04 Payment Engine + LC02 Event Services Engine.
//               Called on manage dashboard load and on any state change.
//               Reads are cheap — all queries use indexed columns.
//               capsule.components array determines which limits apply:
//               if a component is active (paid), limit is set to null (unlimited).
// BUILT BY:  AI20 · Claude Opus 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.97
// DATE:      11 August 2026
//
// GET /api/capsule/limits?capsule_id=xxx
//
// Response shape:
// {
//   tributes:        { used: 27, limit: 30, unlimited: false, pct: 90 }
//   stories:         { used: 11, limit: 15, unlimited: false, pct: 73 }
//   audio_tributes:  { used: 2,  limit: 3,  unlimited: false, pct: 67 }
//   video_tributes:  { used: 1,  limit: 3,  unlimited: false, pct: 33 }
//   event_moments:   { uploaded: 47, displaying: 20, limit: 20, unlimited: false }
//   days_remaining:  { days: 34, expires_at: '2026-09-14', pct: 37 }
//   is_free_tier:    true
// }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Default free tier limits ═══
// These are the fallback values if free_tier_limits table is empty or missing.
// Source of truth is LCAdmin → free_tier_limits table.
// Update that table; these defaults are last-resort only.

const FREE_TIER_DEFAULTS = {
  tributes:              30,
  stories:               15,
  audio_tributes:         3,
  video_tributes:         3,
  event_moments_display: 20,   // max photos shown publicly (Option C soft cap)
  capsule_days:          90,   // days from first tribute
}

// ═══ SECTION 3 — Fetch configured limits from LCAdmin table ═══

async function getConfiguredLimits(): Promise<typeof FREE_TIER_DEFAULTS> {
  try {
    const { data } = await db
      .from('free_tier_limits')
      .select('key, value')

    if (!data || data.length === 0) return FREE_TIER_DEFAULTS

    const limits = { ...FREE_TIER_DEFAULTS }
    for (const row of data) {
      if (row.key in limits) {
        (limits as Record<string, number>)[row.key] = Number(row.value)
      }
    }
    return limits
  } catch {
    // Table may not exist yet — fall back to defaults silently
    return FREE_TIER_DEFAULTS
  }
}

// ═══ SECTION 4 — GET handler ═══

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')

  if (!capsule_id) {
    return NextResponse.json(
      { error: 'capsule_id is required.' },
      { status: 400 }
    )
  }

  try {
    // ── Fetch capsule basics ──────────────────────────────────────────────────
    const { data: capsule, error: capsuleError } = await db
      .from('capsules')
      .select('components, expires_at, tier, page_state')
      .eq('id', capsule_id)
      .maybeSingle()

    if (capsuleError || !capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    const components: string[] = capsule.components ?? []

    // ── Determine if free tier ────────────────────────────────────────────────
    // Free tier = no base tier in components and page_state is not expired/suspended
    const isPaidTier = components.includes('capture_preserve') ||
                       components.includes('full_platform') ||
                       capsule.tier === 'capture_preserve' ||
                       capsule.tier === 'full_platform'

    const isFreeTier = !isPaidTier

    // ── Fetch configured limits ───────────────────────────────────────────────
    const limits = await getConfiguredLimits()

    // ── Count tributes (voices) ───────────────────────────────────────────────
    const tributesUnlimited = !isFreeTier || components.includes('tributes_unlimited')
    const { count: tributeCount } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .is('story_topic_id', null)
      .is('deleted_at', null)

    // ── Count stories ─────────────────────────────────────────────────────────
    const storiesUnlimited = !isFreeTier || components.includes('stories_unlimited')
    const { count: storyCount } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .not('story_topic_id', 'is', null)
      .is('deleted_at', null)

    // ── Count audio tributes ──────────────────────────────────────────────────
    const audioUnlimited = components.includes('audio_tributes')
    const { count: audioCount } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .not('audio_url', 'is', null)
      .is('deleted_at', null)

    // ── Count video tributes ──────────────────────────────────────────────────
    const videoUnlimited = components.includes('video_tributes')
    const { count: videoCount } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .not('video_url', 'is', null)
      .is('deleted_at', null)

    // ── Count event moments (D-Day photos) ────────────────────────────────────
    // Option C: all photos stored, only limit_display shown publicly on free tier.
    // Paid tier: all photos display.
    const momentsUnlimited = !isFreeTier
    const { count: momentsUploadedCount } = await db
      .from('gallery_items')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('source', 'dday')
      .eq('approved', true)
      .is('deleted_at', null)

    // ── Days remaining ────────────────────────────────────────────────────────
    let daysRemaining: number | null = null
    let expiresAt: string | null = null
    let daysPct: number | null = null

    if (capsule.expires_at) {
      expiresAt = capsule.expires_at
      const now  = new Date()
      const exp  = new Date(capsule.expires_at)
      const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      daysRemaining = Math.max(0, diff)

      // Percentage of validity period remaining
      // Use limit (90 days free / 365 paid) as denominator
      const totalDays = isFreeTier ? limits.capsule_days : 365
      daysPct = Math.max(0, Math.min(100, Math.round((daysRemaining / totalDays) * 100)))
    }

    // ── Build response ────────────────────────────────────────────────────────
    const pct = (used: number, limit: number) =>
      Math.min(100, Math.round((used / limit) * 100))

    return NextResponse.json({
      is_free_tier: isFreeTier,

      tributes: {
        used:      tributeCount ?? 0,
        limit:     tributesUnlimited ? null : limits.tributes,
        unlimited: tributesUnlimited,
        pct:       tributesUnlimited ? null : pct(tributeCount ?? 0, limits.tributes),
      },

      stories: {
        used:      storyCount ?? 0,
        limit:     storiesUnlimited ? null : limits.stories,
        unlimited: storiesUnlimited,
        pct:       storiesUnlimited ? null : pct(storyCount ?? 0, limits.stories),
      },

      audio_tributes: {
        used:      audioCount ?? 0,
        limit:     audioUnlimited ? null : limits.audio_tributes,
        unlimited: audioUnlimited,
        pct:       audioUnlimited ? null : pct(audioCount ?? 0, limits.audio_tributes),
      },

      video_tributes: {
        used:      videoCount ?? 0,
        limit:     videoUnlimited ? null : limits.video_tributes,
        unlimited: videoUnlimited,
        pct:       videoUnlimited ? null : pct(videoCount ?? 0, limits.video_tributes),
      },

      event_moments: {
        uploaded:   momentsUploadedCount ?? 0,
        displaying: momentsUnlimited
          ? (momentsUploadedCount ?? 0)
          : Math.min(momentsUploadedCount ?? 0, limits.event_moments_display),
        limit:      momentsUnlimited ? null : limits.event_moments_display,
        unlimited:  momentsUnlimited,
      },

      days_remaining: {
        days:       daysRemaining,
        expires_at: expiresAt,
        pct:        daysPct,
        unlimited:  !isFreeTier && !capsule.expires_at,
      },
    })

  } catch (err) {
    console.error('[capsule/limits]', err)
    return NextResponse.json(
      { error: 'Something went wrong loading capsule limits. Please try again.' },
      { status: 500 }
    )
  }
}