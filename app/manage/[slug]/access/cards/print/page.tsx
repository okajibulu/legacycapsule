'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/manage/[slug]/access/cards/print/page.tsx
// PURPOSE: Print-ready access card page for the Access Code System.
//          Fetches all generated codes and event config, renders
//          AccessCardPrint with theme selection, scope filtering,
//          and a browser print trigger. Print CSS hides all UI chrome
//          leaving only the card grid on paper.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// PHASE: 6 — Card Templates + Print
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect }    from 'react'
import { useParams, useRouter }   from 'next/navigation'
import { createClient }           from '@supabase/supabase-js'
import AccessCardPrint            from '@/components/manage/access-codes/AccessCardPrint'

// ═══ SECTION 2 — Supabase client ═══

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ═══ SECTION 3 — Design tokens ═══

const gold       = '#E2C36B'
const goldMuted  = 'rgba(226,195,107,0.55)'
const textFaint  = 'rgba(255,255,255,0.28)'
const bg         = '#0f0a1e'

// ═══ SECTION 4 — Types ═══

interface CapsuleData {
  id:             string
  slug:           string
  honouree_name:  string
  event_type:     string
  event_tag:      string | null
  event_date:     string | null
  organiser_email: string
}

interface AccessCode {
  id:               string
  guest_name:       string
  guest_email:      string | null
  participant_type: string
  numeric_code:     string
  qr_payload:       string
  status:           string
  section_name:     string | null
}

interface AccessConfig {
  hall_config:        string
  show_table_on_scan: boolean
  show_tier_on_scan:  boolean
}

// ═══ SECTION 5 — Page component ═══

export default function AccessCardsPrintPage() {
  const params = useParams()
  const router = useRouter()
  const slug   = typeof params?.slug === 'string' ? params.slug : ''

  const [capsule,  setCapsule]  = useState<CapsuleData | null>(null)
  const [codes,    setCodes]    = useState<AccessCode[]>([])
  const [config,   setConfig]   = useState<AccessConfig | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // ── Load all data on mount ─────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return

    const email = typeof window !== 'undefined'
      ? localStorage.getItem('lc_visitor_email')
      : null

    if (!email) {
      setError('Please sign in to access print cards.')
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        // Capsule with ownership check
        const { data: cap } = await supabase
          .from('capsules')
          .select('id, slug, honouree_name, event_type, event_tag, event_date, organiser_email')
          .eq('slug', slug)
          .eq('organiser_email', email)
          .single()

        if (!cap) {
          setError('Capsule not found or access denied.')
          setLoading(false)
          return
        }

        setCapsule(cap as CapsuleData)

        // Codes list
        const codesRes  = await fetch(`/api/access-codes/list?capsule_id=${cap.id}`)
        const codesData = await codesRes.json()
        setCodes(codesData.codes ?? [])

        // Hall config
        const cfgRes  = await fetch(`/api/access-codes/config?capsule_id=${cap.id}`)
        const cfgData = await cfgRes.json()
        if (cfgData.config) setConfig(cfgData.config)

      } catch {
        setError('Failed to load card data. Please try again.')
      }
      setLoading(false)
    }

    load()
  }, [slug])

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontSize: '12px', color: textFaint }}>
          Loading cards…
        </p>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error || !capsule) {
    return (
      <div style={{
        minHeight: '100vh', background: bg,
        padding: '80px 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'rgba(248,113,113,0.8)' }}>
          {error}
        </p>
        <button
          onClick={() => router.push(`/manage/${slug}/access`)}
          style={{
            marginTop: '16px', padding: '9px 22px', borderRadius: '9px',
            border: '1px solid rgba(226,195,107,0.3)',
            background: 'rgba(226,195,107,0.08)',
            color: gold, fontSize: '12px', cursor: 'pointer',
          }}
        >
          ← Back to Access Codes
        </button>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <AccessCardPrint
        capsule={capsule}
        codes={codes}
        hallConfig={config?.hall_config ?? 'free_seating'}
        showSection={config?.show_table_on_scan ?? true}
        showTier={config?.show_tier_on_scan ?? true}
        onBack={() => router.push(`/manage/${slug}/access`)}
      />
    </div>
  )
}
