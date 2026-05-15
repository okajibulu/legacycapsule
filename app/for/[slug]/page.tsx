'use client'

import { useState, useEffect, useRef } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LogoCapsule from '@/components/LogoCapsule'
import {
  getTributePageTitle,
  getEventTagDisplay,
  getProfileLinkLabel,
  getRelationshipLabel,
} from '@/lib/eventLabels'
import {
  formatTributeDate,
  getInitials,
  EVENT_TYPE_ORNAMENT,
} from '@/lib/tributeWallHelpers'

// ── Dynamic Leaflet map (no SSR) ─────────────────────────────
import dynamic from 'next/dynamic'
const TributeMap = dynamic(() => import('@/components/TributeMap'), { ssr: false })

// ── Types ────────────────────────────────────────────────────
interface Capsule {
  id: string
  slug: string
  honouree_name: string
  event_tag: string | null
  event_type: string
  page_state: string
  hero_image_url: string | null
  organiser_email: string
  tier: string | null
}

interface Contribution {
  id: string
  capsule_id: string
  contributor_name: string
  city: string
  country: string
  relationship: string | null
  tribute_text: string
  photo_url: string | null
  email: string | null
  status: string
  created_at: string
  latitude: number | null
  longitude: number | null
}

// ── Component ────────────────────────────────────────────────
export default function TributeWallPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const [capsule, setCapsule]           = useState<Capsule | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading]           = useState(true)
  const [expandedIds, setExpandedIds]   = useState<Set<string>>(new Set())
  const [copied, setCopied]             = useState(false)
  const stickyRef = useRef<HTMLDivElement>(null)

  // ── Load capsule + contributions ─────────────────────────
  useEffect(() => {
    if (!slug) return
    async function load() {
      setLoading(true)
      const { data: cap } = await supabase
        .from('capsules')
        .select('*')
        .eq('slug', slug)
        .single()
      if (cap) {
        setCapsule(cap)
        const { data: contribs } = await supabase
          .from('contributions')
          .select('*')
          .eq('capsule_id', cap.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
        setContributions(contribs ?? [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  // ── Real-time contributions ──────────────────────────────
  useEffect(() => {
    if (!capsule?.id) return
    const channel = supabase
      .channel(`tributes-${capsule.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contributions',
        filter: `capsule_id=eq.${capsule.id}`,
      }, () => {
        supabase
          .from('contributions')
          .select('*')
          .eq('capsule_id', capsule.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .then(({ data }) => setContributions(data ?? []))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [capsule?.id])

  // ── Helpers ──────────────────────────────────────────────
  const capsuleUrl = typeof window !== 'undefined'
    ? window.location.origin + `/for/${slug}`
    : `https://itslegacycapsule.com/for/${slug}`

  function copyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(capsuleUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg,#0D0820 0%,#1A0F3E 50%,#0D0820 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────
  if (!capsule) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg,#0D0820 0%,#1A0F3E 50%,#0D0820 100%)' }}>
        <LogoCapsule size="md" />
        <h1 className="mt-8 text-2xl font-bold text-white/80"
          style={{ fontFamily: 'var(--font-heading,"Playfair Display",serif)' }}>
          Capsule not found
        </h1>
        <p className="mt-3 text-sm text-white/40">
          This link may be incorrect or the capsule may have been removed.
        </p>
        <Link href="/" className="mt-8 text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors">
          ← Return to LegacyCapsule
        </Link>
      </div>
    )
  }

  // ── Not yet active ───────────────────────────────────────
  if (capsule.page_state === 'pending_verification') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg,#0D0820 0%,#1A0F3E 50%,#0D0820 100%)' }}>
        <LogoCapsule size="md" />
        <div className="mt-10 text-center max-w-sm">
          <p className="text-4xl mb-6">⏳</p>
          <h1 className="text-2xl font-bold text-yellow-100 mb-3"
            style={{ fontFamily: 'var(--font-heading,"Playfair Display",serif)' }}>
            Not yet active
          </h1>
          <p className="text-sm text-white/50 leading-relaxed mb-2">
            The organiser needs to verify their email before this capsule can accept tributes.
          </p>
          <p className="text-xs text-white/30">
            If you are the organiser, check your inbox for the verification email.
          </p>
        </div>
      </div>
    )
  }

  // ── Derived values ───────────────────────────────────────
  const title       = getTributePageTitle(capsule.event_type, capsule.honouree_name)
  const eventTag    = getEventTagDisplay(capsule.event_tag)
  const ornament    = EVENT_TYPE_ORNAMENT[capsule.event_type] ?? '✦'
  const profileLink = getProfileLinkLabel(capsule.event_type, capsule.honouree_name)
  const mapPins     = contributions
    .filter(c => c.latitude && c.longitude)
    .map(c => ({ lat: c.latitude!, lng: c.longitude!, name: c.contributor_name, country: c.country }))

  const whatsappText = encodeURIComponent(
    `A tribute wall has been created for ${capsule.honouree_name}. Leave your message here — it will be part of something beautiful.\n${capsuleUrl}\nTakes 2 minutes. Every word matters.`
  )

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#F5F3EE' }}>

      {/* ── HERO ── */}
      <div className="relative flex flex-col items-center justify-center px-6 py-16 text-center"
        style={{ background: '#2D1B69', minHeight: '320px' }}>

        {/* LC logo mark */}
        <div className="mb-6">
          <LogoCapsule size="sm" />
        </div>

        {/* Event type ornament */}
        <p className="text-2xl mb-4">{ornament}</p>

        {/* Honouree name — public display */}
        <Link href={`/for/${slug}/profile`}>
          <h1 className="text-4xl font-bold text-white cursor-pointer hover:text-yellow-200 transition-colors duration-200"
            style={{ fontFamily: 'var(--font-heading,"Playfair Display",serif)', letterSpacing: '0.02em' }}>
            {title}
          </h1>
        </Link>

        {/* Event tag */}
        {eventTag && (
          <p className="mt-4 text-xs tracking-[0.35em] uppercase"
            style={{ color: '#B8960C', fontFamily: 'var(--font-accent,"Cormorant SC",serif)' }}>
            {eventTag}
          </p>
        )}

        {/* Gold threshold rule */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg,transparent,#B8960C,transparent)' }} />
      </div>

      {/* ── STICKY BAR ── */}
      <div ref={stickyRef}
        className="sticky top-0 z-50 w-full"
        style={{
          background: '#2D1B69',
          borderBottom: '1px solid rgba(184,150,12,0.25)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
        <div className="flex items-stretch" style={{ height: '180px' }}>

          {/* Map — left 60% */}
          <div className="relative flex-1" style={{ minWidth: 0 }}>
            <TributeMap pins={mapPins} />
            {/* Powered by overlay */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-40"
                style={{ color: '#B8960C', fontFamily: 'var(--font-body,"DM Sans",sans-serif)' }}>
                Powered by LegacyCapsule
              </p>
            </div>
          </div>

          {/* Info panel — right 40% */}
          <div className="flex flex-col justify-between px-5 py-4 flex-shrink-0"
            style={{ width: '40%', borderLeft: '1px solid rgba(184,150,12,0.15)' }}>

            {/* Event name + honouree */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] mb-1"
                style={{ color: 'rgba(184,150,12,0.7)', fontFamily: 'var(--font-accent,"Cormorant SC",serif)' }}>
                {capsule.event_type}
              </p>
              <p className="text-base font-bold leading-tight"
                style={{ color: '#FFFFFF', fontFamily: 'var(--font-heading,"Playfair Display",serif)' }}>
                {capsule.honouree_name}
              </p>
              {capsule.event_tag && (
                <p className="text-[10px] mt-1 leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {capsule.event_tag}
                </p>
              )}
            </div>

            {/* Tribute count */}
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#B8960C', fontSize: '10px' }}>✦</span>
              <span className="text-xs font-semibold"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                {contributions.length} {contributions.length === 1 ? 'tribute' : 'tributes'}
              </span>
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 text-[10px] py-1.5 rounded-lg border transition-all duration-200"
                style={{
                  borderColor: 'rgba(184,150,12,0.3)',
                  color: copied ? '#B8960C' : 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.04)',
                }}>
                {copied ? 'Copied ✓' : 'Copy link'}
              </button>
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-[10px] py-1.5 rounded-lg text-center transition-all duration-200"
                style={{
                  background: 'rgba(37,211,102,0.15)',
                  color: 'rgba(37,211,102,0.8)',
                  border: '1px solid rgba(37,211,102,0.25)',
                }}>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRIBUTE SECTION ── */}
      <div className="relative">

        {/* Honouree photo ambient backdrop */}
        {capsule.hero_image_url && (
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${capsule.hero_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              opacity: 0.07,
            }} />
        )}

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">

          {/* Section header */}
          <div className="text-center mb-8">
            <div className="flex items-center gap-3 justify-center mb-2">
              <div className="h-px flex-1"
                style={{ background: 'linear-gradient(90deg,transparent,#B8960C)' }} />
              <p className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: '#B8960C', fontFamily: 'var(--font-accent,"Cormorant SC",serif)' }}>
                ✦ Tribute Wall ✦
              </p>
              <div className="h-px flex-1"
                style={{ background: 'linear-gradient(90deg,#B8960C,transparent)' }} />
            </div>
            <p className="text-sm" style={{ color: '#5F5E5A' }}>
              {contributions.length} {contributions.length === 1 ? 'tribute' : 'tributes'}
            </p>
          </div>

          {/* Empty state */}
          {contributions.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-4">✦</p>
              <p className="text-base font-medium" style={{ color: '#5F5E5A' }}>
                No tributes yet
              </p>
              <p className="text-sm mt-2" style={{ color: '#9F9E9A' }}>
                Be the first to leave a tribute
              </p>
            </div>
          )}

          {/* Tribute cards */}
          <div className="flex flex-col gap-5">
            {contributions.map(c => {
              const isLong    = c.tribute_text.length > 300
              const expanded  = expandedIds.has(c.id)
              const displayText = isLong && !expanded
                ? c.tribute_text.slice(0, 300) + '…'
                : c.tribute_text

              return (
                <div key={c.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: '#F5F3EE',
                    boxShadow: '0 2px 16px rgba(45,27,105,0.10), 0 1px 4px rgba(45,27,105,0.06)',
                    border: '1px solid rgba(184,150,12,0.12)',
                  }}>

                  {/* Gold top rule */}
                  <div className="h-[2px]"
                    style={{ background: 'linear-gradient(90deg,transparent,#B8960C,transparent)' }} />

                  <div className="px-6 py-5">

                    {/* Contributor header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">

                        {/* Photo or initials */}
                        {c.photo_url ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                            style={{ border: '2px solid #B8960C' }}>
                            <img src={c.photo_url} alt={c.contributor_name}
                              className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                            style={{ background: '#2D1B69', color: '#B8960C', border: '2px solid #B8960C' }}>
                            {getInitials(c.contributor_name)}
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-sm"
                            style={{ color: '#1C1C1E', fontFamily: 'var(--font-body,"DM Sans",sans-serif)' }}>
                            {c.contributor_name}
                          </p>
                          <p className="text-xs mt-0.5"
                            style={{ color: '#5F5E5A' }}>
                            {c.city}
                            <span className="mx-1.5" style={{ color: '#B8960C' }}>✦</span>
                            {c.country}
                          </p>
                          {c.relationship && (
                            <p className="text-xs mt-0.5 italic"
                              style={{ color: '#9F9E9A' }}>
                              {c.relationship}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-[10px] flex-shrink-0 mt-1"
                        style={{ color: '#9F9E9A' }}>
                        {formatTributeDate(c.created_at)}
                      </p>
                    </div>

                    {/* Tribute text */}
                    <p className="text-sm leading-relaxed"
                      style={{
                        color: '#1C1C1E',
                        fontFamily: 'var(--font-body,"DM Sans",sans-serif)',
                        lineHeight: '1.8',
                      }}>
                      {displayText}
                    </p>

                    {/* Expand toggle */}
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="mt-2 text-xs font-medium transition-colors duration-200"
                        style={{ color: '#B8960C' }}>
                        {expanded ? 'Show less ↑' : 'Read more ↓'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Profile link card */}
          {capsule && (
            <Link href={`/for/${slug}/profile`}>
              <div className="mt-10 rounded-2xl px-6 py-5 text-center cursor-pointer transition-all duration-200 hover:shadow-md"
                style={{
                  background: '#F5F3EE',
                  border: '1px solid rgba(184,150,12,0.25)',
                  boxShadow: '0 2px 12px rgba(45,27,105,0.08)',
                }}>
                <p className="text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: '#B8960C', fontFamily: 'var(--font-accent,"Cormorant SC",serif)' }}>
                  ✦
                </p>
                <p className="text-sm font-semibold"
                  style={{ color: '#2D1B69', fontFamily: 'var(--font-heading,"Playfair Display",serif)' }}>
                  {profileLink}
                </p>
                <p className="text-xs mt-1" style={{ color: '#9F9E9A' }}>
                  View profile →
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ── ADD YOUR TRIBUTE CTA ── */}
      <div className="sticky bottom-0 z-40 px-4 py-4"
        style={{ background: 'linear-gradient(0deg,#F5F3EE 60%,transparent)' }}>
        <Link href={`/for/${slug}/submit`}>
          <div className="max-w-sm mx-auto rounded-2xl py-4 text-center font-semibold text-base tracking-wide transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg,#B8960C 0%,#D4AE2A 50%,#B8960C 100%)',
              color: '#2D1B69',
              boxShadow: '0 4px 24px rgba(184,150,12,0.35)',
              fontFamily: 'var(--font-body,"DM Sans",sans-serif)',
            }}>
            ✦ Add Your Tribute
          </div>
        </Link>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-4 py-10 text-center"
        style={{ background: '#2D1B69' }}>
        <p className="text-[10px] uppercase tracking-[0.25em] mb-3"
          style={{ color: 'rgba(184,150,12,0.5)' }}>
          VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Planning your own event?{' '}
          <Link href="/book"
            className="underline underline-offset-2 hover:text-yellow-400/50 transition-colors duration-200"
            style={{ color: 'rgba(184,150,12,0.4)' }}>
            Start here →
          </Link>
        </p>
      </div>

    </div>
  )
}

