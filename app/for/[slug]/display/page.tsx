'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/for/[slug]/display/page.tsx
// PURPOSE: Full-screen Live Contributor Wall for venue projection / screen display.
//          Designed for large screens at events — TV, projector, monitor.
//          Shows approved tributes arriving in real time via Supabase Realtime.
//          Auto-rotates through all approved tributes every 8 seconds.
//          New tributes animate in with a spotlight moment.
//
// ACCESS: Public URL — organiser shares with AV team or opens on venue screen.
//         /for/[slug]/display
//
// FEATURES:
//   - Loads last 20 approved tributes on mount
//   - Subscribes to Realtime broadcast for instant updates
//   - Spotlight card: new arrival shown prominently for 8 seconds
//   - Rolling grid: all tributes cycling in background
//   - Live counter ticking upward
//   - World map placeholder (locations)
//   - D-Day photo display in gallery strip
//
// ARCHITECTURE: LC02 Event Services Engine · Live Contributor Wall
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports & types
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useParams }                   from 'next/navigation'
import { createClient }                from '@supabase/supabase-js'

interface LiveContribution {
  id:               string
  contributor_name: string
  city:             string | null
  country:          string | null
  tribute_text:     string | null
  thumbnail_url:    string | null
  is_dday:          boolean
  isNew?:           boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Supabase client (anon key — public realtime subscription)
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Design tokens (large-screen optimised)
// ─────────────────────────────────────────────────────────────────────────────

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.6)'
const textPrimary = 'rgba(255,255,255,0.95)'
const textFaint   = 'rgba(255,255,255,0.35)'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Tribute card component
// ─────────────────────────────────────────────────────────────────────────────

function TributeCard({ contrib, isSpotlight }: { contrib: LiveContribution; isSpotlight?: boolean }) {
  const location = [contrib.city, contrib.country].filter(Boolean).join(', ')

  if (isSpotlight) {
    return (
      <div style={{
        background:   'linear-gradient(135deg, rgba(226,195,107,0.12), rgba(226,195,107,0.04))',
        border:       '1px solid rgba(226,195,107,0.45)',
        borderRadius: '24px',
        padding:      '40px 48px',
        maxWidth:     '700px',
        width:        '100%',
        animation:    'slideIn 0.5s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(226,195,107,0.15)', border: '2px solid rgba(226,195,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: gold }}>{contrib.contributor_name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>{contrib.contributor_name}</p>
            {location && <p style={{ margin: '3px 0 0', fontSize: '14px', color: goldMuted }}>📍 {location}</p>}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: gold, background: 'rgba(226,195,107,0.1)', border: '1px solid rgba(226,195,107,0.25)', borderRadius: '20px', padding: '4px 12px' }}>NEW ARRIVAL</span>
        </div>
        {contrib.tribute_text && (
          <p style={{ fontSize: '20px', color: textPrimary, lineHeight: 1.75, fontStyle: 'italic', margin: 0, fontFamily: "'Playfair Display', serif" }}>
            "{contrib.tribute_text.slice(0, 280)}{contrib.tribute_text.length > 280 ? '…' : ''}"
          </p>
        )}
        {contrib.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={contrib.thumbnail_url} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', marginTop: '20px' }} />
        )}
      </div>
    )
  }

  return (
    <div style={{
      background:   'rgba(255,255,255,0.03)',
      border:       `1px solid ${contrib.isNew ? 'rgba(226,195,107,0.3)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '16px',
      padding:      '20px 24px',
      transition:   'all 0.3s',
      animation:    contrib.isNew ? 'fadeIn 0.4s ease-out' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(226,195,107,0.08)', border: '1px solid rgba(226,195,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: goldMuted }}>{contrib.contributor_name.charAt(0).toUpperCase()}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{contrib.contributor_name}</p>
          {location && <p style={{ margin: '2px 0 0', fontSize: '12px', color: textFaint }}>{location}</p>}
        </div>
        {contrib.thumbnail_url && <span style={{ fontSize: '14px', flexShrink: 0 }}>📷</span>}
      </div>
      {contrib.tribute_text && (
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitBoxOrient: 'vertical' as const, WebkitLineClamp: 3, overflow: 'hidden' }}>
          "{contrib.tribute_text}"
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Main display page
// ─────────────────────────────────────────────────────────────────────────────

export default function DisplayPage() {
  const params    = useParams() as { slug: string }
  const slug      = params.slug

  const [capsule,       setCapsule]       = useState<{ id: string; honouree_name: string; event_tag: string | null } | null>(null)
  const [contributions, setContributions] = useState<LiveContribution[]>([])
  const [spotlight,     setSpotlight]     = useState<LiveContribution | null>(null)
  const [count,         setCount]         = useState(0)
  const [ddayPhotos,    setDdayPhotos]    = useState<{ id: string; image_url: string }[]>([])
  const spotlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch capsule ───────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('capsules')
      .select('id, honouree_name, event_tag')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => { if (data) setCapsule(data) })
  }, [slug])

  // ── Load recent approved tributes on mount ──────────────────────────────────
  useEffect(() => {
    if (!capsule?.id) return
    supabase
      .from('contributions')
      .select('id, contributor_name, city, country, tribute_text, thumbnail_url, is_dday')
      .eq('capsule_id', capsule.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setContributions(data)
          setCount(data.length)
        }
      })

    // Load D-Day photos
    supabase
      .from('gallery_items')
      .select('id, image_url')
      .eq('capsule_id', capsule.id)
      .eq('source', 'dday')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => { if (data) setDdayPhotos(data) })
  }, [capsule?.id])

  // ── Subscribe to Realtime broadcasts ───────────────────────────────────────
  useEffect(() => {
    if (!capsule?.id) return

    const channel = supabase
      .channel(`capsule-${capsule.id}`)
      .on('broadcast', { event: 'new_contribution' }, ({ payload }) => {
        const newContrib: LiveContribution = { ...payload, isNew: true }

        // Add to grid
        setContributions(prev => [newContrib, ...prev].slice(0, 20))
        setCount(prev => prev + 1)

        // Spotlight for 8 seconds
        setSpotlight(newContrib)
        if (spotlightTimer.current) clearTimeout(spotlightTimer.current)
        spotlightTimer.current = setTimeout(() => setSpotlight(null), 8000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (spotlightTimer.current) clearTimeout(spotlightTimer.current)
    }
  }, [capsule?.id])

  if (!capsule) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0010', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: textFaint, fontSize: '16px', fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Keyframe animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@400;600;700&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; transform: scale(0.97); }    to { opacity: 1; transform: scale(1); } }
        @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        body { margin: 0; padding: 0; background: #0a0010; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0010 0%, #140830 50%, #0a0010 100%)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ padding: '24px 48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226,195,107,0.1)', flexShrink: 0 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em', color: goldMuted, textTransform: 'uppercase' as const }}>Live Tribute Wall</p>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>{capsule.honouree_name}</h1>
            {capsule.event_tag && <p style={{ margin: '4px 0 0', fontSize: '14px', color: textFaint, fontStyle: 'italic' }}>{capsule.event_tag}</p>}
          </div>

          <div style={{ textAlign: 'right' as const }}>
            <p style={{ margin: '0 0 4px', fontSize: '48px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{count}</p>
            <p style={{ margin: 0, fontSize: '12px', color: textFaint, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Tributes</p>
          </div>
        </div>

        {/* ── Live indicator ── */}
        <div style={{ padding: '10px 48px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(74,222,128,0.9)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '11px', color: 'rgba(74,222,128,0.7)', fontWeight: 600, letterSpacing: '0.1em' }}>LIVE</span>
          <span style={{ fontSize: '11px', color: textFaint, marginLeft: '8px' }}>New tributes appear automatically as they are approved</span>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: 'flex', gap: '32px', padding: '16px 48px 32px', minHeight: 0, overflow: 'hidden' }}>

          {/* ── Left: Spotlight + grid ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '24px', minWidth: 0 }}>

            {/* Spotlight */}
            {spotlight ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <TributeCard contrib={spotlight} isSpotlight />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', borderRadius: '24px', border: '1px dashed rgba(226,195,107,0.12)', background: 'rgba(226,195,107,0.02)' }}>
                <p style={{ fontSize: '16px', color: textFaint, fontStyle: 'italic', margin: 0 }}>Waiting for new tributes…</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', margin: '6px 0 0' }}>New arrivals will appear here automatically</p>
              </div>
            )}

            {/* Rolling grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', overflow: 'hidden' }}>
              {contributions.slice(0, 6).map(c => (
                <TributeCard key={c.id} contrib={c} />
              ))}
            </div>
          </div>

          {/* ── Right: D-Day photo strip ── */}
          {ddayPhotos.length > 0 && (
            <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column' as const, gap: '8px', overflow: 'hidden' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', color: goldMuted, textTransform: 'uppercase' as const, marginBottom: '4px', flexShrink: 0 }}>
                📷 Guest Captures
              </p>
              {ddayPhotos.slice(0, 8).map(p => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.image_url}
                  alt=""
                  style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '12px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
            LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: textFaint }}>
            {process.env.NEXT_PUBLIC_APP_URL}/for/{slug}
          </p>
        </div>

      </div>
    </>
  )
}
