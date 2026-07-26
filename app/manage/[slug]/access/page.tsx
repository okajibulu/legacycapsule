'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/manage/[slug]/access/page.tsx
// PURPOSE: Dedicated management page for the Access Code System module.
//          Organiser arrives here from the Services tab after activation.
//          Authenticates via localStorage email, verifies access_codes is
//          in the capsule's components array, and renders AccessCodeModule.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect }       from 'react'
import { useParams, useRouter }      from 'next/navigation'
import { createClient }              from '@supabase/supabase-js'
import AccessCodeModule              from '@/components/manage/access-codes/AccessCodeModule'

// ═══ SECTION 2 — Supabase client ═══

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ═══ SECTION 3 — Design tokens ═══

const gold        = '#E2C36B'
const goldMuted   = 'rgba(226,195,107,0.55)'
const goldFaint   = 'rgba(226,195,107,0.12)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint   = 'rgba(255,255,255,0.28)'
const bg          = '#0f0a1e'

// ═══ SECTION 4 — Capsule interface ═══

interface CapsuleData {
  id:             string
  slug:           string
  honouree_name:  string
  event_type:     string
  event_tag:      string | null
  event_date:     string | null
  components:     string[]
  organiser_email: string
}

// ═══ SECTION 5 — Page component ═══

export default function AccessCodePage() {
  const params = useParams()
  const router = useRouter()
  const slug   = typeof params?.slug === 'string' ? params.slug : ''

  const [capsule,    setCapsule]    = useState<CapsuleData | null>(null)
  const [guestCount, setGuestCount] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // ── Fetch capsule and guest count on mount ─────────────────────────────────

  useEffect(() => {
    if (!slug) return

    const visitorEmail = typeof window !== 'undefined'
      ? localStorage.getItem('lc_visitor_email')
      : null

    if (!visitorEmail) {
      setError('Please sign in to manage your capsule.')
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        // ── Fetch capsule with ownership check ──
        const { data: cap, error: capErr } = await supabase
          .from('capsules')
          .select('id, slug, honouree_name, event_type, event_tag, event_date, components, organiser_email')
          .eq('slug', slug)
          .eq('organiser_email', visitorEmail)
          .single()

        if (capErr || !cap) {
          setError('Capsule not found, or you do not have access.')
          setLoading(false)
          return
        }

        // ── Verify access_codes service is activated ──
        const components = cap.components ?? []
        if (!components.includes('access_codes')) {
          setError('The Access Code System has not been activated for this capsule. Return to your Services tab to activate it.')
          setLoading(false)
          return
        }

        setCapsule(cap as CapsuleData)

        // ── Fetch guest count (only non-deleted rows) ──
        const { count } = await supabase
          .from('guests')
          .select('id', { count: 'exact', head: true })
          .eq('capsule_id', cap.id)
          .is('deleted_at', null)

        setGuestCount(count ?? 0)

      } catch {
        setError('Something went wrong loading your data. Please try again.')
      }
      setLoading(false)
    }

    load()
  }, [slug])

  // ── Navigate back to the manage dashboard ──────────────────────────────────

  const goBack = () => router.push(`/manage/${slug}`)

  // ═══ SECTION 6 — Loading state ═══

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
          <p style={{ fontSize: '12px', color: textFaint }}>Loading Access Code System…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // ═══ SECTION 7 — Error / not-activated state ═══

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
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '18px',
          }}>!</div>

          <p style={{
            fontSize: '13px', color: 'rgba(248,113,113,0.8)',
            lineHeight: 1.65, marginBottom: '20px',
          }}>
            {error}
          </p>

          <button
            onClick={goBack}
            style={{
              padding: '10px 24px', borderRadius: '10px',
              border: `1px solid rgba(226,195,107,0.3)`,
              background: 'rgba(226,195,107,0.08)',
              color: gold, fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ═══ SECTION 8 — Render Access Code Module ═══

  return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <AccessCodeModule
        capsuleId={capsule.id}
        capsuleSlug={capsule.slug}
        honoureeName={capsule.honouree_name}
        eventTag={capsule.event_tag}
        eventDate={capsule.event_date}
        guestCount={guestCount}
        onBack={goBack}
      />
    </div>
  )
}
