// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/capsule/limits/route.ts
// PURPOSE:   Returns live limit counters for a capsule — used by the
//            manage dashboard Limits Bar component and wall enforcement logic.
//            Reads current usage (live DB counts) and active ceilings from
//            the capsule row (voice_ceiling column set by featureUnlocker).
//            Always returns the full set of counters — client renders all.
// ARCHITECTURE: LC04 Payment Engine + LC02 Event Services Engine.
// BUILT BY:  AI20 · Claude Opus 4.6· 11 August 2026
// UPDATED:   AI20 · Claude Opus 4.6 · 13 August 2026
//            — Tier-aware voice ceiling: reads voice_ceiling from capsule row
//              (set by featureUnlocker on activation/upgrade) instead of
//              always using free_tier_limits table.
//            — Combined voice count: tributes + stories compared to voice_ceiling
//            — contribution_tier now included in response for dashboard display
//            — isPaidTier now reads lifecycle_state + contribution_tier columns
//              instead of checking old capture_preserve/full_platform components
//            — tributary/storiesUnlimited now tier-aware (Estate-∞V = unlimited)
//            — Wall trigger data included: ceiling_pct for 60/80/95/100% checks
// VERSION:   AI20v2.12.01
// DATE:      13 August 2026
//
// GET /api/capsule/limits?capsule_id=xxx
//
// Response shape:
// {
//   is_free_tier:       true,
//   contribution_tier:  'foundation_150v',
//   voice_ceiling:      150,              -- null = unlimited (Estate-∞V)
//   voices: {
//     tributes:  { used: 27, limit: 30,  pct: 90 }
//     stories:   { used: 11, limit: 15,  pct: 73 }
//     combined:  { used: 38, limit: 150, pct: 25, ceiling_pct: 25 }
//   }
//   audio_tributes:  { used: 2, limit: 3, unlimited: false, pct: 67 }
//   video_tributes:  { used: 1, limit: 3, unlimited: false, pct: 33 }
//   event_moments:   { uploaded: 47, displaying: 20, limit: 20, unlimited: false }
//   days_remaining:  { days: 34, expires_at: '2026-09-14', pct: 37 }
//   wall_status:     'open' | 'warning_60' | 'warning_80' | 'warning_95' | 'full'
// }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Free tier defaults ═══
// Fallback if free_tier_limits table is empty or missing.
// Source of truth is LCAdmin → free_tier_limits table.

const FREE_TIER_DEFAULTS = {
  tributes:              30,
  stories:               15,
  audio_tributes:         3,
  video_tributes:         3,
  event_moments_display: 20,
  capsule_days:          90,
  voice_ceiling_free:    30,  // combined ceiling on free tier
}

// ═══ SECTION 3 — Fetch configured free tier limits ═══

async function getFreeTierLimits(): Promise<typeof FREE_TIER_DEFAULTS> {
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
    return FREE_TIER_DEFAULTS
  }
}

// ═══ SECTION 4 — Wall status helper ═══
// Returns the notification tier based on ceiling percentage.
// Used by: Limits Bar (colour), notification email triggers, wall enforcement.

function getWallStatus(
  used: number,
  ceiling: number | null
): 'open' | 'warning_60' | 'warning_80' | 'warning_95' | 'full' {
  if (ceiling === null) return 'open'           // Estate-∞V — no ceiling
  if (used >= ceiling)  return 'full'
  const pct = used / ceiling
  if (pct >= 0.95) return 'warning_95'
  if (pct >= 0.80) return 'warning_80'
  if (pct >= 0.60) return 'warning_60'
  return 'open'
}

// ═══ SECTION 5 — GET handler ═══

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')

  if (!capsule_id) {
    return NextResponse.json(
      { error: 'capsule_id is required.' },
      { status: 400 }
    )
  }

  try {
    // ── Fetch capsule ─────────────────────────────────────────────────────────
    // Now reads Sprint 1 columns: lifecycle_state, contribution_tier, voice_ceiling
    const { data: capsule, error: capsuleError } = await db
      .from('capsules')
      .select('components, expires_at, tier, page_state, lifecycle_state, contribution_tier, voice_ceiling')
      .eq('id', capsule_id)
      .maybeSingle()

    if (capsuleError || !capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    const components: string[] = capsule.components ?? []

    // ── Determine tier status ─────────────────────────────────────────────────
    // Sprint 1: use lifecycle_state + contribution_tier columns.
    // Fallback to old component/tier check for capsules created before Sprint 1.
    const isActivated = capsule.lifecycle_state === 'active' ||
                        components.includes('capture_preserve') ||
                        components.includes('full_platform') ||
                        capsule.tier === 'capture_preserve' ||
                        capsule.tier === 'full_platform'

    const isFreeTier       = !isActivated
    const contributionTier = capsule.contribution_tier ?? (isFreeTier ? 'free' : 'foundation_150v')
    const isEstate         = contributionTier === 'estate_v'

    // ── Voice ceiling ─────────────────────────────────────────────────────────
    // For activated capsules: read from capsule.voice_ceiling (Sprint 1 column).
    // NULL = unlimited (Estate-∞V). 0 = not yet set (use free default).
    // For free tier: read from free_tier_limits table.
    const freeLimits = await getFreeTierLimits()

    let voiceCeiling: number | null
    if (isEstate) {
      voiceCeiling = null                                    // unlimited
    } else if (!isFreeTier && capsule.voice_ceiling) {
      voiceCeiling = capsule.voice_ceiling                  // from Sprint 1 column
    } else {
      voiceCeiling = freeLimits.voice_ceiling_free          // free tier default (30)
    }

    // ── Count tributes ────────────────────────────────────────────────────────
    const { count: tributeCount } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .is('story_topic_id', null)
      .is('deleted_at', null)

    // ── Count stories ─────────────────────────────────────────────────────────
    const { count: storyCount } = await db
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .not('story_topic_id', 'is', null)
      .is('deleted_at', null)

    const tributesUsed = tributeCount ?? 0
    const storiesUsed  = storyCount   ?? 0
    const voicesUsed   = tributesUsed + storiesUsed

    // Individual free tier display limits (shown as sub-counts in notification)
    const tributeDisplayLimit = isFreeTier ? freeLimits.tributes : null
    const storyDisplayLimit   = isFreeTier ? freeLimits.stories  : null

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

    // ── Count event moments ───────────────────────────────────────────────────
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
      const totalDays = isFreeTier ? freeLimits.capsule_days : 180  // 6 months for paid
      daysPct = Math.max(0, Math.min(100, Math.round((daysRemaining / totalDays) * 100)))
    }

    // ── Compute wall status ───────────────────────────────────────────────────
    const wallStatus = getWallStatus(voicesUsed, voiceCeiling)

    // ── Percentage helper ─────────────────────────────────────────────────────
    const pct = (used: number, limit: number | null) =>
      limit === null ? null : Math.min(100, Math.round((used / limit) * 100))

    // ── Build response ────────────────────────────────────────────────────────
    return NextResponse.json({
      is_free_tier:      isFreeTier,
      contribution_tier: contributionTier,
      voice_ceiling:     voiceCeiling,     // null = unlimited
      wall_status:       wallStatus,

      voices: {
        // Combined voice count (tributes + stories) vs tier ceiling
        combined: {
          used:        voicesUsed,
          limit:       voiceCeiling,
          unlimited:   isEstate,
          pct:         pct(voicesUsed, voiceCeiling),
          ceiling_pct: pct(voicesUsed, voiceCeiling),  // alias — used for wall trigger
        },
        // Individual breakdown — shown in notifications and limits bar
        tributes: {
          used:  tributesUsed,
          limit: tributeDisplayLimit,   // null for paid tier (no individual cap)
          pct:   pct(tributesUsed, tributeDisplayLimit),
        },
        stories: {
          used:  storiesUsed,
          limit: storyDisplayLimit,     // null for paid tier (no individual cap)
          pct:   pct(storiesUsed, storyDisplayLimit),
        },
      },

      audio_tributes: {
        used:      audioCount ?? 0,
        limit:     audioUnlimited ? null : freeLimits.audio_tributes,
        unlimited: audioUnlimited,
        pct:       audioUnlimited ? null : pct(audioCount ?? 0, freeLimits.audio_tributes),
      },

      video_tributes: {
        used:      videoCount ?? 0,
        limit:     videoUnlimited ? null : freeLimits.video_tributes,
        unlimited: videoUnlimited,
        pct:       videoUnlimited ? null : pct(videoCount ?? 0, freeLimits.video_tributes),
      },

      event_moments: {
        uploaded:   momentsUploadedCount ?? 0,
        displaying: momentsUnlimited
          ? (momentsUploadedCount ?? 0)
          : Math.min(momentsUploadedCount ?? 0, freeLimits.event_moments_display),
        limit:      momentsUnlimited ? null : freeLimits.event_moments_display,
        unlimited:  momentsUnlimited,
      },

      days_remaining: {
        days:       daysRemaining,
        expires_at: expiresAt,
        pct:        daysPct,
        unlimited:  !capsule.expires_at,
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