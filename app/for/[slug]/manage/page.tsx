'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import LogoCapsule from '@/components/LogoCapsule'
import { supabase } from '@/lib/supabase'

type Capsule = {
  id: string
  slug: string
  honouree_name: string | null
  event_type: string | null
  organiser_email: string | null
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
const background = 'linear-gradient(160deg, #0D0820 0%, #1A0F3E 50%, #0D0820 100%)'
const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

export default function CapsuleManagePage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const storedEmail = localStorage.getItem('lc_organiser_email')
    const organiserEmail = emailParam 
      ? decodeURIComponent(emailParam) 
      : storedEmail
    if (emailParam) {
      localStorage.setItem('lc_organiser_email', decodeURIComponent(emailParam))
    }

    const loadManageData = async () => {
      if (!slug) return

      setLoading(true)

      const { data: capsuleData } = await supabase
        .from('capsules')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!capsuleData) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      if (
        !organiserEmail ||
        !capsuleData.organiser_email ||
        organiserEmail.toLowerCase() !== capsuleData.organiser_email.toLowerCase()
      ) {
        setCapsule(capsuleData)
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setCapsule(capsuleData)

      const { data: contributionData } = await supabase
        .from('contributions')
        .select('*')
        .eq('capsule_id', capsuleData.id)
        .order('created_at', { ascending: false })

      setContributions(contributionData ?? [])
      setAccessDenied(false)
      setLoading(false)
    }

    loadManageData()
  }, [slug])

  const honoureeName = capsule?.honouree_name ?? 'Legacy Capsule'
  const tributeUrl = `${appUrl}/for/${slug}`

  const filteredContributions = useMemo(() => {
    if (activeFilter === 'all') return contributions
    return contributions.filter((item) => item.status === activeFilter)
  }, [activeFilter, contributions])

  const counts = useMemo(() => ({
    total: contributions.length,
    pending: contributions.filter((item) => item.status === 'pending_review').length,
    approved: contributions.filter((item) => item.status === 'approved').length,
  }), [contributions])

  const updateContributionStatus = async (id: string, status: ContributionStatus) => {
    setContributions((current) =>
      current.map((item) => item.id === id ? { ...item, status } : item)
    )

    const { error } = await supabase
      .from('contributions')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error(error.message)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(tributeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const shareWhatsApp = () => {
    const message = `We've created a tribute wall for ${honoureeName}. Leave your message here — it will be part of something beautiful. ${tributeUrl} Takes 2 minutes. Every word matters.`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background }}>
        <style>{'@keyframes lcSpin { to { transform: rotate(360deg); } }'}</style>
        <div
          aria-label="Loading"
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid rgba(184,150,12,0.3)',
            borderTopColor: '#B8960C',
            borderRadius: '50%',
            animation: 'lcSpin 0.8s linear infinite',
          }}
        />
      </main>
    )
  }

  if (accessDenied) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background }}>
        <div className="max-w-sm text-center">
          <div className="mb-5 text-4xl text-[#B8960C]">✦</div>
          <h1
            className="mb-3 text-2xl text-white/90"
            style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}
          >
            Access restricted
          </h1>
          <p
            className="mb-8 text-sm leading-7 text-white/50"
            style={{ fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}
          >
            This page is only accessible to the capsule organiser. Check your email for your management link.
          </p>
          <Link
            href={`/for/${slug}`}
            className="inline-flex rounded-full border border-[#B8960C] px-5 py-2.5 text-sm font-semibold text-[#D4AE2A]"
            style={{ fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}
          >
            ← Return to Tribute Wall
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-white" style={{ background, fontFamily: 'var(--font-body, "DM Sans", sans-serif)' }}>
      <header className="flex flex-col gap-4 border-b px-6 py-4 md:flex-row md:items-center md:justify-between"
        style={{ background: 'rgba(13,8,32,0.95)', borderColor: 'rgba(184,150,12,0.15)' }}>
        <div className="flex justify-center md:w-48 md:justify-start">
          <LogoCapsule size="sm" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl text-[#D4AE2A]" style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
            {honoureeName}
          </h1>
          <p className="mt-1 text-xs text-white/45">
            {capsule?.event_type ?? 'Tribute wall'}
          </p>
        </div>

        <div className="flex justify-center md:w-48 md:justify-end">
          <Link
            href={`/for/${slug}`}
            className="rounded-full border border-[#B8960C] px-4 py-2 text-xs font-semibold text-[#D4AE2A]"
          >
            View Tribute Wall →
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Tributes received" value={counts.total} />
            <StatCard label="Pending review" value={counts.pending} />
            <StatCard label="Approved & live" value={counts.approved} />
          </div>

          <div className="p-5" style={{ ...cardStyle, borderColor: 'rgba(184,150,12,0.35)' }}>
            <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/35">Your tribute wall link</p>
            <p className="mb-4 break-all text-sm text-[#D4AE2A]">itslegacycapsule.com/for/{slug}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={copyLink} className="rounded-lg border border-[#B8960C] px-4 py-2 text-xs font-semibold text-[#D4AE2A]">
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button onClick={shareWhatsApp} className="rounded-lg bg-[#B8960C] px-4 py-2 text-xs font-bold text-[#0D0820]">
                Share on WhatsApp
              </button>
            </div>
          </div>
        </section>

        <GoldDivider />

        <section>
          <p
            className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#B8960C]"
            style={{ fontFamily: 'var(--font-accent, "Cormorant SC", serif)' }}
          >
            Tribute Moderation
          </p>

          <div className="mb-5 flex gap-6 border-b border-white/10">
            <FilterButton label="All" value="all" active={activeFilter} onSelect={setActiveFilter} />
            <FilterButton label="Pending Review" value="pending_review" active={activeFilter} onSelect={setActiveFilter} />
            <FilterButton label="Approved" value="approved" active={activeFilter} onSelect={setActiveFilter} />
          </div>

          <div className="space-y-4">
            {filteredContributions.length === 0 ? (
              <div className="py-16 text-center" style={cardStyle}>
                <div className="mb-4 text-3xl text-[#B8960C]">✦</div>
                <p className="text-sm text-white/60">All tributes reviewed</p>
                <p className="mt-2 text-xs text-white/35">New submissions will appear here</p>
              </div>
            ) : filteredContributions.map((contribution) => {
              const isExpanded = expanded.has(contribution.id)
              const isPending = contribution.status === 'pending_review'

              return (
                <article key={contribution.id} className="p-5" style={cardStyle}>
                  <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-start">
                    <div className="flex-1">
                      <p className="font-bold text-white">
                        {contribution.contributor_name ?? 'Guest'}
                        <span className="ml-2 font-normal text-white/35">
                          · {[contribution.city, contribution.country].filter(Boolean).join(', ')}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-white/35 md:text-right">
                      {new Date(contribution.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <p
                    className="text-sm leading-7 text-white/80"
                    style={isExpanded ? undefined : {
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {contribution.tribute_text}
                  </p>

                  {(contribution.tribute_text?.length ?? 0) > 180 && (
                    <button onClick={() => toggleExpanded(contribution.id)} className="mt-2 text-xs text-[#D4AE2A] underline">
                      {isExpanded ? 'Show less' : 'Read full tribute'}
                    </button>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <StatusBadge status={contribution.status} />

                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateContributionStatus(contribution.id, 'approved')}
                          className="rounded-lg bg-[#B8960C] px-4 py-1.5 text-xs font-bold text-[#0D0820]"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => updateContributionStatus(contribution.id, 'declined')}
                          className="rounded-lg border border-red-400/45 px-4 py-1.5 text-xs font-semibold text-red-200"
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      <footer className="px-6 py-8 text-center text-[10px] uppercase tracking-[0.2em] text-white/20">
        VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
      </footer>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-t-2 border-[#B8960C] p-5" style={cardStyle}>
      <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className="text-3xl font-bold text-[#D4AE2A]" style={{ fontFamily: 'var(--font-heading, "Playfair Display", serif)' }}>
        {value}
      </p>
    </div>
  )
}

function GoldDivider() {
  return (
    <div
      className="my-8"
      style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #B8960C55, transparent)' }}
    />
  )
}

function FilterButton({
  label,
  value,
  active,
  onSelect,
}: {
  label: string
  value: Filter
  active: Filter
  onSelect: (value: Filter) => void
}) {
  const isActive = active === value

  return (
    <button
      onClick={() => onSelect(value)}
      className="relative pb-3 text-sm text-white/60 transition hover:text-white"
    >
      {label}
      {isActive && <span className="absolute bottom-0 left-0 h-px w-full bg-[#B8960C]" />}
    </button>
  )
}

function StatusBadge({ status }: { status: ContributionStatus | null }) {
  if (status === 'approved') {
    return <span className="w-fit rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-200">Live on Wall</span>
  }

  if (status === 'declined') {
    return <span className="w-fit rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs text-red-200">Declined</span>
  }

  return <span className="w-fit rounded-full border border-[#B8960C]/30 bg-[#B8960C]/10 px-3 py-1 text-xs text-[#D4AE2A]">Awaiting Review</span>
}
