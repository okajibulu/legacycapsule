'use client'

/* =========================================================
   BOOKING FLOW — /book
   Premium rebuild. Two paths. Purple/gold theme.
   All Stripe logic preserved intact.

   SCREENS:
   0  — Path chooser (Free / Build Your Capsule / Gift)
   1  — Event type (styled dropdown)
   2  — Capsule details (name, tag, email, slug)
   3  — Package / component selector (Path 2 only)
   4  — Verification code entry
   5  — Live confirmation

   SECTION MAP:
   1.  Imports & types
   2.  Constants
   3.  Helpers (slug, labels, placeholders)
   4.  Shared primitives
   5.  Main component
   6.  — State
   7.  — Effects
   8.  — Handlers
   9.  — Screen renders
       9a. Screen 0 — Path chooser
       9b. Screen 1 — Event type
       9c. Screen 2 — Details
       9d. Screen 3 — Package selector (Path 2)
       9e. Screen 4 — Verify code
       9f. Screen 5 — Confirmed
   10. Suspense wrapper export
========================================================= */

/* =========================================================
   SECTION 1 — IMPORTS & TYPES
========================================================= */
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-browser'

interface ContentMap { [key: string]: string }

interface TierData {
  name: string
  tagline: string
  description: string
  features: string[]
  eur_price: number
  ngn_price: number
  pricing_key: string
}

type Path = 'free' | 'build' | 'gift' | ''

/* =========================================================
   SECTION 2 — CONSTANTS
========================================================= */
const EVENT_TYPES = [
  { emoji: '🏆', label: 'Retirement' },
  { emoji: '🕊️', label: 'Memorial & Funeral' },
  { emoji: '💍', label: 'Wedding' },
  { emoji: '🎂', label: 'Milestone Birthday' },
  { emoji: '💞', label: 'Anniversary' },
  { emoji: '🎓', label: 'Graduation' },
  { emoji: '✝️', label: 'Ordination' },
  { emoji: '👑', label: 'Chieftaincy' },
  { emoji: '🏅', label: 'Award Ceremony' },
  { emoji: '🙏', label: 'Thanksgiving Service' },
  { emoji: '🎤', label: 'Conference' },
  { emoji: '✨', label: 'Other Event' },
]

// Design tokens
const pageBg = 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)'
const gold = '#E2C36B'
const goldBtn = 'linear-gradient(135deg, #E2C36B 0%, #C9A84E 100%)'
const cardBorder = 'rgba(226,195,107,0.15)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'

/* =========================================================
   SECTION 3 — HELPERS
========================================================= */
function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60)
}

function getHonoureeLabel(eventType: string): string {
  switch (eventType) {
    case 'Wedding': return 'Names of the couple'
    case 'Memorial & Funeral': return 'In memory of'
    case 'Milestone Birthday': return 'Who is this celebration for'
    case 'Graduation': return "Graduate's full name"
    case 'Ordination': return "Ordinand's full name"
    case 'Chieftaincy': return "Title holder's full name"
    case 'Conference': return 'Conference or organisation name'
    default: return 'Name of the person being celebrated'
  }
}

function getHonoureePlaceholder(eventType: string): string {
  switch (eventType) {
    case 'Wedding': return 'e.g. James Whitfield & Elena Fontaine'
    case 'Conference': return 'e.g. Global Leadership Summit 2026'
    case 'Chieftaincy': return 'e.g. Chief James Alexander Whitfield'
    case 'Ordination': return 'e.g. Reverend James Alexander Whitfield'
    case 'Graduation': return 'e.g. Dr. James Alexander Whitfield'
    default: return 'e.g. James Alexander Whitfield'
  }
}

function getEventDescription(eventType: string): string {
  switch (eventType) {
    case 'Retirement':           return 'Honour a career well lived and a future well earned.'
    case 'Memorial & Funeral':   return 'Gather every voice and preserve a life that mattered.'
    case 'Wedding':              return 'Capture tributes from loved ones across the world on your special day.'
    case 'Milestone Birthday':   return 'Mark the milestone with voices from everyone who matters.'
    case 'Anniversary':          return 'Celebrate the journey together — every year a story worth telling.'
    case 'Graduation':           return 'Honour the achievement and the years of effort behind it.'
    case 'Ordination':           return 'A sacred moment, preserved with tributes from the congregation.'
    case 'Chieftaincy':          return 'A historic occasion deserving a permanent and dignified record.'
    case 'Award Ceremony':       return 'Capture the recognition and the people who made it possible.'
    case 'Thanksgiving Service': return 'Gratitude gathered from every corner — a moment of collective grace.'
    case 'Conference':           return 'Preserve the voices, ideas, and connections from your gathering.'
    default:                     return 'Every significant moment deserves a permanent record.'
  }
}


/* =========================================================
   SECTION 4 — SHARED PRIMITIVES
========================================================= */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '0 16px 80px',
      }}>
        {children}
      </div>
    </div>
  )
}

function BookLogo() {
  return (
    <Link href="/" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', padding: '28px 0 20px' }}>
      <span style={{
        fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em',
        background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>LEGACY</span>
      <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', marginLeft: '0.1em' }}>CAPSULE</span>
    </Link>
  )
}

function GoldRule() {
  return (
    <div style={{
      width: '100%', maxWidth: '480px', height: '1px', margin: '20px auto',
      background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.35), transparent)',
    }} />
  )
}

function StepBar({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(226,195,107,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Step {step} of {total}
        </span>
      </div>
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${(step / total) * 100}%`,
          background: goldBtn,
          boxShadow: '0 0 8px rgba(226,195,107,0.5)',
          borderRadius: '1px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function PrimaryBtn({ onClick, disabled, loading, children }: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', maxWidth: '480px',
        padding: '14px 24px', borderRadius: '12px',
        fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em',
        border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        background: disabled || loading ? 'rgba(226,195,107,0.12)' : goldBtn,
        color: disabled || loading ? 'rgba(226,195,107,0.4)' : '#1a0845',
        boxShadow: disabled || loading ? 'none' : '0 4px 24px rgba(226,195,107,0.3)',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: '14px', height: '14px', borderRadius: '50%',
            border: '2px solid rgba(226,195,107,0.3)', borderTopColor: gold,
            animation: 'spin 0.8s linear infinite', display: 'inline-block',
          }} />
          {children}
        </>
      ) : children}
    </button>
  )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 20px', borderRadius: '12px',
        fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em',
        border: '1px solid rgba(226,195,107,0.2)',
        background: 'rgba(255,255,255,0.03)',
        color: textFaint, cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

function InputField({ label, hint, error, children }: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block', fontSize: '10px', textTransform: 'uppercase',
        letterSpacing: '0.12em', color: 'rgba(226,195,107,0.55)', marginBottom: '8px',
      }}>{label}</label>
      {children}
      {hint && !error && <p style={{ fontSize: '11px', color: textFaint, marginTop: '5px' }}>{hint}</p>}
      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.22)',
  borderRadius: '10px',
  padding: '13px 16px',
  color: textPrimary,
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

function Footer() {
  return (
    <p style={{
      marginTop: '48px', textAlign: 'center',
      fontSize: '10px', letterSpacing: '0.15em',
      color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase',
    }}>
      VALNEX, UNIPESSOAL LDA · RevoWorldTech
    </p>
  )
}

/* =========================================================
   SECTION 5 — MAIN COMPONENT
========================================================= */
function BookPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentCancelled = searchParams.get('payment') === 'cancelled'
  const retrySlug = searchParams.get('slug') ?? ''

  /* =========================================================
     SECTION 6 — STATE
  ========================================================= */
  const [screen, setScreen] = useState(0)
  const [path, setPath] = useState<Path>('')
  const [eventType, setEventType] = useState('')
  const [tier, setTier] = useState('')
  const [honoureeName, setHonoureeName] = useState('')
  const [eventTag, setEventTag] = useState('')
  const [organiserEmail, setOrganiserEmail] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState<ContentMap>({})
  const [honour, setHonour] = useState<TierData | null>(null)
  const [premier, setPremier] = useState<TierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regionalSymbol, setRegionalSymbol] = useState('€')
  const [regionalHonourPrice, setRegionalHonourPrice] = useState<number | null>(null)
  const [regionalPremierPrice, setRegionalPremierPrice] = useState<number | null>(null)
  // Tracks if capsule was created (for code screen)
  const [capsuleId, setCapsuleId] = useState('')
  const [capsuleSlug, setCapsuleSlug] = useState('')

  /* =========================================================
     SECTION 7 — EFFECTS
  ========================================================= */
  useEffect(() => {
    fetch('/api/regional-prices')
      .then(r => r.json())
      .then(data => {
        if (data.symbol) setRegionalSymbol(data.symbol)
        if (data.honourPrice) setRegionalHonourPrice(data.honourPrice)
        if (data.premierPrice) setRegionalPremierPrice(data.premierPrice)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [contentRes, pricingRes] = await Promise.all([
        supabase.from('lc_content').select('key, value')
          .in('group_key', ['tier_honour', 'tier_premier', 'booking_flow']).order('sort_order'),
        supabase.from('lc_pricing').select('key, eur_price, ngn_price')
          .in('key', ['capture_preserve_base', 'full_platform_base']),
      ])
      const map: ContentMap = {}
      for (const row of contentRes.data ?? []) map[row.key] = row.value
      setContent(map)

      const pricing = pricingRes.data ?? []
      const hp = pricing.find(p => p.key === 'capture_preserve_base')
      const pp = pricing.find(p => p.key === 'full_platform_base')

      const hf: string[] = [], pf: string[] = []
      for (let i = 1; i <= 10; i++) {
        if (map[`tier_honour__feat_${i}`]) hf.push(map[`tier_honour__feat_${i}`])
        if (map[`tier_premier__feat_${i}`]) pf.push(map[`tier_premier__feat_${i}`])
      }
      if (hp) setHonour({ name: map['tier_honour__name'] ?? 'Legacy Honour', tagline: map['tier_honour__tagline'] ?? 'Capture & Preserve', description: map['tier_honour__description'] ?? '', features: hf, eur_price: hp.eur_price, ngn_price: hp.ngn_price, pricing_key: 'capture_preserve_base' })
      if (pp) setPremier({ name: map['tier_premier__name'] ?? 'Legacy Premier', tagline: map['tier_premier__tagline'] ?? 'Full Platform', description: map['tier_premier__description'] ?? '', features: pf, eur_price: pp.eur_price, ngn_price: pp.ngn_price, pricing_key: 'full_platform_base' })
      setLoading(false)
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (!slugManual && honoureeName) setSlug(toSlug(honoureeName))
  }, [honoureeName, slugManual])

  /* =========================================================
     SECTION 8 — HANDLERS
  ========================================================= */

  // Create capsule + send verification code
  async function handleCreateAndVerify() {
    if (!honoureeName.trim() || !organiserEmail.trim() || !slug.trim()) return
    setCreating(true); setError('')
    try {
      const { data, error: insertError } = await supabase
        .from('capsules')
        .insert({
          honouree_name: honoureeName.trim(),
          event_tag: eventTag.trim() || null,
          event_type: eventType,
          organiser_email: organiserEmail.trim().toLowerCase(),
          slug: slug.trim(),
          tier: 'free',
          pricing_key: '',
          visitor_type: path === 'gift' ? 'gift' : 'personal',
          page_state: 'tribute_collection',
          theme: 'classic',
          free_tier_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id, slug').single()

      if (insertError) {
        setError(insertError.code === '23505'
          ? 'That capsule URL is already taken. Please choose a different one.'
          : 'Something went wrong. Please try again.')
        setCreating(false); return
      }

      setCapsuleId(data.id)
      setCapsuleSlug(data.slug)

      // Send 4-char verification code
      await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleId: data.id,
          capsuleSlug: data.slug,
          organiserEmail: organiserEmail.trim().toLowerCase(),
          honoureeName: honoureeName.trim(),
        }),
      })

      setScreen(4)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setCreating(false)
  }

  // Verify the 4-char code entered by user
  async function handleVerifyCode() {
    if (verifyCode.trim().length < 4) return
    setVerifying(true); setVerifyError('')
    try {
      const res = await fetch('/api/email/verify-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleId,
          code: verifyCode.trim().toUpperCase(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setVerifyError('That code is incorrect. Please check your email and try again.')
        setVerifying(false); return
      }

      // Verified — go to confirmation
      setScreen(5)
    } catch {
      setVerifyError('Verification failed. Please try again.')
    }
    setVerifying(false)
  }

  // Retry payment (cancelled Stripe session)
  async function handleRetryPayment() {
    if (!retrySlug || !organiserEmail.trim()) return
    setCreating(true); setError('')
    try {
      const { data: capsule, error: fetchError } = await supabase
        .from('capsules').select('id, slug, honouree_name, tier').eq('slug', retrySlug).single()
      if (fetchError || !capsule) { setError('Could not find your capsule. Please contact support.'); setCreating(false); return }
      const pricingKey = capsule.tier === 'honour' ? 'capture_preserve_base' : 'full_platform_base'
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsule.id, capsule_slug: capsule.slug, tier: capsule.tier, pricing_keys: [pricingKey], honouree_name: capsule.honouree_name, organiser_email: organiserEmail.trim().toLowerCase() }),
      })
      const checkoutData = await checkoutRes.json()
      if (checkoutData.checkout_url) { window.location.href = checkoutData.checkout_url; return }
      setError(checkoutData.error ?? 'Payment setup failed.')
    } catch { setError('Something went wrong.') }
    setCreating(false)
  }

  const selectedTierData = tier === 'honour' ? honour : tier === 'premier' ? premier : null

  /* =========================================================
     SECTION 9 — SCREEN RENDERS
  ========================================================= */

  /* ─────────────────────────────────────────────────────────
     SCREEN 0 — PATH CHOOSER
     Two primary paths + gift option
  ───────────────────────────────────────────────────────── */
  if (screen === 0) {
    const paths = [
      {
        id: 'free' as Path,
        icon: '✦',
        title: 'Go Live Free',
        sub: 'Your tribute wall is live in minutes. No payment needed. Upgrade anytime.',
        tag: 'Start Now',
        tagColor: 'rgba(74,222,128,0.7)',
        tagBorder: 'rgba(74,222,128,0.25)',
      },
      {
        id: 'build' as Path,
        icon: '◈',
        title: 'Build Your Capsule',
        sub: 'Choose exactly what your event needs. Configure and pay upfront. Gift-ready.',
        tag: 'Configure & Pay',
        tagColor: 'rgba(226,195,107,0.75)',
        tagBorder: 'rgba(226,195,107,0.25)',
      },
      {
        id: 'gift' as Path,
        icon: '🎁',
        title: 'Gift a Capsule',
        sub: 'Give the experience as a gift. We set it up for the recipient.',
        tag: 'Gift',
        tagColor: 'rgba(180,140,255,0.7)',
        tagBorder: 'rgba(180,140,255,0.25)',
      },
    ]

    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <BookLogo />

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(22px, 5vw, 28px)',
              fontWeight: 800, color: textPrimary,
              lineHeight: 1.25, marginBottom: '10px',
            }}>
              How would you like to begin?
            </h1>
            <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.6 }}>
              Every capsule starts the same way — your event, preserved and shared.
            </p>
          </div>

          <GoldRule />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '24px 0 32px' }}>
            {paths.map(p => {
              const selected = path === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPath(p.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '20px 20px',
                    borderRadius: '14px',
                    border: `1px solid ${selected ? 'rgba(226,195,107,0.55)' : cardBorder}`,
                    background: selected
                      ? 'rgba(226,195,107,0.07)'
                      : 'rgba(255,255,255,0.03)',
                    boxShadow: selected ? '0 0 24px rgba(226,195,107,0.1)' : 'none',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'flex-start', gap: '16px',
                  }}
                >
                  <span style={{
                    fontSize: '22px', lineHeight: 1, flexShrink: 0,
                    marginTop: '2px',
                    filter: selected ? 'drop-shadow(0 0 8px rgba(226,195,107,0.5))' : 'none',
                  }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>{p.title}</span>
                      <span style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px',
                        border: `1px solid ${p.tagBorder}`,
                        color: p.tagColor,
                        background: 'rgba(255,255,255,0.03)',
                      }}>{p.tag}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6, margin: 0 }}>{p.sub}</p>
                  </div>
                  {selected && (
                    <span style={{ fontSize: '16px', color: gold, flexShrink: 0, marginTop: '2px' }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>

          <PrimaryBtn
            onClick={() => {
              if (!path) return
              if (path === 'gift') { router.push('/gift'); return }
              setScreen(1)
            }}
            disabled={!path}
          >
            Continue →
          </PrimaryBtn>

          <Footer />
        </div>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     SCREEN 1 — EVENT TYPE (dropdown)
  ───────────────────────────────────────────────────────── */
  if (screen === 1) {
    const selectedEvent = EVENT_TYPES.find(e => e.label === eventType)
    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <BookLogo />
          <StepBar step={1} total={3} />

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(20px, 5vw, 26px)',
              fontWeight: 800, color: textPrimary, marginBottom: '8px',
            }}>
              What is the occasion?
            </h1>
            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>
              Choose the event you are creating this capsule for
            </p>
          </div>

          <GoldRule />

          {/* Styled select */}
          <div style={{ position: 'relative', margin: '24px 0 32px' }}>
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              border: `1px solid ${eventType ? 'rgba(226,195,107,0.5)' : 'rgba(226,195,107,0.2)'}`,
              background: eventType ? 'rgba(226,195,107,0.06)' : 'rgba(255,255,255,0.04)',
              transition: 'all 0.2s',
              boxShadow: eventType ? '0 0 20px rgba(226,195,107,0.1)' : 'none',
            }}>
              {/* Selected preview */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px 18px',
                pointerEvents: 'none',
                position: 'absolute', top: 0, left: 0, right: 0,
              }}>
                {selectedEvent
                  ? <>
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{selectedEvent.emoji}</span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: textPrimary }}>{selectedEvent.label}</span>
                  </>
                  : <span style={{ fontSize: '14px', color: textFaint }}>Select occasion type…</span>
                }
                <span style={{ marginLeft: 'auto', color: 'rgba(226,195,107,0.5)', fontSize: '12px' }}>▾</span>
              </div>

              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                style={{
                  width: '100%', padding: '16px 18px',
                  background: 'transparent', border: 'none', outline: 'none',
                  color: 'transparent', fontSize: '15px',
                  cursor: 'pointer', appearance: 'none',
                  WebkitAppearance: 'none',
                  position: 'relative', zIndex: 1,
                }}
              >
                <option value="" disabled>Select occasion type…</option>
                {EVENT_TYPES.map(e => (
                  <option key={e.label} value={e.label} style={{ background: '#1a0845', color: '#fff' }}>
                    {e.emoji} {e.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description hint per type */}
            {eventType && (
              <div style={{
                marginTop: '12px', padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(226,195,107,0.05)',
                border: '1px solid rgba(226,195,107,0.12)',
              }}>
                <p style={{ fontSize: '12px', color: 'rgba(226,195,107,0.65)', margin: 0, lineHeight: 1.6 }}>
                  {getEventDescription(eventType)}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <GhostBtn onClick={() => setScreen(0)}>← Back</GhostBtn>
            <div style={{ flex: 1 }}>
              <PrimaryBtn onClick={() => { if (eventType) setScreen(2) }} disabled={!eventType}>
                Continue →
              </PrimaryBtn>
            </div>
          </div>

          <Footer />
        </div>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     SCREEN 2 — CAPSULE DETAILS
     Name · Tag · Email · Slug
  ───────────────────────────────────────────────────────── */
  if (screen === 2) {
    const canContinue = !!honoureeName.trim() && !!organiserEmail.trim() && organiserEmail.includes('@') && !!slug.trim()

    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <BookLogo />
          <StepBar step={2} total={3} />

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(20px, 5vw, 26px)',
              fontWeight: 800, color: textPrimary, marginBottom: '8px',
            }}>
              About this capsule
            </h1>
            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>
              {getHonoureeLabel(eventType)} · {eventType}
            </p>
          </div>

          <GoldRule />

          {/* Payment cancelled retry banner */}
          {paymentCancelled && retrySlug && (
            <div style={{
              padding: '14px 16px', borderRadius: '12px', marginBottom: '20px',
              border: '1px solid rgba(226,195,107,0.3)',
              background: 'rgba(226,195,107,0.06)',
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(226,195,107,0.8)', lineHeight: 1.65, marginBottom: '10px' }}>
                Your capsule was saved but payment was not completed. Enter your email and complete payment below.
              </p>
              <button
                onClick={handleRetryPayment}
                disabled={creating || !organiserEmail.trim()}
                style={{
                  width: '100%', padding: '11px', borderRadius: '10px',
                  background: goldBtn, color: '#1a0845', border: 'none',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  opacity: creating || !organiserEmail.trim() ? 0.6 : 1,
                }}
              >{creating ? 'Redirecting…' : 'Complete Payment →'}</button>
            </div>
          )}

          <div style={{ margin: '20px 0' }}>
            <InputField label={getHonoureeLabel(eventType)}>
              <input
                style={inputStyle}
                placeholder={getHonoureePlaceholder(eventType)}
                maxLength={80}
                value={honoureeName}
                onChange={e => setHonoureeName(e.target.value)}
              />
            </InputField>

            <InputField
              label="Event Tag"
              hint="A short subtitle shown on the tribute wall — optional but recommended"
            >
              <input
                style={inputStyle}
                placeholder={getEventDescription(eventType)}
                maxLength={80}
                value={eventTag}
                onChange={e => setEventTag(e.target.value)}
              />
            </InputField>

            <InputField
              label="Your Email"
              hint="We'll send a 4-character verification code to confirm your email"
            >
              <input
                type="email"
                style={inputStyle}
                placeholder="you@example.com"
                maxLength={120}
                value={organiserEmail}
                onChange={e => setOrganiserEmail(e.target.value)}
              />
            </InputField>

            <InputField
              label="Capsule URL"
              hint={`Your link: itslegacycapsule.com/for/${slug || 'your-slug'}`}
              error={error || undefined}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '1px solid rgba(226,195,107,0.22)',
                borderRadius: '10px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)',
              }}>
                <span style={{
                  fontSize: '11px', color: textFaint, whiteSpace: 'nowrap',
                  padding: '13px 12px', borderRight: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', flexShrink: 0,
                }}>
                  /for/
                </span>
                <input
                  style={{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }}
                  placeholder="your-slug"
                  maxLength={60}
                  value={slug}
                  onChange={e => { setSlugManual(true); setSlug(toSlug(e.target.value)) }}
                />
              </div>
            </InputField>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <GhostBtn onClick={() => setScreen(1)}>← Back</GhostBtn>
            <div style={{ flex: 1 }}>
              <PrimaryBtn
                onClick={() => handleCreateAndVerify()}
                disabled={!canContinue}
                loading={creating}
              >
                {creating ? 'Creating your capsule…' : 'Send Verification Code →'}
              </PrimaryBtn>
            </div>
          </div>

          <Footer />
        </div>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     SCREEN 4 — VERIFY CODE
     4-char code sent to email. Premium moment.
  ───────────────────────────────────────────────────────── */
  if (screen === 4) {
    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <BookLogo />

          {/* Envelope icon — animated gold glow */}
          <div style={{
            width: '80px', height: '80px', margin: '16px auto 28px',
            borderRadius: '50%',
            border: '1px solid rgba(226,195,107,0.3)',
            background: 'rgba(226,195,107,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', lineHeight: 1,
            boxShadow: '0 0 32px rgba(226,195,107,0.15), 0 0 64px rgba(226,195,107,0.06)',
            animation: 'breathe 3s ease-in-out infinite',
          }}>
            ✉
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(20px, 5vw, 26px)',
            fontWeight: 800, color: textPrimary, marginBottom: '10px',
          }}>
            Check your inbox
          </h1>

          <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.75, marginBottom: '8px' }}>
            We sent a 4-character code to
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: gold, marginBottom: '28px' }}>
            {organiserEmail}
          </p>

          {/* Publication promise */}
          <div style={{
            padding: '16px 18px', borderRadius: '12px', marginBottom: '28px', textAlign: 'left',
            border: '1px solid rgba(226,195,107,0.15)',
            background: 'rgba(226,195,107,0.04)',
          }}>
            <p style={{ fontSize: '12px', color: 'rgba(226,195,107,0.65)', lineHeight: 1.8, margin: 0 }}>
              ✦ At the close of your event, LegacyCapsule automatically compiles every tribute, 
              photo, and voice from your wall into a beautifully designed digital publication, 
              complete with the Capsule Profile you have built. The platform can be triggered to 
              send it to every person who contributed, wherever they are. No designer. No effort. 
              Just a permanent, shareable record of a moment that mattered.
            </p>
          </div>

          {/* Code input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', fontSize: '10px', textTransform: 'uppercase',
              letterSpacing: '0.14em', color: 'rgba(226,195,107,0.55)', marginBottom: '12px',
            }}>
              Enter your verification code
            </label>
            <input
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && verifyCode.length === 4 && handleVerifyCode()}
              placeholder="A1B2"
              maxLength={4}
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '0.5em',
                padding: '18px 24px',
                border: verifyError
                  ? '1px solid rgba(248,113,113,0.5)'
                  : verifyCode.length === 4
                  ? '1px solid rgba(226,195,107,0.55)'
                  : '1px solid rgba(226,195,107,0.22)',
              }}
              autoFocus
              autoComplete="off"
            />
            {verifyError && (
              <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginTop: '8px' }}>{verifyError}</p>
            )}
          </div>

          <PrimaryBtn
            onClick={handleVerifyCode}
            disabled={verifyCode.length < 4}
            loading={verifying}
          >
            {verifying ? 'Verifying…' : 'Verify & Open Capsule →'}
          </PrimaryBtn>

          <p style={{ fontSize: '11px', color: textFaint, marginTop: '16px', lineHeight: 1.65 }}>
            Didn't receive it? Check your spam folder, or{' '}
            <button
              onClick={handleCreateAndVerify}
              style={{ background: 'none', border: 'none', color: 'rgba(226,195,107,0.6)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline', padding: 0 }}
            >
              resend the code
            </button>
          </p>

          <Footer />
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes breathe { 0%,100%{box-shadow:0 0 32px rgba(226,195,107,0.15),0 0 64px rgba(226,195,107,0.06)} 50%{box-shadow:0 0 48px rgba(226,195,107,0.28),0 0 80px rgba(226,195,107,0.12)} }
        `}</style>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     SCREEN 5 — CONFIRMED
     Capsule is live. Premium landing moment.
  ───────────────────────────────────────────────────────── */
  return (
    <Shell>
      <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
        <BookLogo />

        {/* Gold circle mark */}
        <div style={{
          width: '88px', height: '88px', margin: '24px auto 32px',
          borderRadius: '50%',
          border: '1px solid rgba(226,195,107,0.4)',
          background: 'radial-gradient(circle, rgba(226,195,107,0.12) 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', lineHeight: 1,
          boxShadow: '0 0 40px rgba(226,195,107,0.2), 0 0 80px rgba(226,195,107,0.08)',
        }}>
          ✦
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(22px, 6vw, 30px)',
          fontWeight: 800, color: textPrimary, marginBottom: '12px',
          textShadow: '0 0 32px rgba(226,195,107,0.2)',
        }}>
          Your capsule is live
        </h1>

        <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.75, marginBottom: '28px', maxWidth: '340px', margin: '0 auto 28px' }}>
          We have created your LegacyCapsule for{' '}
          <span style={{ color: textPrimary, fontWeight: 600 }}>{honoureeName}</span>.
          Share the link below and the tributes will begin to arrive.
        </p>

        {/* Capsule link */}
        <div style={{
          padding: '16px 18px', borderRadius: '12px', marginBottom: '24px',
          border: '1px solid rgba(226,195,107,0.25)',
          background: 'rgba(226,195,107,0.06)',
        }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,195,107,0.5)', marginBottom: '6px' }}>Your capsule link</p>
          <p style={{ fontSize: '13px', color: gold, wordBreak: 'break-all', fontWeight: 600 }}>
            itslegacycapsule.com/for/{capsuleSlug || slug}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <Link
            href={`/manage/${capsuleSlug || slug}`}
            style={{
              display: 'block', padding: '14px', borderRadius: '12px', textDecoration: 'none',
              background: goldBtn, color: '#1a0845', fontSize: '14px', fontWeight: 700,
              letterSpacing: '0.04em', textAlign: 'center',
              boxShadow: '0 4px 24px rgba(226,195,107,0.3)',
            }}
          >
            Open Your Dashboard →
          </Link>

          <Link
            href={`/for/${capsuleSlug || slug}`}
            target="_blank"
            style={{
              display: 'block', padding: '13px', borderRadius: '12px', textDecoration: 'none',
              border: '1px solid rgba(226,195,107,0.22)',
              background: 'rgba(226,195,107,0.05)',
              color: 'rgba(226,195,107,0.75)', fontSize: '13px', fontWeight: 600,
              textAlign: 'center', letterSpacing: '0.04em',
            }}
          >
            View Tribute Wall ↗
          </Link>
        </div>

        <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.65 }}>
          A management link has also been sent to {organiserEmail}
        </p>

        <Footer />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Shell>
  )
}

/* =========================================================
   SECTION 10 — SUSPENSE WRAPPER EXPORT
   Required by Next.js for useSearchParams
========================================================= */
export default function BookPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: pageBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '2px solid rgba(226,195,107,0.2)', borderTopColor: gold,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <BookPage />
    </Suspense>
  )
}
