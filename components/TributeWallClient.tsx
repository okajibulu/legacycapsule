'use client'

// ─────────────────────────────────────────────────────────────────────────────
// TRIBUTE WALL CLIENT ISLAND
// Handles: polling, expand toggles, copy link, WhatsApp share.
// TributeMap dynamically imported here — Leaflet cannot run server-side.
// D43: Client island. Server component owns initial data fetch.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import LogoCapsule from '@/components/LogoCapsule'
import { getTributePageTitle } from '@/lib/eventLabels'
import { formatTributeDate, getInitials } from '@/lib/tributeWallHelpers'

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC IMPORT — TributeMap
// ssr: false mandatory. Leaflet uses browser APIs unavailable server-side.
// ─────────────────────────────────────────────────────────────────────────────
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: '#0a0010',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.1em' }}>
        LOADING MAP
      </p>
    </div>
  ),
})

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT — anon key for client-side polling
// ─────────────────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// EVENT TYPE ORNAMENT MAP
// Local — getEventOrnament does not exist in eventLabels.ts
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_ORNAMENTS: Record<string, string> = {
  'Memorial & Funeral':   '🕊️',
  'Wedding':              '💍',
  'Retirement':           '🏅',
  'Milestone Birthday':   '🎂',
  'Anniversary':          '💛',
  'Graduation':           '🎓',
  'Ordination':           '✝️',
  'Chieftaincy Ceremony': '👑',
  'Award Ceremony':       '🏆',
  'Thanksgiving Service': '🙏',
  'Conference':           '🎙️',
  'Other':                '✦',
}

function getOrnament(eventType: string): string {
  return EVENT_ORNAMENTS[eventType] ?? '✦'
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Capsule {
  id: string
  slug: string
  honouree_name: string
  event_type: string
  event_tag: string | null
  page_state: string
  tier: string
  hero_image_url: string | null
  organiser_email: string
  free_tier_expires_at: string | null
  created_at: string
}

interface Contribution {
  id: string
  contributor_name: string
  city: string
  country: string
  relationship: string | null
  tribute_text: string
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

interface Props {
  capsule: Capsule
  initialContributions: Contribution[]
}

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP SHARE BUTTON COMPONENT
// Isolated to avoid JSX parsing issues with external href strings.
// ─────────────────────────────────────────────────────────────────────────────
function WhatsAppButton({ url }: { url: string }) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: 1,
        padding: '6px 0',
        borderRadius: '8px',
        border: '1px solid rgba(37,211,102,0.3)',
        backgroundColor: 'transparent',
        color: 'rgba(37,211,102,0.7)',
        fontSize: '11px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      WhatsApp
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIBUTE CARD COMPONENT
// Ivory card — D31. Gold top rule. Expand toggle for long tributes.
// Zero admin controls — D23.
// ─────────────────────────────────────────────────────────────────────────────
function TributeCard({ contribution }: { contribution: Contribution }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = contribution.tribute_text.length > 280
  const displayText =
    isLong && !expanded
      ? contribution.tribute_text.slice(0, 280) + '…'
      : contribution.tribute_text

  return (
    <div style={{
      backgroundColor: '#F5F3EE',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      borderTop: '3px solid #D4AE2A',
      padding: '20px 24px',
      marginBottom: '16px',
    }}>

      {/* Header: avatar · name · location · date */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>

        {contribution.photo_url ? (
          <img
            src={contribution.photo_url}
            alt={contribution.contributor_name}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: '#2D1B69',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#D4AE2A', fontSize: '14px', fontWeight: 700 }}>
              {getInitials(contribution.contributor_name)}
            </span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '15px', fontWeight: 600, color: '#1a1a2e', margin: 0,
          }}>
            {contribution.contributor_name}
          </p>
          <p style={{ fontSize: '12px', color: '#6b6b80', margin: '2px 0 0' }}>
            {contribution.city}
            {contribution.country ? ' ✦ ' + contribution.country : ''}
            {contribution.relationship ? ' · ' + contribution.relationship : ''}
          </p>
        </div>

        <p style={{ fontSize: '11px', color: '#9090a0', flexShrink: 0, whiteSpace: 'nowrap', margin: 0 }}>
          {formatTributeDate(contribution.created_at)}
        </p>
      </div>

      {/* Tribute text */}
      <p style={{ fontSize: '14px', lineHeight: '1.75', color: '#2a2a3e', margin: 0, whiteSpace: 'pre-wrap' }}>
        {displayText}
      </p>

      {/* Expand toggle */}
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            marginTop: '10px', fontSize: '12px', color: '#B8960C',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600,
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TributeWallClient({ capsule, initialContributions }: Props) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [contributions, setContributions] = useState<Contribution[]>(initialContributions)
  const [copied, setCopied] = useState(false)

  // ── Derived values ─────────────────────────────────────────────────────────
  const subjectName = capsule.honouree_name
  const pageTitle = getTributePageTitle(capsule.event_type, subjectName)
  const ornament = getOrnament(capsule.event_type)

  const capsuleUrl =
    typeof window !== 'undefined'
      ? window.location.origin + '/for/' + capsule.slug
      : 'https://itslegacycapsule.com/for/' + capsule.slug

  const whatsappUrl =
    'https://wa.me/?text=' +
    encodeURIComponent(
      'You\'re invited to leave a tribute for ' + subjectName + '. ' +
      'Add your message here: ' + capsuleUrl
    )

  // Map pins — contributions with coordinates. country required by TributeMap Pin type.
  const mapPins = contributions
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      lat: c.latitude as number,
      lng: c.longitude as number,
      name: c.contributor_name,
      country: c.country,
    }))

  // ── Polling — 60s interval (Realtime deferred to Phase 3 Experience 3) ─────
  const poll = useCallback(async () => {
    const { data } = await supabase
      .from('contributions')
      .select('id, contributor_name, city, country, relationship, tribute_text, photo_url, latitude, longitude, created_at')
      .eq('capsule_id', capsule.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (data) setContributions(data as Contribution[])
  }, [capsule.id])

  useEffect(() => {
    const interval = setInterval(poll, 60_000)
    return () => clearInterval(interval)
  }, [poll])

  // ── Copy link ──────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (typeof window === 'undefined') return
    await navigator.clipboard.writeText(capsuleUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D0820' }}>

      {/* ZONE 1 — HERO */}
      <section style={{
        backgroundColor: '#2D1B69',
        padding: '48px 24px 40px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <LogoCapsule size="sm" />
        </div>

        <div style={{ fontSize: '36px', marginBottom: '16px', lineHeight: 1 }}>
          {ornament}
        </div>

        <Link
          href={'/for/' + capsule.slug + '/profile'}
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700, color: '#FFFFFF',
            textDecoration: 'none', display: 'block',
            marginBottom: '12px', lineHeight: 1.2,
          }}
        >
          {pageTitle}
        </Link>

        {capsule.event_tag && (
          <p style={{
            color: '#D4AE2A', fontSize: '13px',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            margin: 0, fontFamily: 'DM Sans, sans-serif',
          }}>
            {capsule.event_tag}
          </p>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #D4AE2A 30%, #D4AE2A 70%, transparent)',
        }} />
      </section>

      {/* ZONE 2 — STICKY BAR */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50, height: '180px',
        backgroundColor: '#0D0820',
        borderBottom: '1px solid rgba(212,174,42,0.2)',
        display: 'flex', overflow: 'hidden',
      }}>

        {/* Map — left 60% */}
        <div style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden' }}>
          <TributeMap pins={mapPins} />
          <div style={{
            position: 'absolute', bottom: '6px', right: '8px',
            fontSize: '9px', color: 'rgba(212,174,42,0.45)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            pointerEvents: 'none',
          }}>
            Powered by LegacyCapsule
          </div>
        </div>

        {/* Info + share — right 40% */}
        <div style={{
          flex: '0 0 40%', padding: '14px 16px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <p style={{
              fontSize: '10px', color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px',
            }}>
              {capsule.event_type}
            </p>
            <p style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
              margin: '0 0 2px', lineHeight: 1.3,
            }}>
              {subjectName}
            </p>
            {capsule.event_tag && (
              <p style={{ fontSize: '11px', color: '#D4AE2A', letterSpacing: '0.08em', margin: 0 }}>
                {capsule.event_tag}
              </p>
            )}
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '6px 0' }}>
            <span style={{ color: '#D4AE2A', fontWeight: 700, fontSize: '18px' }}>
              {contributions.length}
            </span>
            {' tribute' + (contributions.length !== 1 ? 's' : '')}
          </p>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, padding: '6px 0', borderRadius: '8px',
                border: '1px solid rgba(212,174,42,0.3)',
                backgroundColor: 'transparent',
                color: copied ? '#D4AE2A' : 'rgba(255,255,255,0.45)',
                fontSize: '11px', cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
            <WhatsAppButton url={whatsappUrl} />
          </div>
        </div>
      </div>

      {/* ZONE 3 — TRIBUTE SECTION */}
      <section style={{ position: 'relative', padding: '48px 0 100px' }}>

        {capsule.hero_image_url && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(' + capsule.hero_image_url + ')',
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: 0.07, pointerEvents: 'none', zIndex: 0,
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{
              color: 'rgba(212,174,42,0.55)', fontSize: '11px',
              letterSpacing: '0.28em', textTransform: 'uppercase', margin: '0 0 8px',
            }}>
              ──── ✦ TRIBUTE WALL ✦ ────
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>
              {contributions.length === 0
                ? 'Be the first to leave a tribute'
                : contributions.length + ' tribute' + (contributions.length !== 1 ? 's' : '')}
            </p>
          </div>

          {contributions.map((c) => (
            <TributeCard key={c.id} contribution={c} />
          ))}

          {contributions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '14px' }}>
                No tributes yet — be the first.
              </p>
            </div>
          )}

          <Link
            href={'/for/' + capsule.slug + '/profile'}
            style={{
              display: 'block', marginTop: '32px', padding: '20px 24px',
              borderRadius: '12px', border: '1px solid rgba(212,174,42,0.18)',
              backgroundColor: 'rgba(212,174,42,0.04)',
              textAlign: 'center', textDecoration: 'none',
            }}
          >
            <p style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '16px', color: '#D4AE2A', margin: '0 0 4px',
            }}>
              About {subjectName}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
              View profile &#8594;
            </p>
          </Link>
        </div>
      </section>

      {/* ZONE 4 — STICKY ADD YOUR TRIBUTE CTA */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 50,
        backgroundColor: '#D4AE2A', textAlign: 'center', padding: '14px 24px',
      }}>
        <Link
          href={'/for/' + capsule.slug + '/submit'}
          style={{
            color: '#0D0820', fontWeight: 700, fontSize: '14px',
            textDecoration: 'none', letterSpacing: '0.05em',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ✦ Add Your Tribute
        </Link>
      </div>

      {/* ZONE 5 — FOOTER */}
      <footer style={{
        backgroundColor: '#0D0820',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '11px', margin: '0 0 8px' }}>
          VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
        </p>
        <Link
          href="/book"
          style={{ color: 'rgba(212,174,42,0.45)', fontSize: '12px', textDecoration: 'none' }}
        >
          Planning your own event? Start here &#8594;
        </Link>
      </footer>

    </div>
  )
}