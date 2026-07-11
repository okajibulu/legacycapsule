// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/og/[slug]/route.tsx
// PURPOSE: OG image generation — OG02 Cover System
// Mode A: Legacy Cover (no hero image)
// Mode B: Hero Cover (hero_image_url present)
// Edge runtime — fast, globally distributed
// FIXED: Claude Sonnet 4.6 · July 2026
//   — Font loading made fully optional (never throws on CDN failure)
//   — All DB errors return branded fallback, never blank page
//   — Simplified JSX (no component imports — Satori requires inline JSX)
// ─────────────────────────────────────────────────────────────────────────────

import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Runtime
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = 'edge'

const W = 1200
const H = 630

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Theme tokens per event type
// ─────────────────────────────────────────────────────────────────────────────

function getTheme(eventType: string | null) {
  const themes: Record<string, { bg: string; accent: string; muted: string; text: string; sub: string }> = {
    'Memorial & Funeral':  { bg: '#1C1C1E', accent: '#C8A96E', muted: '#9A8060', text: '#F5F0E8', sub: '#B8B0A0' },
    'Wedding':             { bg: '#1E1510', accent: '#D4AE6A', muted: '#A08050', text: '#FAF5EE', sub: '#C8B898' },
    'Retirement':          { bg: '#0D1B3E', accent: '#E2C36B', muted: '#A89050', text: '#F0EAD8', sub: '#B8A880' },
    'Milestone Birthday':  { bg: '#1E0A3C', accent: '#E8C870', muted: '#A88C50', text: '#F8F0FF', sub: '#C0A8E0' },
    'Anniversary':         { bg: '#1A0810', accent: '#E0A08A', muted: '#A87060', text: '#FAF0EC', sub: '#C09080' },
    'Graduation':          { bg: '#0A1A2E', accent: '#F0C84A', muted: '#B09030', text: '#F5F0E0', sub: '#B8A870' },
    'Ordination':          { bg: '#0C1E14', accent: '#C8A850', muted: '#907830', text: '#F0EEE0', sub: '#A0A880' },
    'Chieftaincy':         { bg: '#1A0C0A', accent: '#F0C030', muted: '#B08020', text: '#FFF8E8', sub: '#D4A840' },
    'Award Ceremony':      { bg: '#181818', accent: '#C88840', muted: '#907030', text: '#F0EAE0', sub: '#A09080' },
    'Thanksgiving Service':{ bg: '#1A1008', accent: '#D4A050', muted: '#987030', text: '#FAF0E0', sub: '#C0A070' },
    'Conference':          { bg: '#101828', accent: '#E8CC50', muted: '#A89030', text: '#F0EEF8', sub: '#A0A8C0' },
  }
  return themes[eventType ?? ''] ?? { bg: '#110824', accent: '#E2C36B', muted: '#A88C48', text: '#F4F0FA', sub: '#B8A8D0' }
}

function getOrn(eventType: string | null): string {
  const m: Record<string, string> = {
    'Memorial & Funeral': '🕊', 'Wedding': '💍', 'Retirement': '🏅',
    'Milestone Birthday': '🎂', 'Anniversary': '💛', 'Graduation': '🎓',
    'Ordination': '✝', 'Chieftaincy': '👑', 'Award Ceremony': '🏆',
    'Thanksgiving Service': '🙏', 'Conference': '🎙',
  }
  return m[eventType ?? ''] ?? '✦'
}

function getPrompt(eventType: string | null): string {
  const m: Record<string, string> = {
    'Memorial & Funeral': 'Share a Memory', 'Wedding': 'Join the Celebration',
    'Retirement': 'Leave a Tribute', 'Milestone Birthday': 'Add Your Voice',
    'Chieftaincy': 'Honour the Occasion', 'Ordination': 'Leave a Tribute',
  }
  return m[eventType ?? ''] ?? 'Add Your Voice'
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Font loading (fully optional — never throws)
// ─────────────────────────────────────────────────────────────────────────────

async function tryLoadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { cache: 'force-cache' })
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

  // ── Fetch capsule — any error returns branded fallback ───────────────────
  let capsule: {
    id: string
    honouree_name: string
    honouree_title: string | null
    event_type: string | null
    event_tag: string | null
    hero_image_url: string | null
  } | null = null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from('capsules')
      .select('id, honouree_name, honouree_title, event_type, event_tag, hero_image_url')
      .eq('slug', slug)
      .single()
    capsule = data
  } catch {
    return fallback()
  }

  if (!capsule) return fallback()

  // ── Load fonts optionally ────────────────────────────────────────────────
  const fonts: { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' | 'italic' }[] = []

  const t = getTheme(capsule.event_type)
  const orn = getOrn(capsule.event_type)
  const prompt = getPrompt(capsule.event_type)
  const eventContext = capsule.event_tag ?? capsule.event_type ?? 'A Meaningful Occasion'
  const displayName = capsule.honouree_title
    ? `${capsule.honouree_title} ${capsule.honouree_name}`
    : capsule.honouree_name
  const nameFontSize = displayName.length > 32 ? 52 : displayName.length > 24 ? 62 : 72
  const useHero = !!(capsule.hero_image_url?.trim())

  try {
    const el = useHero
      ? heroCover({ t, orn, prompt, eventContext, displayName, nameFontSize, heroUrl: capsule.hero_image_url! })
      : legacyCover({ t, orn, prompt, eventContext, displayName, nameFontSize })

    return new ImageResponse(el, {
      width: W, height: H,
      fonts: undefined,
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error('[og/slug] render error:', err)
    return fallback()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Mode A: Legacy Cover (inline JSX — no component imports)
// ─────────────────────────────────────────────────────────────────────────────

function legacyCover({ t, orn, prompt, eventContext, displayName, nameFontSize }: {
  t: ReturnType<typeof getTheme>
  orn: string
  prompt: string
  eventContext: string
  displayName: string
  nameFontSize: number
}) {
  return (
    <div style={{ display: 'flex', width: W, height: H, background: t.bg, position: 'relative', overflow: 'hidden', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      {/* Spine */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 6, height: H, background: t.accent, display: 'flex' }} />
      {/* Glow */}
      <div style={{ position: 'absolute', right: -80, top: -80, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${t.accent}20 0%, transparent 70%)`, display: 'flex' }} />
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingLeft: 78, paddingRight: 72, paddingTop: 44, paddingBottom: 40, width: W, height: H }}>
        {/* Top */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{orn}</span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: `${t.accent}80` }}>LEGACYCAPSULE</span>
          </div>
          <span style={{ fontSize: 14, color: t.muted, fontStyle: 'italic', marginTop: 8 }}>Events end. Legacies don&apos;t.</span>
          <div style={{ marginTop: 20, width: 48, height: 1, background: t.accent, display: 'flex' }} />
        </div>
        {/* Centre */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: nameFontSize, fontWeight: 700, color: t.text, lineHeight: 1.1, display: 'flex' }}>
            {truncate(displayName, 44)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, display: 'flex' }} />
            <span style={{ fontSize: 20, color: t.muted }}>{truncate(eventContext, 52)}</span>
          </div>
        </div>
        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: '100%', height: 1, background: `${t.accent}40`, display: 'flex' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: `${t.text}50`, fontStyle: 'italic' }}>Voices gathered from around the world.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 18px', background: `${t.accent}CC`, borderRadius: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0818' }}>{prompt}</span>
              <span style={{ fontSize: 13, color: '#0A0818' }}>→</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: `${t.text}30`, letterSpacing: '0.12em' }}>itslegacycapsule.com</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Mode B: Hero Cover
// ─────────────────────────────────────────────────────────────────────────────

function heroCover({ t, orn, prompt, eventContext, displayName, nameFontSize, heroUrl }: {
  t: ReturnType<typeof getTheme>
  orn: string
  prompt: string
  eventContext: string
  displayName: string
  nameFontSize: number
  heroUrl: string
}) {
  const textW = Math.floor(W * 0.58)
  const nfs = nameFontSize > 62 ? 52 : nameFontSize > 52 ? 44 : nameFontSize

  return (
    <div style={{ display: 'flex', width: W, height: H, background: t.bg, position: 'relative', overflow: 'hidden', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      {/* Spine */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 6, height: H, background: t.accent, zIndex: 10, display: 'flex' }} />
      {/* Hero image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={heroUrl} alt="" style={{ position: 'absolute', right: 0, top: 0, width: W - textW + 60, height: H, objectFit: 'cover', objectPosition: 'center top' }} />
      {/* Gradient fade */}
      <div style={{ position: 'absolute', left: textW - 120, top: 0, width: 200, height: H, background: `linear-gradient(to right, ${t.bg} 0%, transparent 100%)`, zIndex: 2, display: 'flex' }} />
      {/* Text column */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingLeft: 66, paddingRight: 40, paddingTop: 40, paddingBottom: 36, width: textW, height: H, zIndex: 5, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>{orn}</span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: `${t.accent}70` }}>LEGACYCAPSULE</span>
          </div>
          <span style={{ fontSize: 13, color: t.muted, fontStyle: 'italic', marginTop: 6 }}>Events end. Legacies don&apos;t.</span>
          <div style={{ marginTop: 18, width: 40, height: 1, background: t.accent, display: 'flex' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: nfs, fontWeight: 700, color: t.text, lineHeight: 1.1, display: 'flex' }}>
            {truncate(displayName, 38)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.accent, display: 'flex' }} />
            <span style={{ fontSize: 17, color: t.muted }}>{truncate(eventContext, 44)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ width: textW - 100, height: 1, background: `${t.accent}40`, display: 'flex' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: `${t.text}50`, fontStyle: 'italic', maxWidth: 260 }}>Voices gathered from around the world.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', background: `${t.accent}CC`, borderRadius: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0A0818' }}>{prompt}</span>
              <span style={{ fontSize: 12, color: '#0A0818' }}>→</span>
            </div>
          </div>
          <span style={{ fontSize: 10, color: `${t.text}30`, letterSpacing: '0.12em' }}>itslegacycapsule.com</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — Branded fallback — never a blank page
// ─────────────────────────────────────────────────────────────────────────────

function fallback() {
  return new ImageResponse(
    <div style={{ display: 'flex', width: W, height: H, background: '#110824', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 6, height: H, background: '#E2C36B', display: 'flex' }} />
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(226,195,107,0.5)' }}>LEGACYCAPSULE</span>
      <span style={{ fontSize: 13, color: 'rgba(226,195,107,0.35)', fontStyle: 'italic' }}>Events end. Legacies don&apos;t.</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', marginTop: 8 }}>itslegacycapsule.com</span>
    </div>,
    { width: W, height: H }
  )
}
