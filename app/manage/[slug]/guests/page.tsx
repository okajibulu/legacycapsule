'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/manage/[slug]/guests/page.tsx
// PURPOSE:   Guest Management dedicated page. Auth-gated via localStorage
//            (lc_visitor_email) — same pattern as app/manage/[slug]/access/page.tsx.
//            Component-gated (guest_management in capsule components).
//            Renders GuestModule orchestrator.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// BUILT BY:  AI14 · Claude Opus 4.6 · 29 July 2026
// REPLACES:  AI15 server component version (used cookies — always redirected)
// VERSION:   v2.10.5
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import GuestModule from '@/components/manage/guests/GuestModule'

// ═══ SECTION 2 — Supabase client ═══

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ═══ SECTION 3 — Design tokens ═══

const gold       = '#E2C36B'
const goldMuted  = 'rgba(226,195,107,0.55)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textFaint  = 'rgba(255,255,255,0.28)'
const bg         = '#0f0a1e'

// ═══ SECTION 4 — Page component ═══

export default function GuestsPage() {
  const params = useParams()
  const router = useRouter()
  const slug   = typeof params?.slug === 'string' ? params.slug : ''

  const [capsule,  setCapsule]  = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // ── Load capsule on mount — read session from localStorage ────────────────

  useEffect(() => {
    if (!slug) return

    const visitorEmail = typeof window !== 'undefined'
      ? localStorage.getItem('lc_visitor_email')
      : null

    if (!visitorEmail) {
      router.push(`/manage/${slug}?reason=session_expired`)
      return
    }

    const load = async () => {
      try {
        const { data: cap, error: capErr } = await supabase
          .from('capsules')
          .select('id, slug, honouree_name, event_tag, event_type, event_date, tier, organiser_email, components')
          .eq('slug', slug)
          .eq('organiser_email', visitorEmail)
          .single()

        if (capErr || !cap) {
          setError('Capsule not found or you do not have access.')
          setLoading(false)
          return
        }

        const components: string[] = Array.isArray(cap.components) ? cap.components : []

        if (!components.includes('guest_management')) {
          setError('Guest Management has not been activated for this capsule. Return to Services to activate it.')
          setLoading(false)
          return
        }

        setCapsule(cap)
      } catch {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
    }

    load()
  }, [slug, router])

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            border: '2px solid rgba(226,195,107,0.15)',
            borderTopColor: gold,
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: '12px', color: textFaint }}>
            Loading Guest Management…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !capsule) {
    return (
      <div style={{
        minHeight: '100vh', background: bg,
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '380px', margin: '0 auto',
          padding: '28px 24px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${cardBorder}`,
        }}>
          <p style={{
            fontSize: '13px', color: 'rgba(248,113,113,0.8)',
            lineHeight: 1.65, marginBottom: '20px',
          }}>
            {error}
          </p>
          <button
            onClick={() => router.push(`/manage/${slug}?tab=services`)}
            style={{
              padding: '10px 24px', borderRadius: '10px',
              border: `1px solid rgba(226,195,107,0.3)`,
              background: 'rgba(226,195,107,0.08)',
              color: gold, fontSize: '12px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <GuestModule capsule={capsule} />
    </div>
  )
}
