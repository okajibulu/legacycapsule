'use client'

/* =========================================================
   FILE PATH: app/book/page.tsx
   BOOKING FLOW — /book
   Premium rebuild v3. Three paths. Purple/gold theme.

   SCREENS:
   0  — Path chooser (Free / Book a Capsule)
   1  — Event type
   2  — Capsule details (+ recipient fields in gift mode)
   4  — Verification code
   3  — Services selector (Book a Capsule path only, after verification)
   5  — Live confirmation

   SECTION MAP:
   1.  Imports & types
   2.  Constants — event types, design tokens, suggested services
   3.  Helpers — slug, labels, placeholders, descriptions
   4.  Shared primitives
   5.  Main component
   6.  — State
   7.  — Effects
   8.  — Handlers
   9.  — Screen renders
       9a. Screen 0 — Path chooser
       9b. Screen 1 — Event type
       9c. Screen 2 — Details
       9d. Screen 4 — Verify code
       9e. Screen 3 — Services selector
       9f. Screen 5 — Confirmed
   10. Suspense wrapper export

   UPDATED: AI12 · Claude Opus 4.6 · 20 July 2026
   — Services now read from lib/content/serviceDetails.ts (single source of truth)
   — Always Included strip is path-aware (free vs pre-booked)
   — Free items include "Find out more" links to help page
   — Services grouped by category with visual dividers (no headers)
   — Access Codes and Additional Phase added to service selector
   — Extended Validity NOT shown at booking (ServicesTab only)
   — Voice/Video durations corrected to 60 seconds
   — Guest Management copy updated with RSVP, VVIP, full participant types
   — All copy written from organiser's mental model
========================================================= */

/* =========================================================
   SECTION 1 — IMPORTS & TYPES
========================================================= */
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase-browser'
import {
  SERVICE_DETAILS,
  BOOKING_SERVICE_ORDER,
  CATEGORY_BREAKS,
} from '../../lib/content/serviceDetails'

interface ContentMap { [key: string]: string }
type Path = 'free' | 'book' | ''
type BookMode = 'own' | 'gift'

/* =========================================================
   SECTION 2 — CONSTANTS
========================================================= */

// ═══ Event Types ═══
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

// ═══ Suggested services pre-selected per event type ═══
const SUGGESTED_BY_EVENT: Record<string, string[]> = {
  'Retirement':           ['publication', 'ways_to_honour', 'audio_tributes'],
  'Memorial & Funeral':   ['publication', 'ways_to_honour'],
  'Wedding':              ['publication', 'ways_to_honour', 'attire', 'guest_management', 'access_codes'],
  'Milestone Birthday':   ['publication', 'ways_to_honour', 'audio_tributes'],
  'Anniversary':          ['publication', 'ways_to_honour'],
  'Graduation':           ['publication', 'audio_tributes'],
  'Ordination':           ['publication', 'ways_to_honour'],
  'Chieftaincy':          ['publication', 'ways_to_honour', 'guest_management', 'attire', 'access_codes'],
  'Award Ceremony':       ['publication', 'guest_management', 'access_codes'],
  'Thanksgiving Service': ['publication', 'ways_to_honour'],
  'Conference':           ['publication', 'guest_management', 'access_codes'],
  'Other Event':          ['publication'],
}

// ═══ Design tokens ═══
const pageBg = 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)'
const gold = '#E2C36B'
const goldBtn = 'linear-gradient(135deg, #E2C36B 0%, #C9A84E 100%)'
const cardBorder = 'rgba(226,195,107,0.15)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'
const greenAccent = 'rgba(74,222,128,0.8)'
const greenBg = 'rgba(74,222,128,0.04)'
const greenBorder = 'rgba(74,222,128,0.1)'

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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 80px' }}>
        {children}
      </div>
    </div>
  )
}

function BookLogo() {
  return (
    <Link href="/" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', padding: '28px 0 20px' }}>
      <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em', background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
      <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', marginLeft: '0.1em' }}>CAPSULE</span>
    </Link>
  )
}

function GoldRule() {
  return <div style={{ width: '100%', maxWidth: '480px', height: '1px', margin: '20px auto', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.35), transparent)' }} />
}

function StepBar({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(226,195,107,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Step {step} of {total}</span>
      </div>
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(step / total) * 100}%`, background: goldBtn, boxShadow: '0 0 8px rgba(226,195,107,0.5)', borderRadius: '1px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function PrimaryBtn({ onClick, disabled, loading, children }: { onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ width: '100%', maxWidth: '480px', padding: '14px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer', background: disabled || loading ? 'rgba(226,195,107,0.12)' : goldBtn, color: disabled || loading ? 'rgba(226,195,107,0.4)' : '#1a0845', boxShadow: disabled || loading ? 'none' : '0 4px 24px rgba(226,195,107,0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      {loading ? (<><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(226,195,107,0.3)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />{children}</>) : children}
    </button>
  )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '14px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', border: '1px solid rgba(226,195,107,0.2)', background: 'rgba(255,255,255,0.03)', color: textFaint, cursor: 'pointer', transition: 'all 0.2s' }}>
      {children}
    </button>
  )
}

function InputField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,195,107,0.55)', marginBottom: '8px' }}>{label}</label>
      {children}
      {hint && !error && <p style={{ fontSize: '11px', color: textFaint, marginTop: '5px' }}>{hint}</p>}
      {error && <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', marginTop: '5px' }}>{error}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.22)',
  borderRadius: '10px', padding: '13px 16px', color: textPrimary, fontSize: '14px',
  outline: 'none', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
}

function Footer() {
  return <p style={{ marginTop: '48px', textAlign: 'center', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.12)', textTransform: 'uppercase' }}>VALNEX, UNIPESSOAL LDA · RevoWorldTech</p>
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
  const [bookMode, setBookMode] = useState<BookMode>('own')
  const [eventType, setEventType] = useState('')
  const [otherEventLabel, setOtherEventLabel] = useState('')
  const [honoureeName, setHonoureeName] = useState('')

  const [eventTag, setEventTag] = useState('')
  const [organiserEmail, setOrganiserEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [creating, setCreating] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')
  const [capsuleId, setCapsuleId] = useState('')
  const [capsuleSlug, setCapsuleSlug] = useState('')

  // Services selector state
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [featurePrices, setFeaturePrices] = useState<Record<string, { amount: number; symbol: string; currency: string } | null>>({})
  const [pricesLoading, setPricesLoading] = useState(false)

  /* =========================================================
     SECTION 7 — EFFECTS
  ========================================================= */
  // Auto-generate slug from honouree name
  useEffect(() => {
    if (!slugManual && honoureeName) setSlug(toSlug(honoureeName))
  }, [honoureeName, slugManual])

  // Pre-select suggested services when event type is set
  useEffect(() => {
    if (eventType) {
      setSelectedServices(SUGGESTED_BY_EVENT[eventType] ?? ['publication'])
    }
  }, [eventType])

  // Fetch regional feature prices when entering Screen 3
  useEffect(() => {
    if (screen !== 3) return
    setPricesLoading(true)
    const keys = BOOKING_SERVICE_ORDER.join(',')
    fetch(`/api/regional-prices?features=${keys}`)
      .then(r => r.json())
      .then(d => { if (d.features) setFeaturePrices(d.features) })
      .catch(() => {})
      .finally(() => setPricesLoading(false))
  }, [screen])

  /* =========================================================
     SECTION 8 — HANDLERS
  ========================================================= */

  // ═══ Create capsule + send verification code ═══
  async function handleCreateAndVerify() {
    if (!honoureeName.trim() || !organiserEmail.trim() || !slug.trim()) return
    setCreating(true); setError('')
    try {
      const { data, error: insertError } = await supabase
        .from('capsules')
        .insert({
          honouree_name: honoureeName.trim(),
          event_tag: eventTag.trim() || null,
          event_type: eventType === 'Other Event' && otherEventLabel.trim()
            ? otherEventLabel.trim()
            : eventType,

          organiser_email: organiserEmail.trim().toLowerCase(),
          slug: slug.trim(),
          tier: 'free',
          pricing_key: '',
          visitor_type: bookMode === 'gift' ? 'gift' : 'personal',
          // Free path: active immediately. Book path: pending until payment.
           page_state: path === 'book' ? 'pending_payment' : 'pending',
          theme: 'classic',
          components: ['community_stories'],
          free_tier_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id, slug').single()

      if (insertError) {
        setError(insertError.code === '23505' ? 'That capsule URL is already taken. Please choose a different one.' : 'Something went wrong. Please try again.')
        setCreating(false); return
      }

      setCapsuleId(data.id)
      setCapsuleSlug(data.slug)

      await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsuleId: data.id, capsuleSlug: data.slug, organiserEmail: organiserEmail.trim().toLowerCase(), honoureeName: honoureeName.trim() }),
      })

      setScreen(4)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setCreating(false)
  }

  // ═══ Verify the 4-char code ═══
  async function handleVerifyCode() {
    if (verifyCode.trim().length < 4) return
    setVerifying(true); setVerifyError('')
    try {
      const res = await fetch('/api/email/verify-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsuleId, code: verifyCode.trim().toUpperCase(), path }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setVerifyError('That code is incorrect. Please check your email and try again.')
        setVerifying(false); return
      }
      // Free path: go to confirmation. Book path: go to services selector.
      setScreen(path === 'book' ? 3 : 5)
    } catch {
      setVerifyError('Verification failed. Please try again.')
    }
    setVerifying(false)
  }

  // ═══ Toggle a service on/off ═══
  function toggleService(id: string) {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // ═══ Calculate total from selected services ═══
  function getTotal(): { amount: number; symbol: string; currency: string } | null {
    let total = 0
    let symbol = ''
    let currency = ''
    for (const id of selectedServices) {
      const p = featurePrices[id]
      if (!p) continue
      total += p.amount
      symbol = p.symbol
      currency = p.currency
    }
    if (!symbol || total === 0) return null
    return { amount: total, symbol, currency }
  }

  // ═══ Proceed to bundle checkout ═══
  async function handleCheckout() {
    if (selectedServices.length === 0 || !capsuleId) return
    setCheckingOut(true); setError('')
    try {
      const res = await fetch('/api/checkout/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsule_id: capsuleId,
          capsule_slug: capsuleSlug,
          feature_ids: selectedServices,
          organiser_email: organiserEmail.trim().toLowerCase(),
          recipient_name: bookMode === 'gift' ? recipientName.trim() : undefined,
          recipient_email: bookMode === 'gift' ? recipientEmail.trim() : undefined,
          book_mode: bookMode,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.checkout_url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.checkout_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setCheckingOut(false)
    }
  }

  /* =========================================================
     SECTION 9 — SCREEN RENDERS
  ========================================================= */

  /* ─────────────────────────────────────────────────────────
     9a. SCREEN 0 — PATH CHOOSER
  ───────────────────────────────────────────────────────── */
  if (screen === 0) {
    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <BookLogo />
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, color: textPrimary, lineHeight: 1.25, marginBottom: '10px' }}>
              How would you like to begin?
            </h1>
            <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.6 }}>
              Every capsule starts the same way — your event, preserved and shared.
            </p>
          </div>
          <GoldRule />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '24px 0 32px' }}>

            {/* ── Free path ── */}
            <button onClick={() => setPath('free')} style={{ width: '100%', textAlign: 'left', padding: '20px', borderRadius: '14px', border: `1px solid ${path === 'free' ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.08)'}`, background: path === 'free' ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>✦</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Start Free</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(74,222,128,0.3)', color: 'rgba(74,222,128,0.8)', background: 'rgba(255,255,255,0.02)' }}>Live in minutes</span>
                </div>
                <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6, margin: 0 }}>Your tribute wall goes live immediately. No payment needed. Add services anytime from your dashboard.</p>
              </div>
              {path === 'free' && <span style={{ fontSize: '16px', color: 'rgba(74,222,128,0.8)', flexShrink: 0, marginTop: '2px' }}>✓</span>}
            </button>

            {/* ── Book a Capsule ── */}
            <button onClick={() => setPath('book')} style={{ width: '100%', textAlign: 'left', padding: '20px', borderRadius: '14px', border: `1px solid ${path === 'book' ? 'rgba(226,195,107,0.55)' : cardBorder}`, background: path === 'book' ? 'rgba(226,195,107,0.07)' : 'rgba(255,255,255,0.03)', boxShadow: path === 'book' ? '0 0 24px rgba(226,195,107,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>◈</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>Book a Capsule</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(226,195,107,0.25)', color: 'rgba(226,195,107,0.75)', background: 'rgba(255,255,255,0.02)' }}>Premium</span>
                </div>
                <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6, margin: 0 }}>Choose your services upfront and pay once. Perfect for planning ahead or gifting to someone special.</p>
              </div>
              {path === 'book' && <span style={{ fontSize: '16px', color: gold, flexShrink: 0, marginTop: '2px' }}>✓</span>}
            </button>

            {/* ── Book mode toggle — shown when Book a Capsule is selected ── */}
            {path === 'book' && (
              <div style={{ padding: '16px 18px', borderRadius: '12px', border: '1px solid rgba(226,195,107,0.12)', background: 'rgba(226,195,107,0.04)', marginTop: '2px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(226,195,107,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Booking for</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setBookMode('own')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${bookMode === 'own' ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.06)'}`, background: bookMode === 'own' ? 'rgba(226,195,107,0.1)' : 'transparent', color: bookMode === 'own' ? gold : textFaint, fontSize: '13px', fontWeight: bookMode === 'own' ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                    My own event
                  </button>
                  <button onClick={() => setBookMode('gift')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${bookMode === 'gift' ? 'rgba(180,140,255,0.5)' : 'rgba(255,255,255,0.06)'}`, background: bookMode === 'gift' ? 'rgba(180,140,255,0.08)' : 'transparent', color: bookMode === 'gift' ? 'rgba(200,170,255,0.9)' : textFaint, fontSize: '13px', fontWeight: bookMode === 'gift' ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                    🎁 Gifting someone
                  </button>
                </div>
                {bookMode === 'gift' && (
                  <p style={{ fontSize: '11px', color: textFaint, marginTop: '10px', lineHeight: 1.65 }}>
                    You'll set up the capsule details and services. After payment, the recipient receives an email with access to their capsule.
                  </p>
                )}
              </div>
            )}
          </div>

          <PrimaryBtn onClick={() => { if (!path) return; setScreen(1) }} disabled={!path}>
            Continue →
          </PrimaryBtn>
          <Footer />
        </div>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     9b. SCREEN 1 — EVENT TYPE
  ───────────────────────────────────────────────────────── */
  if (screen === 1) {
    const selectedEvent = EVENT_TYPES.find(e => e.label === eventType)
    const totalSteps = path === 'book' ? 4 : 3
    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <BookLogo />
          <StepBar step={1} total={totalSteps} />
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>What is the occasion?</h1>
            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>Choose the event you are creating this capsule for</p>
          </div>
          <GoldRule />

          <div style={{ position: 'relative', margin: '24px 0 32px' }}>
            <div style={{ position: 'relative', borderRadius: '12px', border: `1px solid ${eventType ? 'rgba(226,195,107,0.5)' : 'rgba(226,195,107,0.2)'}`, background: eventType ? 'rgba(226,195,107,0.06)' : 'rgba(255,255,255,0.04)', transition: 'all 0.2s', boxShadow: eventType ? '0 0 20px rgba(226,195,107,0.1)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px', pointerEvents: 'none', position: 'absolute', top: 0, left: 0, right: 0 }}>
                {selectedEvent ? (<><span style={{ fontSize: '20px', lineHeight: 1 }}>{selectedEvent.emoji}</span><span style={{ fontSize: '15px', fontWeight: 600, color: textPrimary }}>{selectedEvent.label}</span></>) : <span style={{ fontSize: '14px', color: textFaint }}>Select occasion type…</span>}
                <span style={{ marginLeft: 'auto', color: 'rgba(226,195,107,0.5)', fontSize: '12px' }}>▾</span>
              </div>
              <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ width: '100%', padding: '16px 18px', background: 'transparent', border: 'none', outline: 'none', color: 'transparent', fontSize: '15px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', position: 'relative', zIndex: 1 }}>
                <option value="" disabled>Select occasion type…</option>
                {EVENT_TYPES.map(e => (<option key={e.label} value={e.label} style={{ background: '#1a0845', color: '#fff' }}>{e.emoji} {e.label}</option>))}
              </select>
            </div>
            {eventType && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(226,195,107,0.65)', margin: 0, lineHeight: 1.6 }}>{getEventDescription(eventType)}</p>
              </div>
            )}
            {eventType === 'Other Event' && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'rgba(226,195,107,0.55)', marginBottom: '8px' }}>
                  What is the occasion?
                </label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Product Launch, Baby Shower, Housewarming…"
                  maxLength={60}
                  value={otherEventLabel}
                  onChange={e => setOtherEventLabel(e.target.value)}
                  autoFocus
                />
                <p style={{ fontSize: '11px', color: textFaint, marginTop: '5px' }}>
                  This will appear on your capsule in place of "Other Event".
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <GhostBtn onClick={() => setScreen(0)}>← Back</GhostBtn>
            <div style={{ flex: 1 }}><PrimaryBtn onClick={() => { if (eventType) setScreen(2) }} disabled={!eventType || (eventType === 'Other Event' && !otherEventLabel.trim())}>Continue →</PrimaryBtn></div>
          </div>
          <Footer />
        </div>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     9c. SCREEN 2 — CAPSULE DETAILS
  ───────────────────────────────────────────────────────── */
  if (screen === 2) {
    const totalSteps = path === 'book' ? 4 : 3
    const giftFieldsValid = bookMode !== 'gift' || (recipientName.trim() && recipientEmail.trim() && recipientEmail.includes('@'))
    const canContinue = !!honoureeName.trim() && !!organiserEmail.trim() && organiserEmail.includes('@') && !!slug.trim() && giftFieldsValid

    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <BookLogo />
          <StepBar step={2} total={totalSteps} />
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>About this capsule</h1>
            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>{getHonoureeLabel(eventType)} · {eventType}</p>
          </div>
          <GoldRule />

          {/* Gift recipient fields */}
          {bookMode === 'gift' && (
            <div style={{ padding: '16px 18px', borderRadius: '12px', border: '1px solid rgba(180,140,255,0.2)', background: 'rgba(180,140,255,0.05)', marginBottom: '20px' }}>
              <p style={{ fontSize: '10px', color: 'rgba(200,170,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>🎁 Gift recipient</p>
              <InputField label="Recipient's name">
                <input style={inputStyle} placeholder="Who is receiving this gift?" value={recipientName} onChange={e => setRecipientName(e.target.value)} maxLength={80} />
              </InputField>
              <InputField label="Recipient's email" hint="We'll send their capsule access to this address after payment">
                <input type="email" style={inputStyle} placeholder="recipient@example.com" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} maxLength={120} />
              </InputField>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0 16px' }} />
              <p style={{ fontSize: '10px', color: 'rgba(200,170,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Your details (organiser)</p>
            </div>
          )}

          <div style={{ margin: '20px 0' }}>
            <InputField label={getHonoureeLabel(eventType)}>
              <input style={inputStyle} placeholder={getHonoureePlaceholder(eventType)} maxLength={80} value={honoureeName} onChange={e => setHonoureeName(e.target.value)} />
            </InputField>
            <InputField label="Event Tag" hint="A short subtitle shown on the tribute wall — optional but recommended">
              <input style={inputStyle} placeholder={getEventDescription(eventType)} maxLength={80} value={eventTag} onChange={e => setEventTag(e.target.value)} />
            </InputField>
            <InputField label="Your Email" hint="We'll send a 4-character verification code to confirm your email">
              <input type="email" style={inputStyle} placeholder="you@example.com" maxLength={120} value={organiserEmail} onChange={e => setOrganiserEmail(e.target.value)} />
            </InputField>
            <InputField label="Capsule URL" hint={`Your link: itslegacycapsule.com/for/${slug || 'your-slug'}`} error={error || undefined}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(226,195,107,0.22)', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: textFaint, whiteSpace: 'nowrap', padding: '13px 12px', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>/for/</span>
                <input style={{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }} placeholder="your-slug" maxLength={60} value={slug} onChange={e => { setSlugManual(true); setSlug(toSlug(e.target.value)) }} />
              </div>
            </InputField>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <GhostBtn onClick={() => setScreen(1)}>← Back</GhostBtn>
            <div style={{ flex: 1 }}>
              <PrimaryBtn onClick={handleCreateAndVerify} disabled={!canContinue} loading={creating}>
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
     9d. SCREEN 4 — VERIFY CODE
  ───────────────────────────────────────────────────────── */
  if (screen === 4) {
    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <BookLogo />
          <div style={{ width: '80px', height: '80px', margin: '16px auto 28px', borderRadius: '50%', border: '1px solid rgba(226,195,107,0.3)', background: 'rgba(226,195,107,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', lineHeight: 1, boxShadow: '0 0 32px rgba(226,195,107,0.15)', animation: 'breathe 3s ease-in-out infinite' }}>✉</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: textPrimary, marginBottom: '10px' }}>Check your inbox</h1>
          <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.75, marginBottom: '8px' }}>We sent a 4-character code to</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: gold, marginBottom: '28px' }}>{organiserEmail}</p>

          {path === 'book' && (
            <div style={{ padding: '16px 18px', borderRadius: '12px', marginBottom: '28px', textAlign: 'left', border: '1px solid rgba(226,195,107,0.15)', background: 'rgba(226,195,107,0.04)' }}>
              <p style={{ fontSize: '12px', color: 'rgba(226,195,107,0.65)', lineHeight: 1.8, margin: 0 }}>
                ✦ Once verified, you'll choose the services for your capsule. A single payment activates everything instantly.
              </p>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(226,195,107,0.55)', marginBottom: '12px' }}>Enter your verification code</label>
            <input value={verifyCode} onChange={e => setVerifyCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))} onKeyDown={e => e.key === 'Enter' && verifyCode.length === 4 && handleVerifyCode()} placeholder="A1B2" maxLength={4} style={{ ...inputStyle, textAlign: 'center', fontSize: '28px', fontWeight: 800, letterSpacing: '0.5em', padding: '18px 24px', border: verifyError ? '1px solid rgba(248,113,113,0.5)' : verifyCode.length === 4 ? '1px solid rgba(226,195,107,0.55)' : '1px solid rgba(226,195,107,0.22)' }} autoFocus autoComplete="off" />
            {verifyError && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginTop: '8px' }}>{verifyError}</p>}
          </div>

          <PrimaryBtn onClick={handleVerifyCode} disabled={verifyCode.length < 4} loading={verifying}>
            {verifying ? 'Verifying…' : path === 'book' ? 'Verify & Choose Services →' : 'Verify & Open Capsule →'}
          </PrimaryBtn>

          <p style={{ fontSize: '11px', color: textFaint, marginTop: '16px', lineHeight: 1.65 }}>
            Didn't receive it?{' '}
            <button onClick={handleCreateAndVerify} style={{ background: 'none', border: 'none', color: 'rgba(226,195,107,0.6)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline', padding: 0 }}>Resend the code</button>
          </p>
          <Footer />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes breathe { 0%,100%{box-shadow:0 0 32px rgba(226,195,107,0.15)} 50%{box-shadow:0 0 48px rgba(226,195,107,0.28)} }`}</style>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     9e. SCREEN 3 — SERVICES SELECTOR (Book path only)
  ───────────────────────────────────────────────────────── */
  if (screen === 3) {
    const total = getTotal()
    const hasUnpublished = selectedServices.some(id => featurePrices[id] === null)

    // ═══ Always Included — Free (path-aware) ═══
    const isPreBooked = path === 'book'
    const freeItems = [
      {
        icon: '◈',
        label: 'Tribute Wall & World Map',
        desc: 'Your guests leave messages and memories — and every voice is marked on a live world map showing where love came from.',
        helpKey: 'tribute_wall',
      },
      {
        icon: '◇',
        label: 'Community Memories & Stories',
        desc: 'A dedicated space for guests to share fuller stories and personal memories, organised by theme.',
        helpKey: 'community_stories',
      },
      {
        icon: '◎',
        label: 'Your Digital Capsule',
        desc: 'A permanent online home for this event — collecting every tribute, memory, photo and story in one place.',
        helpKey: 'getting-started',
      },
      {
        icon: '📅',
        label: isPreBooked ? '2 Event Phases' : '1 Event Phase',
        desc: isPreBooked
          ? 'Two chapters in your event story — perfect for occasions that unfold across more than one day or setting.'
          : 'One chapter in your event story, with its own tribute collection window and QR code.',
        helpKey: 'additional_phase',
      },
      {
        icon: '⏳',
        label: isPreBooked ? '6 Months Online' : '3 Months Online',
        desc: isPreBooked
          ? 'Your capsule stays online and active for 6 months from when the first tribute arrives.'
          : 'Your capsule stays online and active for 3 months from when the first tribute arrives.',
        helpKey: 'extended_validity',
      },
    ]

    return (
      <Shell>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <BookLogo />
          <StepBar step={3} total={4} />
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>Choose what you'd like to include</h1>
            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>
              Your capsule already comes with everything below — at no charge. Add anything extra that fits your occasion.
            </p>
          </div>
          <GoldRule />

          {/* ═══ Always Included — Free Strip ═══ */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: greenAccent, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
              ✓ Included with every capsule
            </p>
            {freeItems.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: greenBg, border: `1px solid ${greenBorder}`, marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{item.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: textFaint, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: greenAccent }}>FREE</span>
                  <a
                    href={`/help?section=${item.helpKey}&ref=booking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '9px', color: 'rgba(74,222,128,0.5)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Find out more
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ Paid Add-ons ═══ */}
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(226,195,107,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
            Add to your capsule
          </p>

          {pricesLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid rgba(226,195,107,0.2)', borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '12px', color: textFaint }}>Fetching prices for your region…</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', margin: '16px 0 24px' }}>
              {BOOKING_SERVICE_ORDER.map((svcId, idx) => {
                const svc = SERVICE_DETAILS[svcId]
                if (!svc) return null

                const selected = selectedServices.includes(svcId)
                const price = featurePrices[svcId]
                const unavailable = price === null
                const breakIndex = CATEGORY_BREAKS[svcId]
                const showDivider = breakIndex !== undefined && breakIndex > 0

                return (
                  <div key={svcId}>
                    {/* Category divider — thin rule between groups */}
                    {showDivider && (
                      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.15), transparent)', margin: '14px 0' }} />
                    )}

                    <div
                      style={{
                        width: '100%', borderRadius: '12px',
                        border: `1px solid ${selected ? 'rgba(226,195,107,0.5)' : unavailable ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                        background: selected ? 'rgba(226,195,107,0.07)' : unavailable ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                        opacity: unavailable ? 0.4 : 1,
                        transition: 'all 0.2s',
                        overflow: 'hidden',
                        marginBottom: '8px',
                      }}
                    >
                      {/* Selectable row */}
                      <div
                        onClick={() => !unavailable && toggleService(svcId)}
                        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: unavailable ? 'not-allowed' : 'pointer' }}
                      >
                        {/* Checkbox */}
                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${selected ? gold : 'rgba(255,255,255,0.18)'}`, background: selected ? 'rgba(226,195,107,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {selected && <span style={{ fontSize: '11px', color: gold, fontWeight: 800 }}>✓</span>}
                        </div>

                        {/* Icon + content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' as const }}>
                            <span style={{ fontSize: '14px' }}>{svc.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: selected ? textPrimary : textSecondary }}>{svc.title}</span>
                            {SUGGESTED_BY_EVENT[eventType]?.includes(svcId) && (
                              <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', padding: '2px 6px', borderRadius: '4px', background: 'rgba(226,195,107,0.1)', border: '1px solid rgba(226,195,107,0.2)', color: 'rgba(226,195,107,0.7)', textTransform: 'uppercase' as const }}>Suggested</span>
                            )}
                          </div>
                          <p style={{ fontSize: '11px', color: textFaint, margin: 0, lineHeight: 1.5 }}>{svc.tagline}</p>
                        </div>

                        {/* Price */}
                        {price && (
                          <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: selected ? gold : textFaint }}>
                              {price.symbol}{price.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {unavailable && (
                          <span style={{ fontSize: '9px', color: textFaint, flexShrink: 0 }}>Available soon</span>
                        )}
                      </div>

                      {/* Find out more link */}
                      {!unavailable && (
                        <div style={{ padding: '0 16px 10px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex' }}>
                          <a href={`/help?section=${svcId}&ref=booking`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'rgba(226,195,107,0.5)', textDecoration: 'none', fontWeight: 600 }}>
                            Find out more
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ═══ Running total ═══ */}
          {total ? (
            <div style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(226,195,107,0.25)', background: 'rgba(226,195,107,0.06)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(226,195,107,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Your total</p>
                <p style={{ fontSize: '10px', color: textFaint }}>{selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} added</p>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif" }}>
                {total.symbol}{total.amount.toLocaleString()}
              </p>
            </div>
          ) : (
            <div style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>Nothing added yet — your capsule is free to create</p>
            </div>
          )}

          {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}

          <PrimaryBtn onClick={handleCheckout} disabled={selectedServices.length === 0 || checkingOut || hasUnpublished} loading={checkingOut}>
            {checkingOut ? 'Preparing checkout…' : total ? `Continue to Payment · ${total.symbol}${total.amount.toLocaleString()} →` : 'Select at least one service'}
          </PrimaryBtn>

          <p style={{ fontSize: '11px', color: textFaint, marginTop: '12px', textAlign: 'center', lineHeight: 1.65 }}>
            Secure checkout via Stripe. Your capsule and selected services will be ready when you choose to activate it.
          </p>
          <Footer />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Shell>
    )
  }

  /* ─────────────────────────────────────────────────────────
     9f. SCREEN 5 — CONFIRMED
  ───────────────────────────────────────────────────────── */
  return (
    <Shell>
      <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
        <BookLogo />
        <div style={{ width: '88px', height: '88px', margin: '24px auto 32px', borderRadius: '50%', border: '1px solid rgba(226,195,107,0.4)', background: 'radial-gradient(circle, rgba(226,195,107,0.12) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', lineHeight: 1, boxShadow: '0 0 40px rgba(226,195,107,0.2)' }}>✦</div>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800, color: textPrimary, marginBottom: '12px', textShadow: '0 0 32px rgba(226,195,107,0.2)' }}>
          {bookMode === 'gift' ? 'Your gift capsule is reserved' : path === 'book' ? 'Your capsule is reserved' : 'Your capsule is ready'}
        </h1>

        <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.75, marginBottom: '28px', maxWidth: '340px', margin: '0 auto 28px' }}>
          {bookMode === 'gift'
            ? <>A LegacyCapsule has been reserved for <span style={{ color: textPrimary, fontWeight: 600 }}>{honoureeName}</span>. Access details will be sent to <span style={{ color: gold, fontWeight: 600 }}>{recipientEmail}</span> when you are ready to activate it.</>
            : path === 'book'
            ? <>Your LegacyCapsule for <span style={{ color: textPrimary, fontWeight: 600 }}>{honoureeName}</span> has been reserved with your selected services. Share the link when you are ready — your capsule goes live when the first tribute arrives.</>
            : <>Your LegacyCapsule for <span style={{ color: textPrimary, fontWeight: 600 }}>{honoureeName}</span> is set up and ready. Share the link below — your capsule goes live when the first tribute arrives.</>
          }
        </p>

        {/* Capsule link */}
        <div style={{ padding: '16px 18px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(226,195,107,0.25)', background: 'rgba(226,195,107,0.06)' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(226,195,107,0.5)', marginBottom: '6px' }}>Capsule link</p>
          <p style={{ fontSize: '13px', color: gold, wordBreak: 'break-all', fontWeight: 600 }}>itslegacycapsule.com/for/{capsuleSlug || slug}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {bookMode !== 'gift' && (
            <Link href={`/manage/${capsuleSlug || slug}`} style={{ display: 'block', padding: '14px', borderRadius: '12px', textDecoration: 'none', background: goldBtn, color: '#1a0845', fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', boxShadow: '0 4px 24px rgba(226,195,107,0.3)' }}>
              Open Your Dashboard →
            </Link>
          )}
          <Link href={`/for/${capsuleSlug || slug}`} target="_blank" style={{ display: 'block', padding: '13px', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(226,195,107,0.22)', background: 'rgba(226,195,107,0.05)', color: 'rgba(226,195,107,0.75)', fontSize: '13px', fontWeight: 600, textAlign: 'center', letterSpacing: '0.04em' }}>
            View Tribute Wall ↗
          </Link>
        </div>

        <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.65 }}>
          {bookMode === 'gift'
            ? `A copy of the capsule details has also been sent to ${organiserEmail}`
            : `A management link has been sent to ${organiserEmail}`
          }
        </p>
        <Footer />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Shell>
  )
}

/* =========================================================
   SECTION 10 — SUSPENSE WRAPPER EXPORT
========================================================= */
export default function BookPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(226,195,107,0.2)', borderTopColor: gold, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <BookPage />
    </Suspense>
  )
}
