'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import LogoCapsule from '@/components/LogoCapsule'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ────────────────────────────────────────────────────────────────────

interface ContentMap {
  [key: string]: string
}

interface TierData {
  name: string
  tagline: string
  description: string
  features: string[]
  eur_price: number
  ngn_price: number
  pricing_key: string
}

// ── Event types ───────────────────────────────────────────────────────────────

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

// ── Shared layout primitives ──────────────────────────────────────────────────

const BG = 'min-h-screen bg-[linear-gradient(160deg,#0D0820_0%,#1A0F3E_50%,#0D0820_100%)]'

function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${BG} flex flex-col`}>
      <div className="min-h-screen flex flex-col items-center px-4 pb-16 pt-8">
        {children}
      </div>
    </div>
  )
}

function BookingLogo() {
  return (
    <div className="mb-6 flex justify-center">
      <LogoCapsule size="md" />
    </div>
  )
}

function GoldDivider() {
  return (
    <div className="w-full max-w-xl mx-auto my-6"
      style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #B8960C99, transparent)' }} />
  )
}

function ProgressBar({ step, total = 4 }: { step: number; total?: number }) {
  const pct = (step / total) * 100
  return (
    <div className="w-full max-w-xl mx-auto mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/70 font-medium"
          style={{ fontFamily: 'var(--font-accent, "Cormorant SC", serif)' }}>
          Step {step} of {total}
        </span>
      </div>
      <div className="h-[3px] w-full rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #B8960C, #D4AE2A)',
            boxShadow: '0 0 8px #B8960C88',
          }}
        />
      </div>
    </div>
  )
}

function BackLink({ href, label = 'Back' }: { href?: string; onClick?: () => void; label?: string }) {
  if (href) {
    return (
      <Link href={href}
        className="self-start mb-6 text-xs text-white/35 hover:text-yellow-400/70 transition-colors duration-200 tracking-wide">
        ← {label}
      </Link>
    )
  }
  return null
}

function BookingFooter() {
  return (
    <p className="mt-12 text-center text-[10px] tracking-widest text-white/20 uppercase">
      VALNEX, UNIPESSOAL LDA · RevoWorldTech
    </p>
  )
}

function GoldButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 py-4 rounded-xl font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: disabled
          ? 'rgba(184,150,12,0.15)'
          : 'linear-gradient(135deg, #B8960C 0%, #D4AE2A 50%, #B8960C 100%)',
        color: disabled ? '#B8960C99' : '#0D0820',
        boxShadow: disabled ? 'none' : '0 4px 24px #B8960C44',
        fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
      }}>
      {children}
    </button>
  )
}

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

// ── Dynamic honouree label + placeholder (driven by event type) ───────────────

function getHonoureeLabel(eventType: string): string {
  switch (eventType) {
    case 'Wedding':            return 'Names of the couple'
    case 'Memorial & Funeral': return 'In memory of'
    case 'Milestone Birthday': return 'Who is this celebration for'
    case 'Graduation':         return "Graduate's full name"
    case 'Ordination':         return "Ordinand's full name"
    case 'Chieftaincy':        return "Title holder's full name"
    case 'Conference':         return 'Conference or organisation name'
    default:                   return 'Name of the person being celebrated'
  }
}

function getHonoureePlaceholder(eventType: string): string {
  switch (eventType) {
    case 'Wedding':            return 'e.g. James Whitfield & Elena Fontaine'
    case 'Conference':         return 'e.g. Global Leadership Summit 2026'
    case 'Chieftaincy':        return 'e.g. Chief James Alexander Whitfield'
    case 'Ordination':         return 'e.g. Reverend James Alexander Whitfield'
    case 'Graduation':         return 'e.g. Dr. James Alexander Whitfield'
    default:                   return 'e.g. James Alexander Whitfield'
  }
}

function getEventTagPlaceholder(eventType: string): string {
  switch (eventType) {
    case 'Retirement':           return 'e.g. 35 Years of Dedication'
    case 'Memorial & Funeral':   return 'e.g. Forever in Our Hearts'
    case 'Wedding':              return 'e.g. United in Love'
    case 'Milestone Birthday':   return 'e.g. 80 Glorious Years'
    case 'Anniversary':          return 'e.g. Fifty Years of Us'
    case 'Graduation':           return 'e.g. The Future Begins'
    case 'Ordination':           return 'e.g. Called to Serve'
    case 'Chieftaincy':          return 'e.g. A New Season of Leadership'
    case 'Award Ceremony':       return 'e.g. Celebrating Excellence'
    case 'Thanksgiving Service': return 'e.g. Gratitude and Grace'
    case 'Conference':           return 'e.g. Ideas That Move the World'
    default:                     return 'e.g. A Moment Worth Preserving'
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BookPage() {
  const router = useRouter()

  // ── Navigation state
  const [screen, setScreen] = useState(1)

  // ── Booking form state
  const [visitorType, setVisitorType] = useState('')
  const [eventType,   setEventType]   = useState('')
  const [tier,        setTier]        = useState('')   // 'honour' | 'premier'
  const [honoureeName, setHonoureeName] = useState('')
  const [eventTag,     setEventTag]     = useState('')
  const [eventDate,    setEventDate]    = useState('')
  const [organiserEmail, setOrganiserEmail] = useState('')
  const [slug,           setSlug]          = useState('')
  const [slugManual,     setSlugManual]    = useState(false)

  // ── Remote data
  const [content,  setContent]  = useState<ContentMap>({})
  const [honour,   setHonour]   = useState<TierData | null>(null)
  const [premier,  setPremier]  = useState<TierData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)
  const [error,    setError]    = useState('')

  // ── Fetch lc_content + lc_pricing in parallel on mount
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [contentRes, pricingRes] = await Promise.all([
        supabase
          .from('lc_content')
          .select('key, value')
          .in('group_key', ['tier_honour', 'tier_premier', 'booking_flow'])
          .order('sort_order'),
        supabase
          .from('lc_pricing')
          .select('key, eur_price, ngn_price')
          .in('key', ['capture_preserve_base', 'full_platform_base']),
      ])

      // Build content map
      const map: ContentMap = {}
      for (const row of contentRes.data ?? []) {
        map[row.key] = row.value
      }
      setContent(map)

      // Build tier data
      const pricing = pricingRes.data ?? []
      const honourPrice  = pricing.find(p => p.key === 'capture_preserve_base')
      const premierPrice = pricing.find(p => p.key === 'full_platform_base')

      const honourFeatures: string[] = []
      const premierFeatures: string[] = []
      for (let i = 1; i <= 10; i++) {
        if (map[`tier_honour__feat_${i}`])  honourFeatures.push(map[`tier_honour__feat_${i}`])
        if (map[`tier_premier__feat_${i}`]) premierFeatures.push(map[`tier_premier__feat_${i}`])
      }

      if (honourPrice) {
        setHonour({
          name:        map['tier_honour__name']        ?? 'Legacy Honour',
          tagline:     map['tier_honour__tagline']     ?? 'Capture & Preserve',
          description: map['tier_honour__description'] ?? '',
          features:    honourFeatures,
          eur_price:   honourPrice.eur_price,
          ngn_price:   honourPrice.ngn_price,
          pricing_key: 'capture_preserve_base',
        })
      }
      if (premierPrice) {
        setPremier({
          name:        map['tier_premier__name']        ?? 'Legacy Premier',
          tagline:     map['tier_premier__tagline']     ?? 'Full Platform',
          description: map['tier_premier__description'] ?? '',
          features:    premierFeatures,
          eur_price:   premierPrice.eur_price,
          ngn_price:   premierPrice.ngn_price,
          pricing_key: 'full_platform_base',
        })
      }

      setLoading(false)
    }
    fetchAll()
  }, [])

  // ── Auto-generate slug from honouree name
  useEffect(() => {
    if (!slugManual && honoureeName) {
      setSlug(toSlug(honoureeName))
    }
  }, [honoureeName, slugManual])

  // ── Helpers
  const selectedTierData = tier === 'honour' ? honour : tier === 'premier' ? premier : null

  function handleScreen1Continue() {
    if (!visitorType) return
    if (visitorType === 'gift') {
      router.push('/gift')
      return
    }
    setScreen(2)
  }

  async function handleCreateCapsule() {
    if (!honoureeName.trim() || !organiserEmail.trim() || !slug.trim()) return
    setCreating(true)
    setError('')

    try {
      const { data, error: insertError } = await supabase
        .from('capsules')
        .insert({
          honouree_name:  honoureeName.trim(),
          event_tag:      eventTag.trim() || null,
          event_type:     eventType,
          organiser_email: organiserEmail.trim().toLowerCase(),
          slug:           slug.trim(),
          tier:           tier,
          pricing_key:    selectedTierData?.pricing_key ?? '',
          visitor_type:   visitorType,
          page_state:     tier === 'free' ? 'active' : 'active',
          theme:          'classic',
          free_tier_expires_at: tier === 'free'
            ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .select('id, slug')
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          setError('That capsule URL is already taken. Please choose a different one.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        setCreating(false)
        return
      }

      try {
        await fetch('/api/email/verify-organiser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: organiserEmail.trim().toLowerCase(),
            capsuleId: data.id,
            capsuleSlug: slug.trim(),
            honoreeName: honoureeName.trim(),
          }),
        })
      } catch (emailError) {
        console.error('Welcome email failed:', emailError)
      }

      setScreen(5)
    } catch {
      setError('Something went wrong. Please try again.')
      setCreating(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 1 — Who are you?
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 1) {
    const options = [
      {
        key: 'personal',
        emoji: '🤍',
        title: content['booking__visitor_personal_title'] ?? 'Personal Organiser',
        sub:   content['booking__visitor_personal_sub']   ?? 'I am arranging an event for someone I love',
      },
      {
        key: 'planner',
        emoji: '✦',
        title: content['booking__visitor_planner_title'] ?? 'Event Professional',
        sub:   content['booking__visitor_planner_sub']   ?? 'I use LegacyCapsule as part of my event services',
      },
      {
        key: 'gift',
        emoji: '🎁',
        title: content['booking__visitor_gift_title'] ?? 'Gift a Capsule',
        sub:   content['booking__visitor_gift_sub']   ?? 'I want to give this experience as a gift',
      },
    ]

    return (
      <ScreenShell>
        <div className="w-full max-w-xl flex flex-col">
          <Link href="/"
            className="mt-6 mb-8 self-start text-xs text-white/35 hover:text-yellow-400/70 transition-colors duration-200 tracking-wide">
            ← Back to Home
          </Link>

          <BookingLogo />
          <ProgressBar step={1} />

          <h1 className="text-center text-2xl font-bold text-white/90 mb-2 tracking-wide"
            style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
            Who are you?
          </h1>
          <p className="text-center text-sm text-white/45 mb-8">
            Help us tailor your experience
          </p>

          <GoldDivider />

          <div className="flex flex-col gap-6 my-6">
            {options.map(opt => {
              const selected = visitorType === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setVisitorType(opt.key)}
                  className="w-full text-left px-6 py-7 rounded-2xl border transition-all duration-200 min-h-[88px]"
                  style={{
                    background: selected ? 'rgba(184,150,12,0.10)' : 'rgba(255,255,255,0.03)',
                    borderColor: selected ? '#B8960C' : 'rgba(255,255,255,0.08)',
                    boxShadow: selected ? '0 0 20px #B8960C22' : 'none',
                  }}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl leading-none flex-shrink-0">{opt.emoji}</span>
                    <div>
                      <p className="text-white/90 font-semibold tracking-wide text-sm">{opt.title}</p>
                      <p className="text-white/40 text-xs mt-1 leading-relaxed">{opt.sub}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="w-full max-w-xl mx-auto mt-12 mb-8 flex-shrink-0"
            style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #B8960C99, transparent)' }} />

          <div className="flex gap-3 w-full max-w-xl mx-auto">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center py-4 rounded-xl border text-sm font-medium tracking-wide transition-all duration-200"
              style={{ borderColor: 'rgba(184,150,12,0.3)', color: 'rgba(255,255,255,0.45)' }}>
              ← Home
            </Link>
            <button
              onClick={handleScreen1Continue}
              disabled={!visitorType}
              className="flex-[3] flex items-center justify-center px-8 py-4 rounded-xl font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !visitorType ? 'rgba(184,150,12,0.15)' : 'linear-gradient(135deg, #B8960C 0%, #D4AE2A 50%, #B8960C 100%)',
                color: !visitorType ? '#B8960C99' : '#0D0820',
                boxShadow: !visitorType ? 'none' : '0 4px 24px #B8960C44',
              }}>
              Continue →
            </button>
          </div>

          <BookingFooter />
        </div>
      </ScreenShell>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 2 — What is the occasion?
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 2) {
    return (
      <ScreenShell>
        <div className="w-full max-w-2xl flex flex-col">
          <div className="mt-6 mb-8 flex w-full items-center justify-between">
            <button
              onClick={() => setScreen(1)}
              className="text-xs text-white/35 hover:text-yellow-400/70 transition-colors duration-200 tracking-wide">
              ← Back
            </button>
            <Link href="/" className="text-xs text-white/25 hover:text-yellow-400/60 transition-colors duration-200 tracking-wide">
              ⌂ Home
            </Link>
          </div>

          <BookingLogo />
          <ProgressBar step={2} />

          <h1 className="text-center text-2xl font-bold text-white/90 mb-2 tracking-wide"
            style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
            What is the occasion?
          </h1>
          <p className="text-center text-sm text-white/45 mb-8">
            Choose the event you are creating this capsule for
          </p>

          <GoldDivider />

          <div className="grid grid-cols-2 gap-4 my-6 md:grid-cols-3">
            {EVENT_TYPES.map(ev => {
              const selected = eventType === ev.label
              return (
                <button
                  key={ev.label}
                  onClick={() => setEventType(ev.label)}
                  className="flex flex-col items-center justify-center gap-3 px-3 py-5 min-h-[88px] rounded-2xl border transition-all duration-200"                  style={{
                    background: selected ? 'rgba(184,150,12,0.10)' : 'rgba(255,255,255,0.03)',
                    borderColor: selected ? '#B8960C' : 'rgba(255,255,255,0.08)',
                    boxShadow: selected ? '0 0 16px #B8960C22' : 'none',
                  }}>
                  <span className="text-4xl leading-none">{ev.emoji}</span>
                  <span className="text-[11px] text-white/70 text-center leading-relaxed font-medium tracking-wide mt-1">

                    {ev.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="w-full max-w-2xl mx-auto mt-12 mb-8 flex-shrink-0"
            style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #B8960C99, transparent)' }} />

          <div className="flex gap-3 w-full max-w-2xl mx-auto">
            <button
              onClick={() => setScreen(1)}
              className="flex-1 flex items-center justify-center py-4 rounded-xl border text-sm font-medium tracking-wide transition-all duration-200"
              style={{ borderColor: 'rgba(184,150,12,0.3)', color: 'rgba(255,255,255,0.45)' }}>
              ← Back
            </button>
            <button
              onClick={() => { if (eventType) setScreen(3) }}
              disabled={!eventType}
              className="flex-[3] flex items-center justify-center px-8 py-4 rounded-xl font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !eventType ? 'rgba(184,150,12,0.15)' : 'linear-gradient(135deg, #B8960C 0%, #D4AE2A 50%, #B8960C 100%)',
                color: !eventType ? '#B8960C99' : '#0D0820',
                boxShadow: !eventType ? 'none' : '0 4px 24px #B8960C44',
              }}>
              Continue →
            </button>
          </div>

          <BookingFooter />
        </div>
      </ScreenShell>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 3 — Choose your package
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 3) {
    if (loading || !honour || !premier) {
      return (
        <ScreenShell>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
          </div>
        </ScreenShell>
      )
    }

    const cards = [
      {
        key: 'free',
        badge: null,
        name: 'Go Live Free',
        tagline: 'Start Now · Pay Later',
        description: 'Your tribute wall goes live instantly. Collect tributes from anywhere in the world. Upgrade to publish and preserve anytime.',
        price: null,
        features: [
          'Tribute wall live in minutes',
          'Up to 50 contributors worldwide',
          'Text tributes with moderation',
          'Your own capsule link',
          'Active for 90 days',
          'Upgrade anytime — no data lost',
        ],
        cta: 'Go Live Free →',
        highlight: false,
      },
      {
        key: 'honour',
        badge: null,
        name: honour?.name ?? 'Legacy Honour',
        tagline: honour?.tagline ?? 'Capture & Preserve',
        description: honour?.description ?? '',
        price: honour?.eur_price ?? 50,
        features: honour?.features ?? [],
        cta: 'Choose Legacy Honour →',
        highlight: false,
      },
      {
        key: 'premier',
        badge: 'Most Complete',
        name: premier?.name ?? 'Legacy Premier',
        tagline: premier?.tagline ?? 'Full Platform',
        description: premier?.description ?? '',
        price: premier?.eur_price ?? 80,
        features: premier?.features ?? [],
        cta: 'Choose Legacy Premier →',
        highlight: true,
      },
    ]

    return (
      <ScreenShell>
        <div className="w-full max-w-5xl flex flex-col">
          <button
            onClick={() => setScreen(2)}
            className="mb-6 text-xs text-white/35 hover:text-yellow-400/70 transition-colors duration-200 tracking-wide text-left">
            ← Back
          </button>

          <BookingLogo />
          <ProgressBar step={3} />

          <h1 className="text-center text-2xl font-bold text-white/90 mb-2 tracking-wide"
            style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
            How would you like to begin?
          </h1>
          <p className="text-center text-sm text-white/45 mb-8">
            Start free and upgrade anytime — or choose your full package now
          </p>

          <GoldDivider />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-4">
            {cards.map((card) => {
              const selected = tier === card.key
              return (
                <button
                  key={card.key}
                  onClick={() => setTier(card.key)}
                  className="flex flex-col text-left px-6 py-6 rounded-2xl border transition-all duration-200 relative"
                  style={{
                    background: selected
                      ? 'rgba(184,150,12,0.10)'
                      : card.highlight
                      ? 'rgba(184,150,12,0.05)'
                      : 'rgba(255,255,255,0.03)',
                    borderColor: selected
                      ? '#B8960C'
                      : card.highlight
                      ? 'rgba(184,150,12,0.35)'
                      : 'rgba(255,255,255,0.08)',
                    boxShadow: selected
                      ? '0 0 28px #B8960C28'
                      : card.highlight
                      ? '0 0 16px #B8960C15'
                      : 'none',
                  }}>

                  {/* Badge */}
                  {card.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #B8960C, #D4AE2A)',
                          color: '#0D0820',
                        }}>
                        {card.badge}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/60 mb-1"
                      style={{ fontFamily: 'var(--font-accent, "Cormorant SC", serif)' }}>
                      {card.tagline}
                    </p>
                    <p className="text-lg font-bold text-white/90 tracking-wide"
                      style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
                      {card.name}
                    </p>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-5 pb-5 border-b border-white/8">
                    {card.price ? (
                      <span className="text-3xl font-bold text-yellow-300">
                        €{card.price}
                      </span>
                    ) : (
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-yellow-300">Free</span>
                        <span className="text-xs text-white/35 mb-1">to start</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-2 flex-1">
                    {card.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-400/60 mt-0.5 text-xs flex-shrink-0">✦</span>
                        <span className="text-xs text-white/60 leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Selected indicator */}
                  {selected && (
                    <div className="mt-5 pt-4 border-t border-yellow-400/20 text-center">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/80">
                        Selected
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Running total — only for paid tiers */}
          {selectedTierData && tier !== 'free' && (
            <div className="mt-6 px-5 py-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 flex items-center justify-between">
              <span className="text-xs text-white/50 tracking-wide">Package total</span>
              <span className="text-lg font-bold text-yellow-300">
                €{selectedTierData.eur_price}
              </span>
            </div>
          )}

          {/* Free tier note */}
          {tier === 'free' && (
            <div className="mt-6 px-5 py-4 rounded-xl border border-white/8 bg-white/3 text-center">
              <p className="text-xs text-white/45 leading-relaxed">
                Your tribute wall goes live immediately at no cost.
                <br />
                <span className="text-yellow-400/70">Upgrade to Legacy Honour or Premier anytime</span> — all your tributes are preserved.
              </p>
            </div>
          )}

          <GoldDivider />

          <div className="flex gap-3 w-full max-w-5xl mx-auto">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center py-4 rounded-xl border text-sm font-medium tracking-wide transition-all duration-200"
              style={{ borderColor: 'rgba(184,150,12,0.3)', color: 'rgba(255,255,255,0.45)' }}>
              ← Home
            </Link>
            <button
              onClick={() => setScreen(4)}
              disabled={!tier}
              className="flex-[3] flex items-center justify-center py-4 rounded-xl font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !tier
                  ? 'rgba(184,150,12,0.15)'
                  : 'linear-gradient(135deg, #B8960C 0%, #D4AE2A 50%, #B8960C 100%)',
                color: !tier ? '#B8960C99' : '#0D0820',
                boxShadow: !tier ? 'none' : '0 4px 24px #B8960C44',
              }}>
              {tier === 'free'
                ? 'Go Live Free →'
                : tier
                ? `Continue with ${tier === 'honour' ? honour?.name : premier?.name} →`
                : 'Select a plan to continue'}
            </button>
          </div>

          <BookingFooter />
        </div>
      </ScreenShell>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 4 — Your capsule details
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 4) {
    const inputClass = 'w-full rounded-xl border bg-white/4 text-white/90 text-sm placeholder:text-white/25 outline-none transition-all duration-200 focus:border-yellow-400/60 focus:bg-yellow-400/5'
    const inputPad = { padding: '16px 20px' } as const
    const labelClass = 'text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1.5 block'
    const canSubmit = !creating && !!honoureeName.trim() && !!organiserEmail.trim() && !!slug.trim()

    return (
      <ScreenShell>
        <div className="w-full max-w-xl flex flex-col">
          <div className="mt-6 mb-8 flex w-full items-center justify-between">
            <button
              onClick={() => setScreen(3)}
              className="text-xs text-white/35 hover:text-yellow-400/70 transition-colors duration-200 tracking-wide">
              ← Back
            </button>
            <Link href="/" className="text-xs text-white/25 hover:text-yellow-400/60 transition-colors duration-200 tracking-wide">
              ⌂ Home
            </Link>
          </div>

          <BookingLogo />
          <ProgressBar step={4} />

          <h1 className="text-center text-2xl font-bold text-white/90 mb-2 tracking-wide"
            style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
            Your capsule details
          </h1>
          <p className="text-center text-sm text-white/45 mb-8">
            Tell us more about the event
          </p>

          <GoldDivider />

          <div className="flex flex-col gap-5 my-2">

            {/* Honouree name */}
            <div>
              <label className={labelClass}>{getHonoureeLabel(eventType)}</label>
              <input
                className={inputClass}
                style={{ ...inputPad, borderColor: honoureeName ? 'rgba(184,150,12,0.4)' : 'rgba(255,255,255,0.08)' }}
                placeholder={getHonoureePlaceholder(eventType)}
                maxLength={80}
                value={honoureeName}
                onChange={e => setHonoureeName(e.target.value)}
              />
              <p className="text-[10px] text-white/25 mt-1 text-right">{honoureeName.length}/80</p>
            </div>

            {/* Event tag */}
            <div>
              <label className={labelClass}>Event Tag <span className="text-white/25 normal-case tracking-normal">— optional</span></label>
              <input
                className={inputClass}
                style={{ ...inputPad, borderColor: eventTag ? 'rgba(184,150,12,0.4)' : 'rgba(255,255,255,0.08)' }}
                placeholder={getEventTagPlaceholder(eventType)}
                maxLength={80}
                value={eventTag}
                onChange={e => setEventTag(e.target.value)}
              />
              <p className="text-[10px] text-white/25 mt-1 text-right">{eventTag.length}/80</p>
            </div>

            {/* Organiser email */}
            <div>
              <label className={labelClass}>Your Email</label>
              <input
                type="email"
                className={inputClass}
                style={{ ...inputPad, borderColor: organiserEmail ? 'rgba(184,150,12,0.4)' : 'rgba(255,255,255,0.08)' }}
                placeholder="you@example.com"
                maxLength={120}
                value={organiserEmail}
                onChange={e => setOrganiserEmail(e.target.value)}
              />
              <p className="text-[10px] text-white/25 mt-1">
                We'll send your capsule management link here
              </p>
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>Capsule URL</label>
              <div className="flex items-center gap-0 rounded-xl border overflow-hidden transition-all duration-200"
                style={{ borderColor: slug ? 'rgba(184,150,12,0.4)' : 'rgba(255,255,255,0.08)' }}>
                <span className="text-xs text-white/30 bg-white/4 border-r border-white/8 whitespace-nowrap flex-shrink-0"
                  style={{ padding: '16px 14px' }}>
                  itslegacycapsule.com/for/
                </span>
                <input
                  className="flex-1 bg-white/4 text-white/90 text-sm outline-none placeholder:text-white/25"
                  style={{ padding: '16px 16px' }}
                  placeholder="your-slug"
                  maxLength={60}
                  value={slug}
                  onChange={e => {
                    setSlugManual(true)
                    setSlug(toSlug(e.target.value))
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-[10px] text-white/25">Auto-generated from honouree name · edit to customise</p>
                <p className="text-[10px] text-white/25">{slug.length}/60</p>
              </div>
            </div>

            {/* Live URL preview */}
            {slug && (
              <div className="px-4 py-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5">
                <p className="text-[10px] uppercase tracking-widest text-yellow-400/50 mb-1">Your capsule link</p>
                <p className="text-xs text-yellow-200/80 break-all">
                  itslegacycapsule.com/for/<span className="font-semibold">{slug}</span>
                </p>
              </div>
            )}
          </div>

          {/* Summary panel */}
          {tier === 'free' && (
            <div className="px-5 py-4 rounded-xl border border-white/8 bg-white/3 mb-6">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Your free capsule</p>
              <p className="text-xs text-white/55 leading-relaxed">
                Tribute wall active for 90 days · Up to 50 contributors · Upgrade anytime
              </p>
            </div>
          )}
          {selectedTierData && tier !== 'free' && (
            <>
              <GoldDivider />
              <div className="px-5 py-4 rounded-xl border border-white/8 bg-white/3 space-y-3 mb-6">
                <p className="text-[10px] uppercase tracking-widest text-white/30">Order summary</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/55">Package</span>
                  <span className="text-xs text-white/80 font-medium">{selectedTierData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/55">Occasion</span>
                  <span className="text-xs text-white/80">{eventType}</span>
                </div>
                <div className="h-px bg-white/8" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/55">Total</span>
                  <span className="text-sm font-bold text-yellow-300">
                    €{selectedTierData.eur_price}
                  </span>
                </div>
                <p className="text-[10px] text-white/25 pt-1">
                  Payment integration coming soon — your capsule will be created immediately
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-red-400/30 bg-red-400/8 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="w-full max-w-xl mx-auto mt-6 mb-8 flex-shrink-0"
            style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #B8960C99, transparent)' }} />

          <div className="flex gap-3 w-full max-w-xl mx-auto">
            <button
              onClick={() => setScreen(3)}
              className="flex-1 flex items-center justify-center py-4 rounded-xl border text-sm font-medium tracking-wide transition-all duration-200"
              style={{ borderColor: 'rgba(184,150,12,0.3)', color: 'rgba(255,255,255,0.45)' }}>
              ← Back
            </button>
            <button
              onClick={handleCreateCapsule}
              disabled={!canSubmit}
              className="flex-[3] flex items-center justify-center px-8 py-4 rounded-xl font-semibold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !canSubmit ? 'rgba(184,150,12,0.15)' : 'linear-gradient(135deg, #B8960C 0%, #D4AE2A 50%, #B8960C 100%)',
                color: !canSubmit ? '#B8960C99' : '#0D0820',
                boxShadow: !canSubmit ? 'none' : '0 4px 24px #B8960C44',
              }}>
              {creating
                ? 'Creating…'
                : tier === 'free'
                ? 'Go Live Free →'
                : (content['booking__cta_create'] ?? 'Create Capsule') + ' →'}
            </button>
          </div>

          <BookingFooter />
        </div>
      </ScreenShell>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREEN 5 — Confirmation (unchanged from original)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScreenShell>
      <div className="w-full max-w-xl flex flex-col items-center text-center pt-20 gap-2">
        <BookingLogo />

        <div className="w-20 h-20 rounded-full border border-yellow-400/40 bg-yellow-400/10 flex items-center justify-center mb-8 mt-4"
          style={{ boxShadow: '0 0 32px #B8960C33' }}>
          <span className="text-2xl">✦</span>
        </div>

        <h1 className="text-2xl font-bold text-white/90 mb-3 tracking-wide"
          style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
          Your capsule is live
        </h1>
        <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-sm">
          We've created your LegacyCapsule for <span className="text-white/80 font-medium">{honoureeName}</span>.
          Check your email for your management link.
        </p>

        <div className="px-5 py-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 w-full mb-10 mt-2">
          <p className="text-[10px] uppercase tracking-widest text-yellow-400/50 mb-1">Your capsule link</p>
          <p className="text-sm text-yellow-200/80 break-all">
            itslegacycapsule.com/for/<span className="font-semibold">{slug}</span>
          </p>
        </div>

        <Link
          href={`/for/${slug}`}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #B8960C 0%, #D4AE2A 50%, #B8960C 100%)',
            color: '#0D0820',
            boxShadow: '0 4px 24px #B8960C44',
          }}>
          View Your Capsule →
        </Link>

        <BookingFooter />
      </div>
    </ScreenShell>
  )
}

















