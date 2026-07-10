// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/og/[slug]/route.tsx
// PURPOSE: OG image generation — implements OG02 Cover System
// Mode A: Legacy Cover (no hero image) — always available
// Mode B: Hero Cover (hero image present) — used when hero_image_url is set
// Edge runtime — fast, globally distributed, no cold starts
// ─────────────────────────────────────────────────────────────────────────────

import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { resolveCoverTheme, getParticipationPrompt, getLegacyStatement } from '@/lib/og/CoverThemeResolver'
import { getLegacySnapshot } from '@/lib/og/getLegacySnapshot'
import OpenGraphCover from '@/components/og/OpenGraphCover'
import OpenGraphHeroCover from '@/components/og/OpenGraphHeroCover'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Edge runtime declaration
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = 'edge'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Constants
// ─────────────────────────────────────────────────────────────────────────────

const W = 1200
const H = 630

// Cache for 1 hour — revalidates as new tributes come in without hammering DB
// Using s-maxage + stale-while-revalidate for CDN edge caching
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Font loading
// DM Sans from Google Fonts — loaded once per edge invocation
// Self-hosting preferred if latency becomes an issue in production
// ─────────────────────────────────────────────────────────────────────────────

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      'https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHQ.woff2',
      { cache: 'force-cache' }
    )
    if (!res.ok) return null
    return res.arrayBuffer()
  } catch {
    return null
  }
}

async function loadFontBold(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      'https://fonts.gstatic.com/s/dmsans/v15/rP2Cp2ywxg089UriASitCBimCw.woff2',
      { cache: 'force-cache' }
    )
    if (!res.ok) return null
    return res.arrayBuffer()
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // ── 4.1 Fetch capsule data ────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: capsule } = await supabase
    .from('capsules')
    .select('id, honouree_name, honouree_title, event_type, event_tag, hero_image_url, page_state')
    .eq('slug', slug)
    .single()

  // ── 4.2 Handle missing or suspended capsule — return branded fallback ─────
  if (!capsule || capsule.page_state === 'suspended') {
    return fallbackResponse()
  }

  // ── 4.3 Resolve cover assets in parallel ─────────────────────────────────
  const [snapshot, fontRegular, fontBold] = await Promise.all([
    getLegacySnapshot(capsule.id),
    loadFont(),
    loadFontBold(),
  ])

  // ── 4.4 Build theme tokens ────────────────────────────────────────────────
  const theme = resolveCoverTheme(capsule.event_type)
  const participationPrompt = getParticipationPrompt(capsule.event_type)
  const legacyStatement = getLegacyStatement(capsule.event_type)

  // ── 4.5 Build event context label (OG02 Level 4) ─────────────────────────
  const eventContext = buildEventContext(capsule.event_type, capsule.event_tag)

  // ── 4.6 Fonts config ─────────────────────────────────────────────────────
const fonts: { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' | 'italic' }[] = []
  if (fontRegular) {
    fonts.push({ name: 'DM Sans', data: fontRegular, weight: 400, style: 'normal' })
  }
  if (fontBold) {
    fonts.push({ name: 'DM Sans', data: fontBold, weight: 700, style: 'normal' })
  }

  // ── 4.7 Select mode: B (Hero) if hero_image_url exists, else A (Legacy) ──
  const useHeroMode = !!(capsule.hero_image_url && capsule.hero_image_url.trim())

  const coverProps = {
    honoureeName: capsule.honouree_name ?? 'A Legacy',
    honoureeTitle: capsule.honouree_title ?? null,
    eventContext,
    snapshot,
    theme,
    participationPrompt,
    legacyStatement,
  }

  try {
    const element = useHeroMode
      ? OpenGraphHeroCover({ ...coverProps, heroImageUrl: capsule.hero_image_url! })
      : OpenGraphCover(coverProps)

    const response = new ImageResponse(element, {
      width: W,
      height: H,
      fonts: fonts.length > 0 ? fonts : undefined,
    })

    // Add cache headers
    response.headers.set('Cache-Control', CACHE_CONTROL)
    return response

  } catch (err) {
    console.error('[og/slug] ImageResponse error:', err)
    return fallbackResponse()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Event context builder (OG02 Level 4)
// Constructs a human-readable event context line
// ─────────────────────────────────────────────────────────────────────────────

function buildEventContext(
  eventType: string | null | undefined,
  eventTag: string | null | undefined
): string {
  // If organiser provided an event tag, use it — it's more specific
  if (eventTag && eventTag.trim()) return eventTag.trim()

  // Fall back to formatted event type
  const TYPE_LABELS: Record<string, string> = {
    'Memorial & Funeral': 'Celebration of Life',
    'Wedding': 'Wedding Celebration',
    'Retirement': 'Retirement Celebration',
    'Milestone Birthday': 'Birthday Celebration',
    'Anniversary': 'Anniversary Celebration',
    'Graduation': 'Graduation Celebration',
    'Ordination': 'Ordination Service',
    'Chieftaincy Ceremony': 'Chieftaincy Celebration',
    'Award Ceremony': 'Award Celebration',
    'Thanksgiving Service': 'Thanksgiving Service',
    'Conference': 'Conference & Convention',
    'Other': 'A Meaningful Occasion',
  }

  return TYPE_LABELS[eventType ?? ''] ?? 'A Meaningful Occasion'
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Branded fallback for errors and missing capsules
// OG02 Premium Default Rule: never show an unfinished cover
// ─────────────────────────────────────────────────────────────────────────────

function fallbackResponse(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: W,
          height: H,
          background: 'linear-gradient(160deg, #110824 0%, #1A0F3A 40%, #0E0820 100%)',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Spine */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 6,
            height: H,
            background: 'linear-gradient(to bottom, #E2C36B, #A88C48, #E2C36B)',
            display: 'flex',
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(226,195,107,0.4)',
          }}
        >
          LEGACYCAPSULE
        </span>
        <span
          style={{
            fontSize: 13,
            color: 'rgba(226,195,107,0.3)',
            fontStyle: 'italic',
          }}
        >
          Events end. Legacies don&apos;t.
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.12em',
            marginTop: 8,
          }}
        >
          itslegacycapsule.com
        </span>
      </div>
    ),
    { width: W, height: H }
  )
}
