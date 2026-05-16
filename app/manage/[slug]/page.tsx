'use client'

// ─────────────────────────────────────────────────────────────────────────────
// app/manage/[slug]/page.tsx
// Organiser Control Panel — private management page for capsule owners.
// Access: /manage/[slug]?email=[encoded_organiser_email]
// Email param read first, then localStorage fallback.
//
// Sections:
//   1. Imports + types
//   2. Constants + helpers
//   3. Component
//   4. Data fetching
//   5. Moderation actions
//   6. Render — payment banner, stats, tabs, contribution cards, share
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. IMPORTS + TYPES ────────────────────────────────────────────────────────

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LogoCapsule from '@/components/LogoCapsule'

type Capsule = {
  id: string
  slug: string
  honouree_name: string | null
  event_type: string | null
  organiser_email: string | null
  page_state: string | null
  tier: string | null
  free_tier_expires_at: string | null
}

type ContributionStatus = 'pending_review' | 'approved' | 'declined' | string

type Contribution = {
  id: string
  capsule_id: string
  contributor_name: string | null
  city: string | null
  country: string | null
  tribute_text: string | null
  status: ContributionStatus | null
  created_at: string
}

type Filter = 'all' | 'pending_review' | 'approved'

// ── 2. CONSTANTS + HELPERS ────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'

const BG = 'min-h-screen'
const BG_STYLE = { background: 'linear-gradient(160deg, #0D0820 0%, #1A0F3E 50%, #0D0820 100%)' }

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── 3. COMPONENT ──────────────────────────────────────────────────────────────

function ManagePage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const slug         = params.slug as string

  // ── Payment state from URL ─────────────────────────────────────────────────
  const paymentSuccess   = searchParams.get('payment') === 'success'
  const paymentCancelled = searchParams.get('payment') === 'cancelled'

  // ── Organiser auth — email from URL param or localStorage ─────────────────
  const emailParam = searchParams.get('email')
  const [organiserEmail, setOrganiserEmail] = useState<string>('')

  useEffect(() => {
    if (emailParam) {
      setOrganiserEmail(decodeURIComponent(emailParam))
      if (typeof window !== 'undefined') {
        localStorage.setItem('lc_organiser_email', decodeURIComponent(emailParam))
      }
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lc_organiser_email')
      if (stored) setOrganiserEmail(stored)
    }
  }, [emailParam])

  // ── Data state ─────────────────────────────────────────────────────────────
  const [capsule,       setCapsule]       = useState<Capsule | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [filter,        setFilter]        = useState<Filter>('all')
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copySuccess,   setCopySuccess]   = useState(false)
  const [error,         setError]         = useState('')

  // ── 4. DATA FETCHING ───────────────────────────────────────────────────────

  async function loadData() {
    setLoading(true)
    setError('')

    const { data: capsuleData, error: capsuleError } = await supabase
      .from('capsules')
      .select('id, slug, honouree_name, event_type, organiser_email, page_state, tier, free_tier_expires_at')
      .eq('slug', slug)
      .single()

    if (capsuleError || !capsuleData) {
      setError('Capsule not found.')
      setLoading(false)
      return
    }

    setCapsule(capsuleData)

    const { data: contribData } = await supabase
      .from('contributions')
      .select('id, capsule_id, contributor_name, city, country, tribute_text, status, created_at')
      .eq('capsule_id', capsuleData.id)
      .order('created_at', { ascending: false })

    setContributions(contribData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (slug) loadData()
  }, [slug])

  // ── 5. MODERATION ACTIONS ─────────────────────────────────────────────────

  async function handleApprove(id: string) {
    setActionLoading(id)
    await fetch('/api/admin/moderation/approve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, reason: 'Organiser approved' }),
    })
    setContributions(prev =>
      prev.map(c => c.id === id ? { ...c, status: 'approved' } : c)
    )
    setActionLoading(null)
  }

  async function handleDecline(id: string) {
    setActionLoading(id)
    await fetch('/api/admin/moderation/remove', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, reason: 'Organiser declined' }),
    })
    setContributions(prev =>
      prev.map(c => c.id === id ? { ...c, status: 'declined' } : c)
    )
    setActionLoading(null)
  }

  async function handleCopyLink() {
    const link = `${APP_URL}/for/${slug}`
    try {
      await navigator.clipboard.writeText(link)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      // Fallback for browsers that block clipboard
    }
  }

  function handleWhatsApp() {
    const link    = `${APP_URL}/for/${slug}`
    const message = encodeURIComponent(
      `We've created a LegacyCapsule for ${capsule?.honouree_name ?? 'our honouree'} — share your tribute here: ${link}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  // ── FILTERED CONTRIBUTIONS ─────────────────────────────────────────────────
  const filtered = contributions.filter(c => {
    if (filter === 'all')           return c.status !== 'declined'
    if (filter === 'pending_review') return c.status === 'pending_review'
    if (filter === 'approved')       return c.status === 'approved'
    return true
  })

  const totalCount   = contributions.filter(c => c.status !== 'declined').length
  const pendingCount = contributions.filter(c => c.status === 'pending_review').length
  const approvedCount = contributions.filter(c => c.status === 'approved').length

  // ── 6. RENDER ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={BG} style={BG_STYLE}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !capsule) {
    return (
      <div className={BG} style={BG_STYLE}>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-white/50 text-sm">{error || 'Something went wrong.'}</p>
          <Link href="/" className="text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const capsuleUrl = `${APP_URL}/for/${slug}`

  return (
    <div className={BG} style={BG_STYLE}>
      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* ── LOGO ──────────────────────────────────────────────────────────── */}
        <div className="flex justify-center mb-2">
          <LogoCapsule size="sm" />
        </div>

        {/* ── PAYMENT SUCCESS BANNER ─────────────────────────────────────────── */}
        {/* Shown when organiser returns from successful Stripe checkout          */}
        {paymentSuccess && (
          <div style={{
            background:   'linear-gradient(135deg, rgba(184,150,12,0.12), rgba(184,150,12,0.24))',
            border:       '1px solid #B8960C',
            borderRadius: '12px',
            padding:      '16px 20px',
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
          }}>
            <span style={{ fontSize: '1.2rem', color: '#B8960C' }}>✦</span>
            <div>
              <p style={{ color: '#B8960C', fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                Payment confirmed — your capsule is now live.
              </p>
              <p style={{ color: 'rgba(184,150,12,0.7)', fontSize: '0.75rem' }}>
                Your tribute wall is active and accepting contributions from anywhere in the world.
              </p>
            </div>
          </div>
        )}

        {/* ── PAYMENT PENDING BANNER ─────────────────────────────────────────── */}
        {/* Shown if organiser accesses manage page before payment confirmed      */}
        {!paymentSuccess && capsule.page_state === 'pending_payment' && (
          <div style={{
            background:   'rgba(251,191,36,0.06)',
            border:       '1px solid rgba(251,191,36,0.25)',
            borderRadius: '12px',
            padding:      '16px 20px',
          }}>
            <p style={{ color: 'rgba(251,191,36,0.85)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
              Payment not yet confirmed
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', lineHeight: 1.5 }}>
              Your capsule is saved but not yet active. If you completed payment, it may take a moment to confirm.
              Refresh this page in a minute. If payment was not completed,{' '}
              <Link href={`/book?payment=cancelled&slug=${slug}`}
                style={{ color: '#B8960C', textDecoration: 'underline' }}>
                return to complete your payment
              </Link>.
            </p>
          </div>
        )}

        {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/50 mb-1"
            style={{ fontFamily: 'var(--font-accent, "Cormorant SC", serif)' }}>
            Capsule Control Panel
          </p>
          <h1 className="text-2xl font-bold text-white/90 tracking-wide"
            style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
            {capsule.honouree_name}
          </h1>
          <p className="text-xs text-white/35 mt-1">
            {capsule.event_type} · {capsuleUrl.replace('https://', '')}
          </p>
        </div>

        {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',   value: totalCount },
            { label: 'Pending', value: pendingCount,  highlight: pendingCount > 0 },
            { label: 'Live',    value: approvedCount },
          ].map(stat => (
            <div key={stat.label} style={cardStyle} className="px-4 py-4 text-center">
              <p className="text-2xl font-bold"
                style={{ color: stat.highlight ? '#B8960C' : 'rgba(255,255,255,0.85)' }}>
                {stat.value}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── CAPSULE LINK + SHARE ──────────────────────────────────────────── */}
        <div style={cardStyle} className="px-5 py-5 flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-widest text-white/30">
            Your Capsule Link
          </p>
          <p className="text-sm text-yellow-200/70 break-all">{capsuleUrl}</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200"
              style={{
                background: copySuccess ? 'rgba(34,197,94,0.15)' : 'rgba(184,150,12,0.12)',
                border:     copySuccess ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(184,150,12,0.25)',
                color:      copySuccess ? 'rgb(134,239,172)' : '#B8960C',
              }}>
              {copySuccess ? '✓ Copied' : 'Copy Link'}
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200"
              style={{
                background: 'rgba(37,211,102,0.10)',
                border:     '1px solid rgba(37,211,102,0.25)',
                color:      'rgb(134,239,172)',
              }}>
              Share via WhatsApp
            </button>
            <Link
              href={`/for/${slug}`}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 text-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.08)',
                color:      'rgba(255,255,255,0.5)',
              }}>
              View Wall →
            </Link>
          </div>
        </div>

        {/* ── MODERATION TABS ───────────────────────────────────────────────── */}
        <div>
          <div className="flex gap-1 mb-4 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['all', 'pending_review', 'approved'] as Filter[]).map(f => {
              const labels: Record<Filter, string> = {
                all:           `All (${totalCount})`,
                pending_review: `Pending (${pendingCount})`,
                approved:      `Approved (${approvedCount})`,
              }
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200"
                  style={{
                    background: filter === f ? 'rgba(184,150,12,0.15)' : 'transparent',
                    color:      filter === f ? '#B8960C' : 'rgba(255,255,255,0.35)',
                    border:     filter === f ? '1px solid rgba(184,150,12,0.3)' : '1px solid transparent',
                  }}>
                  {labels[f]}
                </button>
              )
            })}
          </div>

          {/* ── CONTRIBUTION CARDS ──────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/25 text-sm">
                {filter === 'pending_review'
                  ? 'No tributes awaiting review.'
                  : filter === 'approved'
                  ? 'No approved tributes yet.'
                  : 'No tributes yet. Share your capsule link to start collecting.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(c => {
                const isPending  = c.status === 'pending_review'
                const isApproved = c.status === 'approved'
                const isLoading  = actionLoading === c.id

                return (
                  <div key={c.id} style={cardStyle} className="px-5 py-5">
                    {/* Contributor header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white/85">
                          {c.contributor_name ?? 'Anonymous'}
                        </p>
                        {(c.city || c.country) && (
                          <p className="text-[11px] text-white/35 mt-0.5">
                            {[c.city, c.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-[10px] text-white/25">{formatDate(c.created_at)}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: isPending  ? 'rgba(251,191,36,0.12)'
                                      : isApproved ? 'rgba(34,197,94,0.12)'
                                      : 'rgba(255,255,255,0.05)',
                            color:      isPending  ? 'rgb(253,224,71)'
                                      : isApproved ? 'rgb(134,239,172)'
                                      : 'rgba(255,255,255,0.3)',
                            border:     isPending  ? '1px solid rgba(251,191,36,0.25)'
                                      : isApproved ? '1px solid rgba(34,197,94,0.25)'
                                      : '1px solid rgba(255,255,255,0.08)',
                          }}>
                          {isPending ? 'Pending' : isApproved ? 'Approved' : 'Declined'}
                        </span>
                      </div>
                    </div>

                    {/* Tribute text */}
                    {c.tribute_text && (
                      <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-4">
                        {c.tribute_text}
                      </p>
                    )}

                    {/* Actions — only for pending */}
                    {isPending && (
                      <div className="flex gap-2 pt-2 border-t border-white/6">
                        <button
                          onClick={() => handleApprove(c.id)}
                          disabled={isLoading}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 disabled:opacity-40"
                          style={{
                            background: 'rgba(34,197,94,0.12)',
                            border:     '1px solid rgba(34,197,94,0.25)',
                            color:      'rgb(134,239,172)',
                          }}>
                          {isLoading ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDecline(c.id)}
                          disabled={isLoading}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 disabled:opacity-40"
                          style={{
                            background: 'rgba(239,68,68,0.10)',
                            border:     '1px solid rgba(239,68,68,0.22)',
                            color:      'rgb(252,165,165)',
                          }}>
                          {isLoading ? '…' : 'Decline'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <p className="text-center text-[10px] tracking-widest text-white/15 uppercase mt-4">
          VALNEX, UNIPESSOAL LDA · RevoWorldTech
        </p>

      </div>
    </div>
  )
}

export default function ManagePageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ background: 'linear-gradient(160deg, #0D0820 0%, #1A0F3E 50%, #0D0820 100%)' }}
        className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
      </div>
    }>
      <ManagePage />
    </Suspense>
  )
}