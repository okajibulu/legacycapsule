// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/og/[slug]/route.tsx
// ROUTE: GET /api/og/[slug]
// PURPOSE: LC-SHARE-002 — Dynamic Share Card image generation
//          Returns a 1200×630 PNG for OG previews on WhatsApp, Facebook,
//          LinkedIn, Telegram, X, and email clients.
//          Uses next/og ImageResponse (Satori) — edge-rendered, no timeout risk.
//          Free for all capsules (D11).
// OWNER: AI7
// ─────────────────────────────────────────────────────────────────────────────

import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Config
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const runtime = 'edge'
const WIDTH = 1200
const HEIGHT = 630

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Event type colour schemes
// ─────────────────────────────────────────────────────────────────────────────

type EventScheme = {
  bg: string           // gradient background when no hero
  accent: string       // gold/accent colour
  accentMuted: string  // softer accent
  badge: string        // event type emoji
}

function getEventScheme(eventType: string): EventScheme {
  const type = eventType?.toLowerCase() ?? ''

  if (type.includes('memorial') || type.includes('funeral'))
    return { bg: 'linear-gradient(145deg, #0a0510 0%, #1a0d3a 40%, #2a1060 100%)', accent: '#B8960C', accentMuted: '#8a7020', badge: '🕊️' }
  if (type.includes('retirement'))
    return { bg: 'linear-gradient(145deg, #0f0818 0%, #2D1B69 45%, #1a0f35 100%)', accent: '#E2C36B', accentMuted: '#B8960C', badge: '🏅' }
  if (type.includes('wedding'))
    return { bg: 'linear-gradient(145deg, #1a0f0a 0%, #3a2215 45%, #2a1508 100%)', accent: '#C9A96E', accentMuted: '#a08550', badge: '💍' }
  if (type.includes('birthday'))
    return { bg: 'linear-gradient(145deg, #18060a 0%, #4b1730 45%, #2a0d18 100%)', accent: '#E2C36B', accentMuted: '#c4a050', badge: '🎂' }
  if (type.includes('graduation'))
    return { bg: 'linear-gradient(145deg, #060d1e 0%, #0D1B3E 45%, #1a2d5e 100%)', accent: '#D4AE2A', accentMuted: '#b89520', badge: '🎓' }
  if (type.includes('chieftaincy'))
    return { bg: 'linear-gradient(145deg, #120d06 0%, #2a1b08 45%, #4b3212 100%)', accent: '#D4AE2A', accentMuted: '#B8960C', badge: '👑' }
  if (type.includes('ordination'))
    return { bg: 'linear-gradient(145deg, #0a1a10 0%, #1B3A2D 45%, #2a5040 100%)', accent: '#C8A96E', accentMuted: '#a08550', badge: '✝️' }
  if (type.includes('anniversary'))
    return { bg: 'linear-gradient(145deg, #18060a 0%, #3a1520 45%, #2a0d18 100%)', accent: '#E2C36B', accentMuted: '#c4a050', badge: '💛' }
  if (type.includes('thanksgiving'))
    return { bg: 'linear-gradient(145deg, #0a1a10 0%, #1B3A2D 45%, #2a5040 100%)', accent: '#C8A96E', accentMuted: '#a08550', badge: '🙏' }
  if (type.includes('conference'))
    return { bg: 'linear-gradient(145deg, #060d1e 0%, #0D1B3E 45%, #1a2d5e 100%)', accent: '#D4AE2A', accentMuted: '#b89520', badge: '🎙️' }
  if (type.includes('award'))
    return { bg: 'linear-gradient(145deg, #0f0818 0%, #2D1B69 45%, #1a0f35 100%)', accent: '#D4AE2A', accentMuted: '#B8960C', badge: '🏆' }

  // Default — classic purple/gold
  return { bg: 'linear-gradient(145deg, #0a0518 0%, #2D1B69 45%, #1a0f35 100%)', accent: '#E2C36B', accentMuted: '#B8960C', badge: '✦' }
}

function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'Memorial & Funeral': 'Memorial',
    'Retirement': 'Retirement Celebration',
    'Wedding': 'Wedding Celebration',
    'Milestone Birthday': 'Birthday Celebration',
    'Graduation': 'Graduation',
    'Chieftaincy Ceremony': 'Chieftaincy Ceremony',
    'Ordination': 'Ordination',
    'Anniversary': 'Anniversary',
    'Thanksgiving Service': 'Thanksgiving Service',
    'Conference': 'Conference',
    'Award Ceremony': 'Award Ceremony',
  }
  return labels[eventType] ?? eventType ?? 'Tribute Collection'
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // ── Fetch capsule data ─────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: capsule } = await supabase
    .from('capsules')
    .select('id, honouree_name, event_type, event_tag, hero_image_url')
    .eq('slug', slug)
    .single()

  if (!capsule) {
    return new Response('Not found', { status: 404 })
  }

  // ── Fetch participation stats ──────────────────────────────────────────
  const { data: summary } = await supabase
    .from('capsule_participation_summary')
    .select('contributor_count, photo_count, country_count')
    .eq('capsule_id', capsule.id)
    .single()

  const contributorCount = summary?.contributor_count ?? 0
  const photoCount = summary?.photo_count ?? 0
  const countryCount = summary?.country_count ?? 0
  const hasStats = contributorCount > 0

  const scheme = getEventScheme(capsule.event_type)
  const eventLabel = getEventLabel(capsule.event_type)
  const heroUrl = capsule.hero_image_url

  // ── Build stats line ───────────────────────────────────────────────────
  const statParts: string[] = []
  if (contributorCount > 0) statParts.push(`${contributorCount} Tribute${contributorCount !== 1 ? 's' : ''}`)
  if (photoCount > 0) statParts.push(`${photoCount} Photo${photoCount !== 1 ? 's' : ''}`)
  if (countryCount > 0) statParts.push(`${countryCount} ${countryCount !== 1 ? 'Countries' : 'Country'}`)
  const statsLine = statParts.join('  ·  ')

  // ── Load fonts ─────────────────────────────────────────────────────────
  // Playfair Display Bold for honouree name
  // DM Sans for body text
const playfairData = undefined
const dmSansData = undefined
  // ── Render card ────────────────────────────────────────────────────────
  return new ImageResponse(
    (
<div
  style={{
    color: '#ffffff',
    fontSize: 72,
    display: 'flex',
  }}
>
  TEST IMAGE

{/* Hero temporarily disabled for debugging */}

        {/* Background gradient — always rendered (overlay on hero, full bg if no hero) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            background: heroUrl
              ? 'linear-gradient(to bottom, rgba(10,5,24,0.6) 0%, rgba(10,5,24,0.4) 30%, rgba(10,5,24,0.85) 70%, rgba(10,5,24,0.95) 100%)'
              : scheme.bg,
            display: 'flex',
          }}
        />

        {/* ── Decorative top accent line ── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: WIDTH,
            height: 3,
            background: `linear-gradient(to right, transparent 10%, ${scheme.accent} 50%, transparent 90%)`,
            display: 'flex',
          }}
        />

        {/* ── Content ── */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '48px 60px',
          }}
        >
          {/* Event type badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '28px' }}>{scheme.badge}</span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase' as const,
                color: scheme.accent,
              }}
            >
              {eventLabel}
            </span>
          </div>

          {/* Honouree name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontFamily: 'Playfair Display',
                fontSize: capsule.honouree_name.length > 24 ? '52px' : '64px',
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 1.1,
                textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                maxWidth: '1000px',
              }}
            >
              {capsule.honouree_name}
            </span>
          </div>

          {/* Event tag */}
          {capsule.event_tag && (
            <span
              style={{
                fontSize: '20px',
                color: scheme.accent,
                letterSpacing: '0.08em',
                fontWeight: 500,
                marginBottom: '8px',
                textAlign: 'center',
                maxWidth: '800px',
              }}
            >
              {capsule.event_tag}
            </span>
          )}

          {/* Gold rule */}
          <div
            style={{
              width: '120px',
              height: '2px',
              background: scheme.accent,
              marginTop: '20px',
              marginBottom: '20px',
              opacity: 0.6,
              display: 'flex',
            }}
          />

          {/* Stats bar — only if there are contributions */}
          {hasStats && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 28px',
                borderRadius: '30px',
                background: 'rgba(0,0,0,0.35)',
                border: `1px solid rgba(255,255,255,0.1)`,
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                {statsLine}
              </span>
            </div>
          )}

          {/* Tagline when no stats */}
          {!hasStats && (
            <span
              style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em',
              }}
            >
              A growing collection of voices
            </span>
          )}
        </div>

        {/* ── Bottom branding bar ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: WIDTH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 40px',
            background: 'rgba(0,0,0,0.4)',
            borderTop: `1px solid rgba(255,255,255,0.06)`,
          }}
        >
          {/* Left: wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                color: scheme.accent,
              }}
            >
              LEGACY
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              CAPSULE
            </span>
          </div>

          {/* Right: domain */}
          <span
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.06em',
            }}
          >
            itslegacycapsule.com
          </span>
        </div>

        {/* ── Decorative bottom accent line ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: WIDTH,
            height: 3,
            background: `linear-gradient(to right, transparent 10%, ${scheme.accent} 50%, transparent 90%)`,
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
 fonts: [],
    }
  )
}
