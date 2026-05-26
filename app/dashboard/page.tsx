'use client'
/* =========================================================
   app/dashboard/page.tsx — Your Capsules
   Shows all capsules for signed-in organiser.
   - Event countdown or "Set event date" alert
   - Expiry indicator
   - Gold animation on capsule card click
   - Button press animations
========================================================= */
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const bg = '#0f0a1e'
const gold = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.12)'
const goldMuted = 'rgba(226,195,107,0.55)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.28)'
const textSecondary = 'rgba(255,255,255,0.50)'
const cardBg = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(226,195,107,0.10)'
const LS_EMAIL = 'lc_visitor_email'

interface CapsuleRow {
  id: string; slug: string; honouree_name: string
  event_type: string; event_tag: string | null
  approved_contrib_count: number; page_state: string
  event_date: string | null; free_tier_expires_at: string | null
  tier: string | null; pendingCount: number
}

function formatCountdown(eventDate: string): { label: string; color: string; urgent: boolean } {
  const days = Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: 'Event concluded', color: textFaint, urgent: false }
  if (days === 0) return { label: 'Today ✦', color: gold, urgent: true }
  if (days <= 7) return { label: `${days}d to event`, color: 'rgba(248,113,113,0.85)', urgent: true }
  if (days <= 30) return { label: `${days} days to event`, color: gold, urgent: true }
  return { label: `${days} days to event`, color: goldMuted, urgent: false }
}

function CapsuleCard({ capsule }: { capsule: CapsuleRow }) {
  const [pressed, setPressed] = useState(false)

  const countdown = capsule.event_date ? formatCountdown(capsule.event_date) : null
  const isFree = !capsule.tier || capsule.tier === 'free'
  const noEventDate = !capsule.event_date

  // Expiry — only meaningful if free tier
  let expiryLabel: string | null = null
  let expiryUrgent = false
  if (isFree && capsule.free_tier_expires_at) {
    const daysLeft = Math.ceil((new Date(capsule.free_tier_expires_at).getTime() - Date.now()) / 86400000)
    if (daysLeft <= 0) { expiryLabel = 'Expired'; expiryUrgent = true }
    else if (daysLeft <= 14) { expiryLabel = `${daysLeft}d before expiry`; expiryUrgent = true }
    else { expiryLabel = `${daysLeft} days before capsule expiry` }
  }

  return (
    <Link
      href={`/manage/${capsule.slug}`}
      style={{ textDecoration: 'none' }}
      onClick={() => { setPressed(true); setTimeout(() => setPressed(false), 400) }}
    >
      <div style={{
        padding: '16px', borderRadius: '14px',
        background: pressed ? 'rgba(226,195,107,0.08)' : cardBg,
        border: `1px solid ${pressed ? 'rgba(226,195,107,0.35)' : cardBorder}`,
        marginBottom: '8px', transition: 'all 0.2s ease',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        boxShadow: pressed ? '0 0 0 2px rgba(226,195,107,0.2)' : 'none',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capsule.honouree_name}</p>
            <p style={{ fontSize: '11px', color: textFaint }}>{capsule.event_type}{capsule.event_tag ? ` · ${capsule.event_tag}` : ''}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {capsule.approved_contrib_count > 0 && (
              <p style={{ fontSize: '18px', fontWeight: 800, color: gold, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{capsule.approved_contrib_count}</p>
            )}
            {capsule.approved_contrib_count > 0 && <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>tributes</p>}
          </div>
        </div>

        {/* Status strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {/* Live badge */}
          <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'rgba(134,239,172,0.85)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live</span>

          {/* Pending approval badge */}
          {capsule.pendingCount > 0 && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(226,195,107,0.1)', border: '1px solid rgba(226,195,107,0.3)', color: '#E2C36B', fontWeight: 700 }}>
              ✦ {capsule.pendingCount} awaiting approval
            </span>
          )}

          {/* Event countdown */}
          {countdown && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: countdown.urgent ? 'rgba(226,195,107,0.08)' : 'transparent', border: `1px solid ${countdown.urgent ? 'rgba(226,195,107,0.25)' : 'rgba(255,255,255,0.06)'}`, color: countdown.color, fontWeight: countdown.urgent ? 700 : 400 }}>
              {countdown.label}
            </span>
          )}

          {/* No event date alert */}
          {noEventDate && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', color: 'rgba(251,191,36,0.8)', fontWeight: 600 }}>
              ⚠ Set event date in Settings
            </span>
          )}

          {/* Expiry */}
          {expiryLabel && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: expiryUrgent ? 'rgba(248,113,113,0.06)' : 'transparent', border: `1px solid ${expiryUrgent ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'}`, color: expiryUrgent ? 'rgba(248,113,113,0.85)' : textFaint, fontWeight: expiryUrgent ? 700 : 400 }}>
              {expiryLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [capsules, setCapsules] = useState<CapsuleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function load() {
      // Session check
      const urlParams = new URLSearchParams(window.location.search)
      const authEmail = urlParams.get('auth')
      if (authEmail) {
        const decoded = decodeURIComponent(authEmail)
        localStorage.setItem(LS_EMAIL, decoded)
        window.history.replaceState({}, '', '/dashboard')
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Try Supabase session first
      let emailToUse = authEmail ? decodeURIComponent(authEmail) : ''
      if (!emailToUse) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user?.email) emailToUse = session.user.email
        } catch {}
      }
      if (!emailToUse) emailToUse = localStorage.getItem(LS_EMAIL) ?? ''

      if (!emailToUse) { window.location.href = '/signin'; return }

      setUserEmail(emailToUse)

      const { data } = await supabase
        .from('capsules')
        .select('id, slug, honouree_name, event_type, event_tag, approved_contrib_count, page_state, event_date, free_tier_expires_at, tier')
        .eq('organiser_email', emailToUse.toLowerCase())
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) { setCapsules([]); setLoading(false); return }

      // Fetch pending counts for all capsules in one query
      const capsuleIds = data.map(c => c.id)
      const { data: pendingData } = await supabase
        .from('contributions')
        .select('capsule_id')
        .in('capsule_id', capsuleIds)
        .in('status', ['pending', 'pending_review'])
        .is('deleted_at', null)

      // Count per capsule
      const pendingMap: Record<string, number> = {}
      pendingData?.forEach(row => {
        pendingMap[row.capsule_id] = (pendingMap[row.capsule_id] ?? 0) + 1
      })

      // Merge pending counts into capsule rows
      const enriched = data.map(c => ({ ...c, pendingCount: pendingMap[c.id] ?? 0 }))

      setCapsules(enriched ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem(LS_EMAIL)
    window.location.href = '/'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${goldFaint}`, borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '11px', color: textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading your capsules</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", color: textPrimary }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(226,195,107,0.08)`, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.16em', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LEGACY</span>
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.16em', color: textFaint, marginLeft: '0.1em' }}>CAPSULE</span>
          </Link>
          <button onClick={handleSignOut} style={{ fontSize: '12px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Your Capsules</h1>
          <p style={{ fontSize: '12px', color: textFaint }}>{userEmail}</p>
        </div>

        {capsules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px', background: cardBg, border: `1px solid ${cardBorder}` }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>◈</p>
            <p style={{ fontSize: '14px', color: textSecondary, marginBottom: '20px', lineHeight: 1.7 }}>No capsules yet. Create your first one — it takes under 3 minutes.</p>
            <Link href="/book" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '12px', background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`, color: '#1a0845', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>Start Your First Capsule</Link>
          </div>
        ) : (
          <>
            {capsules.map(c => <CapsuleCard key={c.id} capsule={c} />)}
          </>
        )}

        {/* Create another */}
        {capsules.length > 0 && (
          <Link href="/book" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: `1px dashed rgba(226,195,107,0.22)`, background: 'transparent', color: goldMuted, textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginTop: '8px', letterSpacing: '0.04em' }}>
            + Create Another Capsule
          </Link>
        )}
      </div>
    </div>
  )
}
