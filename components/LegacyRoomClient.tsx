'use client'

/* =========================================================
   Legacy Highlights CLIENT — LC-LEGACYROOM-001
   FILE: components/LegacyRoomClient.tsx

   Three-Room Model — Room 3: Community Participation & Preservation
   Theme-aware · 60s activity polling · Gallery lightbox
   Mobile-first · Premium ceremonial aesthetic

   Sections (per E3):
     1. Collection Overview — 4 stats from participation summary
     2. Legacy Builders — top 5 with tier badges (hidden below threshold)
     3. Recent Activity — last 10 approved events, 60s poll
     4. Gallery — Featured Memories (organiser curated)
     5. Publication Status — collection state + future download CTA

   OWNER: AI7 — Phase 2
   UPDATED: AI18 · 6 Aug 2026
     — VoiceMetrics + ActivityItem exported types
     — 8-stat collection overview (2 rows)
     — Inside the Voices section (metrics + distribution + time)
     — Where the World Showed Up (ranked countries + continents)
     — Who Showed Up (relationship intelligence + attribution)
     — Multi-source activity feed (voices/memories/moments) with type pills
     — Live publication status (3 states)
     — Participation language engine wired throughout (no hardcoded labels)
     — 60s polling updated to all 3 sources
========================================================= */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getThemeConfig } from '@/lib/themeConfig'
import type { ThemeKey, ThemeConfig } from '@/lib/themeConfig'
import { getParticipationLanguage } from '@/lib/utils/getParticipationLanguage'

// ── Exported types — used by server page for prop typing ──
export interface VoiceMetrics {
  total: number
  totalChars: number
  avgLength: number
  medianLength: number
  shortestLength: number
  longestLength: number
  over500: number
  over500Pct: number
  over1000: number
  over1000Pct: number
  distribution: Array<{ label: string; count: number; pct: number }>
  mostActiveDay: { date: string; count: number } | null
  spanDays: number
  avgPerDay: number
  topRelationships: Array<{ label: string; count: number }>
  distinctRelationships: number
  topCountries: Array<{ name: string; count: number }>
  continents: Array<{ name: string; count: number }>
  internationalPct: number
  singleCountries: number
  attributionCount: number
  attributionPct: number
  consentCount: number
  consentPct: number
  emailCount: number
  emailPct: number
  photoCount: number
  photoPct: number
  anonymousCount: number
}

export interface ActivityItem {
  id: string
  contributor_name: string
  city: string
  country: string
  created_at: string
  thumbnail_url: string | null
  activity_type: 'voice' | 'memory' | 'moment'
}

/* ── TYPES ── */
interface Capsule {
  id: string; slug: string; honouree_name: string; honouree_title: string | null
  event_type: string; event_tag: string | null; hero_image_url: string | null
  components: string[]
  hero_image_position: string | null; hero_image_zoom: number | null
  hero_image_fit: string | null; hero_panel_size: string | null
  hero_full_bleed: boolean | null
}

interface Summary {
  contributor_count: number; photo_count: number
  country_count: number; share_count: number
  legacy_builder_count: number; attributed_contrib_count: number
  last_activity_at: string | null
}

interface Builder {
  id: string; contributor_name: string; display_name: string
  ref_count: number; recognition_tier: string; rank_position: number | null
}

// ActivityItem is now exported above — no local interface needed

interface GalleryPhoto {
  id: string; image_url: string; description: string | null
  sort_order: number | null; section_index: number | null
}

interface Props {
  capsule: Capsule
  summary: Summary
  builders: Builder[]
  showBuilders: boolean
  recentActivity: ActivityItem[]
  galleryPhotos: GalleryPhoto[]
  themeKey: ThemeKey
  voiceMetrics: VoiceMetrics
  storiesCount: number
  momentsCount: number
  topBuilder: {
    contributor_name: string
    display_name: string
    ref_count: number
    recognition_tier: string
  } | null
  publicationStatus: {
    generationStatus: string
    version: number
    generatedAt: string | null
    sentCount: number
  } | null
}

/* ── TIER CONFIG ── */
const TIER_STYLES: Record<string, { label: string; badge: string; glow: string }> = {
  lead_legacy_builder: { label: 'Lead Legacy Builder', badge: '◆', glow: 'rgba(226,195,107,0.4)' },
  legacy_builder:      { label: 'Legacy Builder',      badge: '◇', glow: 'rgba(226,195,107,0.25)' },
  community_builder:   { label: 'Community Builder',   badge: '✦', glow: 'rgba(226,195,107,0.15)' },
}

/* =========================================================
   STAT CARD — single metric with label
========================================================= */
function StatCard({ value, label, accent, t }: {
  value: number; label: string; accent?: boolean; t: ThemeConfig
}) {
  return (
    <div style={{
      flex: 1, minWidth: '70px', padding: '16px 10px',
      borderRadius: '14px', textAlign: 'center',
      background: accent ? 'rgba(226,195,107,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent ? 'rgba(226,195,107,0.18)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        fontSize: '28px', fontWeight: 800, lineHeight: 1,
        fontFamily: "'Playfair Display', Georgia, serif",
        color: accent ? t.accentPrimary : t.textHeading,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '9px', color: t.textFaint, marginTop: '6px',
        textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600,
      }}>
        {label}
      </div>
    </div>
  )
}

/* =========================================================
   BUILDER CARD — single legacy builder row
========================================================= */
function BuilderCard({ builder, t }: { builder: Builder; t: ThemeConfig }) {
  const tier = TIER_STYLES[builder.recognition_tier] ?? TIER_STYLES.community_builder
  const isLead = builder.recognition_tier === 'lead_legacy_builder'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px', borderRadius: '14px',
      background: isLead ? 'rgba(226,195,107,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isLead ? 'rgba(226,195,107,0.22)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'all 0.3s ease',
    }}>
      {/* Rank badge */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isLead
          ? 'linear-gradient(135deg, rgba(226,195,107,0.2), rgba(226,195,107,0.08))'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isLead ? 'rgba(226,195,107,0.35)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: `0 0 12px ${tier.glow}`,
        fontSize: '14px', color: t.accentPrimary,
      }}>
        {tier.badge}
      </div>

      {/* Name + tier */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '13px', fontWeight: 700,
          color: isLead ? t.accentPrimary : t.textHeading,
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {builder.display_name}
        </p>
        <p style={{
          fontSize: '9px', color: t.textFaint, margin: '2px 0 0',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {tier.label}
        </p>
      </div>

      {/* Ref count */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{
          fontSize: '16px', fontWeight: 800,
          fontFamily: "'Playfair Display', Georgia, serif",
          color: t.accentPrimary,
        }}>
          {builder.ref_count}
        </span>
        <p style={{
          fontSize: '8px', color: t.textFaint, margin: '2px 0 0',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          brought in
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   ACTIVITY ROW — single recent activity item (voice/memory/moment)
========================================================= */
const ACTIVITY_PILL: Record<string, { label: string; color: string; bg: string }> = {
  voice:  { label: 'VOICE',  color: 'rgba(226,195,107,0.9)', bg: 'rgba(226,195,107,0.1)' },
  memory: { label: 'MEMORY', color: 'rgba(147,197,253,0.9)', bg: 'rgba(147,197,253,0.1)' },
  moment: { label: 'MOMENT', color: 'rgba(134,239,172,0.9)', bg: 'rgba(134,239,172,0.1)' },
}

function ActivityRow({ item, t, lang }: {
  item: ActivityItem; t: ThemeConfig; lang: { singular: string; plural: string }
}) {
  const timeAgo = getTimeAgo(item.created_at)
  const pill = ACTIVITY_PILL[item.activity_type]
  const pillLabel = item.activity_type === 'voice' ? lang.singular.toUpperCase() : pill.label

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 0',
      borderBottom: `1px solid rgba(255,255,255,0.04)`,
    }}>
      {/* Avatar */}
      {item.thumbnail_url ? (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden',
          flexShrink: 0, border: `1px solid rgba(226,195,107,0.15)`,
        }}>
          <img src={item.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(226,195,107,0.08)', border: `1px solid rgba(226,195,107,0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: t.accentMuted,
        }}>
          {item.contributor_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Name + location */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <p style={{
            fontSize: '12px', fontWeight: 600, color: t.textHeading, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.contributor_name}
          </p>
          <span style={{
            fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em',
            padding: '1px 6px', borderRadius: '4px', flexShrink: 0,
            color: pill.color, background: pill.bg,
          }}>
            {pillLabel}
          </span>
        </div>
        <p style={{ fontSize: '10px', color: t.textFaint, margin: 0 }}>
          {[item.city, item.country].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Time ago */}
      <span style={{ fontSize: '10px', color: t.textFaint, flexShrink: 0 }}>
        {timeAgo}
      </span>
    </div>
  )
}

/* ── TIME AGO UTILITY ── */
function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(dateStr))
}

/* =========================================================
   GALLERY LIGHTBOX
========================================================= */
function GalleryLightbox({ photo, onClose, t }: {
  photo: GalleryPhoto; onClose: () => void; t: ThemeConfig
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(8,2,20,0.95)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          color: t.textFaint, background: 'none', border: 'none',
          fontSize: '24px', cursor: 'pointer', lineHeight: 1, zIndex: 2,
        }}
      >
        ×
      </button>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '80vh' }}>
        <img
          src={photo.image_url}
          alt={photo.description ?? 'Gallery photo'}
          style={{
            maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px',
            objectFit: 'contain', boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
          }}
        />
        {photo.description && (
          <p style={{
            textAlign: 'center', fontSize: '12px', color: t.textMuted,
            marginTop: '12px', lineHeight: 1.6, maxWidth: '400px', margin: '12px auto 0',
          }}>
            {photo.description}
          </p>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   SECTION WRAPPER — consistent section spacing + dividers
========================================================= */
function Section({ title, subtitle, children, t }: {
  title: string; subtitle?: string; children: React.ReactNode; t: ThemeConfig
}) {
  return (
    <div style={{ padding: '0 16px', marginBottom: '24px' }}>
      {/* Gold divider */}
      <div style={{
        height: '1px', marginBottom: '16px',
        background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)`,
      }} />
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.22em', color: t.accentMuted, margin: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '11px', color: t.textFaint, margin: '4px 0 0', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

/* =========================================================
   METRIC ROW — label + value pair
========================================================= */
function MetricRow({ label, value, accent, t }: {
  label: string; value: string; accent?: boolean; t: ThemeConfig
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '9px 0', borderBottom: `1px solid rgba(255,255,255,0.04)`,
    }}>
      <span style={{ fontSize: '12px', color: t.textFaint, lineHeight: 1.4 }}>{label}</span>
      <span style={{
        fontSize: '13px', fontWeight: 700,
        color: accent ? t.accentPrimary : t.textHeading,
        textAlign: 'right', maxWidth: '55%',
      }}>{value}</span>
    </div>
  )
}

/* =========================================================
   DISTRIBUTION BAR — pure CSS horizontal bar chart
========================================================= */
function DistributionBar({ label, count, pct, maxCount, t }: {
  label: string; count: number; pct: number; maxCount: number; t: ThemeConfig
}) {
  if (count === 0) return null
  const barWidth = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: t.textFaint }}>{label}</span>
        <span style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600 }}>
          {count} <span style={{ color: t.textFaint, fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{
        height: '6px', borderRadius: '3px',
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          width: `${barWidth}%`,
          background: `linear-gradient(to right, ${t.accentPrimary}, rgba(226,195,107,0.5))`,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

/* =========================================================
   RANKED BAR — for top countries and relationships
========================================================= */
function RankedBar({ label, count, total, rank, t }: {
  label: string; count: number; total: number; rank: number; t: ThemeConfig
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{
          fontSize: '9px', fontWeight: 800, color: t.accentMuted,
          width: '16px', textAlign: 'center', flexShrink: 0,
        }}>{rank}</span>
        <span style={{ fontSize: '12px', color: t.textHeading, flex: 1, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: t.accentPrimary, fontWeight: 700 }}>{count}</span>
        <span style={{ fontSize: '10px', color: t.textFaint, width: '36px', textAlign: 'right' }}>{pct}%</span>
      </div>
      <div style={{ marginLeft: '24px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%', borderRadius: '2px', width: `${pct}%`,
          background: `linear-gradient(to right, ${t.accentPrimary}, rgba(226,195,107,0.4))`,
        }} />
      </div>
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function LegacyRoomClient({
  capsule, summary, builders, showBuilders, recentActivity, galleryPhotos, themeKey,
  voiceMetrics, storiesCount, momentsCount, topBuilder, publicationStatus,
}: Props) {
  const t = getThemeConfig(themeKey)
  const lang = getParticipationLanguage(capsule.event_type)
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /* ── STATE ── */
  const [activity, setActivity] = useState<ActivityItem[]>(recentActivity)
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null)

  /* ── DERIVED ── */
  const honourName = capsule.honouree_name
  const resolvedHero = capsule.hero_image_url ?? null
  const heroPosition = capsule.hero_image_position ?? '50% 50%'
  const heroZoom = capsule.hero_image_zoom ?? 150
  const heroFit = capsule.hero_image_fit ?? 'height'

  /* ── 60s ACTIVITY POLLING — all 3 sources ── */
  const pollActivity = useCallback(async () => {
    try {
      const [voicesRes, storiesRes, momentsRes] = await Promise.all([
        supabaseClient
          .from('contributions')
          .select('id, contributor_name, city, country, created_at, thumbnail_url')
          .eq('capsule_id', capsule.id)
          .eq('status', 'approved')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(3),
        supabaseClient
          .from('community_stories')
          .select('id, contributor_name, city, country, created_at')
          .eq('capsule_id', capsule.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3),
        supabaseClient
          .from('gallery_items')
          .select('id, contributor_name, ip_country, created_at')
          .eq('capsule_id', capsule.id)
          .eq('source', 'dday')
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ])
      const merged: ActivityItem[] = [
        ...(voicesRes.data ?? []).map((v: any) => ({
          id: v.id, contributor_name: v.contributor_name,
          city: v.city ?? '', country: v.country ?? '',
          created_at: v.created_at, thumbnail_url: v.thumbnail_url ?? null,
          activity_type: 'voice' as const,
        })),
        ...(storiesRes.data ?? []).map((s: any) => ({
          id: s.id, contributor_name: s.contributor_name,
          city: s.city ?? '', country: s.country ?? '',
          created_at: s.created_at, thumbnail_url: null,
          activity_type: 'memory' as const,
        })),
        ...(momentsRes.data ?? []).map((m: any) => ({
          id: m.id, contributor_name: m.contributor_name ?? 'Guest',
          city: '', country: m.ip_country ?? '',
          created_at: m.created_at, thumbnail_url: null,
          activity_type: 'moment' as const,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
      setActivity(merged)
    } catch {}
  }, [capsule.id])

  useEffect(() => {
    const iv = setInterval(pollActivity, 60_000)
    return () => clearInterval(iv)
  }, [pollActivity])

  /* ── BODY OVERFLOW LOCK ── */
  useEffect(() => {
    document.body.style.overflow = lightboxPhoto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxPhoto])

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <>
      {/* Lightbox */}
      {lightboxPhoto && <GalleryLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} t={t} />}

      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', background: t.pageBg }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>

          {/* ── TOP BAR ── */}
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 16px 8px', gap: '12px',
          }}>
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{
                fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em',
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>LEGACY</span>
              <span style={{
                fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em',
                color: t.textFaint, marginLeft: '0.18em',
              }}>CAPSULE</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href={`/for/${capsule.slug}`} style={{
                fontSize: '11px', fontWeight: 600, color: t.accentMuted,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                The Voices →
              </Link>
              <Link href={`/for/${capsule.slug}/profile`} style={{
                fontSize: '11px', fontWeight: 600, color: t.accentMuted,
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Profile →
              </Link>
            </div>
          </div>

          {/* ── HERO HEADER ── */}
          <div style={{
            flexShrink: 0, position: 'relative', overflow: 'hidden',
            minHeight: '140px', margin: '0 12px', borderRadius: '20px',
          }}>
            {resolvedHero ? (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${resolvedHero})`,
                backgroundSize:
                  heroFit === 'width' ? '100% auto'
                  : heroFit === 'height' ? 'auto 100%'
                  : heroFit === 'custom' ? `${heroZoom}%`
                  : 'cover',
                backgroundPosition: heroPosition,
                backgroundRepeat: 'no-repeat', backgroundColor: '#000',
              }} />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(145deg, #0a0518 0%, #1a0d3a 45%, #2a1060 100%)',
              }}>
                <div style={{
                  position: 'absolute', width: '50%', height: '50%', borderRadius: '999px',
                  background: 'rgba(226,195,107,0.08)', filter: 'blur(80px)',
                  top: '-10%', right: '-5%',
                }} />
              </div>
            )}

            {/* Gradient overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${t.accentMuted}, transparent)` }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(to right, transparent, ${t.accentFaint}, transparent)` }} />

            {/* Content */}
            <div style={{
              position: 'relative', zIndex: 1, padding: '28px 24px 24px', textAlign: 'center',
            }}>
              <p style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.3em',
                textTransform: 'uppercase', color: t.accentMuted, marginBottom: '8px',
              }}>
                Legacy Highlights
              </p>
              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(20px, 5.5vw, 28px)', fontWeight: 800,
                color: t.textHeading, lineHeight: 1.2,
                textShadow: '0 2px 16px rgba(0,0,0,0.8)', margin: '0 0 6px',
              }}>
                {honourName}
              </h1>
              {capsule.event_tag && (
                <p style={{
                  fontSize: '11px', color: t.accentMuted, letterSpacing: '0.18em',
                  textTransform: 'uppercase', margin: 0,
                }}>
                  {capsule.event_tag}
                </p>
              )}
              <p style={{
                fontSize: '10px', color: t.textFaint, marginTop: '10px',
                letterSpacing: '0.08em', lineHeight: 1.5,
              }}>
                A living record of how this community showed up
              </p>
            </div>
          </div>

          {/* ── SHARE STRIP ── */}
          {(() => {
            const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${capsule.slug}`
            return (
              <div style={{ margin: '12px 12px 0', padding: '14px 16px', borderRadius: '14px', background: 'rgba(226,195,107,0.05)', border: `1px solid rgba(226,195,107,0.15)`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: t.accentMuted, letterSpacing: '0.08em' }}>
                  Help grow this record
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: t.textFaint, lineHeight: 1.5 }}>
                  Share this page — every voice that arrives makes this record more complete.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareUrl)
                    }}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: `1px solid rgba(226,195,107,0.25)`, background: 'rgba(226,195,107,0.08)', color: t.accentPrimary, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    🔗 Copy Link
                  </button>
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(`${capsule.honouree_name}'s legacy is being preserved — voices are gathering from around the world: ${shareUrl}`)
                      window.open(`https://wa.me/?text=${text}`, '_blank')
                    }}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.03)', color: t.textFaint, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── SECTION 1: COLLECTION OVERVIEW ── */}
          <Section title="Collection Overview" t={t}>
            {/* Row 1 — Primary */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <StatCard value={summary.contributor_count} label={`${lang.plural} Gathered`} accent t={t} />
              <StatCard value={summary.country_count} label="Countries" t={t} />
              <StatCard value={voiceMetrics.distinctRelationships} label="Walks of Life" t={t} />
              <StatCard value={voiceMetrics.spanDays} label="Days of Gathering" t={t} />
            </div>
            {/* Row 2 — Secondary */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <StatCard value={summary.photo_count} label="Photos" t={t} />
              <StatCard value={storiesCount} label="Stories" t={t} />
              <StatCard value={momentsCount} label="Moments" t={t} />
              <StatCard value={summary.legacy_builder_count} label="Builders" t={t} />
            </div>
          </Section>

          {/* ── SECTION B: INSIDE THE VOICES ── */}
          {voiceMetrics.total > 0 && (
            <Section
              title={`Inside the ${lang.plural}`}
              subtitle={`A closer look at what this collection contains`}
              t={t}
            >
              {/* Key numbers */}
              <div style={{
                borderRadius: '14px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(255,255,255,0.06)`,
                padding: '4px 16px', marginBottom: '16px',
              }}>
                <MetricRow
                  label={`Total ${lang.plural.toLowerCase()}`}
                  value={voiceMetrics.total.toLocaleString()}
                  accent t={t}
                />
                <MetricRow
                  label="Total characters written"
                  value={voiceMetrics.totalChars.toLocaleString()}
                  t={t}
                />
                <MetricRow
                  label={`Average ${lang.singular.toLowerCase()} length`}
                  value={`${voiceMetrics.avgLength.toLocaleString()} characters`}
                  t={t}
                />
                <MetricRow
                  label={`Median ${lang.singular.toLowerCase()} length`}
                  value={`≈${voiceMetrics.medianLength.toLocaleString()} characters`}
                  t={t}
                />
                <MetricRow
                  label="Shortest"
                  value={`${voiceMetrics.shortestLength.toLocaleString()} characters`}
                  t={t}
                />
                <MetricRow
                  label="Longest"
                  value={`${voiceMetrics.longestLength.toLocaleString()} characters`}
                  t={t}
                />
                {voiceMetrics.over500 > 0 && (
                  <MetricRow
                    label={`${lang.plural} over 500 characters`}
                    value={`${voiceMetrics.over500} (${voiceMetrics.over500Pct}%)`}
                    t={t}
                  />
                )}
                {voiceMetrics.over1000 > 0 && (
                  <MetricRow
                    label={`${lang.plural} over 1,000 characters`}
                    value={`${voiceMetrics.over1000} (${voiceMetrics.over1000Pct}%)`}
                    t={t}
                  />
                )}
                {voiceMetrics.emailCount > 0 && (
                  <MetricRow
                    label="Contributors with email on file"
                    value={`${voiceMetrics.emailCount} (${voiceMetrics.emailPct}%)`}
                    t={t}
                  />
                )}
                {voiceMetrics.consentCount > 0 && (
                  <MetricRow
                    label="Legacy Builder opt-ins"
                    value={`${voiceMetrics.consentCount} (${voiceMetrics.consentPct}%)`}
                    t={t}
                  />
                )}
              </div>

              {/* Distribution chart */}
              {voiceMetrics.distribution.some(d => d.count > 0) && (
                <div style={{
                  borderRadius: '14px', background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(255,255,255,0.06)`,
                  padding: '14px 16px', marginBottom: '16px',
                }}>
                  <p style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.16em', color: t.accentMuted, margin: '0 0 12px',
                  }}>
                    Length Distribution
                  </p>
                  {(() => {
                    const maxCount = Math.max(...voiceMetrics.distribution.map(d => d.count))
                    return voiceMetrics.distribution.map(d => (
                      <DistributionBar
                        key={d.label}
                        label={d.label}
                        count={d.count}
                        pct={d.pct}
                        maxCount={maxCount}
                        t={t}
                      />
                    ))
                  })()}
                </div>
              )}

              {/* Time intelligence */}
              <div style={{
                borderRadius: '14px', background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(255,255,255,0.06)`,
                padding: '4px 16px',
              }}>
                {voiceMetrics.mostActiveDay && (
                  <MetricRow
                    label="Most active day"
                    value={`${voiceMetrics.mostActiveDay.date} · ${voiceMetrics.mostActiveDay.count} ${voiceMetrics.mostActiveDay.count === 1 ? lang.singular.toLowerCase() : lang.plural.toLowerCase()}`}
                    accent t={t}
                  />
                )}
                <MetricRow
                  label="Gathering span"
                  value={`${voiceMetrics.spanDays} day${voiceMetrics.spanDays !== 1 ? 's' : ''}`}
                  t={t}
                />
                <MetricRow
                  label={`Average ${lang.plural.toLowerCase()} per day`}
                  value={`${voiceMetrics.avgPerDay}`}
                  t={t}
                />
              </div>
            </Section>
          )}

          {/* ── SECTION C: WHERE THE WORLD SHOWED UP ── */}
          {voiceMetrics.topCountries.length > 0 && (
            <Section
              title="Where the World Showed Up"
              subtitle={`${voiceMetrics.topCountries.length} countr${voiceMetrics.topCountries.length !== 1 ? 'ies' : 'y'} represented`}
              t={t}
            >
              <div style={{ marginBottom: '16px' }}>
                {voiceMetrics.topCountries.map((c, i) => (
                  <RankedBar
                    key={c.name}
                    label={c.name}
                    count={c.count}
                    total={voiceMetrics.total}
                    rank={i + 1}
                    t={t}
                  />
                ))}
              </div>

              {/* Continent breakdown */}
              {voiceMetrics.continents.length > 1 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px',
                }}>
                  {voiceMetrics.continents.map(c => (
                    <div key={c.name} style={{
                      padding: '5px 12px', borderRadius: '20px',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid rgba(255,255,255,0.08)`,
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{ fontSize: '11px', color: t.textFaint }}>{c.name}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: t.accentMuted }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* International insight */}
              {voiceMetrics.internationalPct > 0 && voiceMetrics.topCountries.length > 1 && (
                <p style={{
                  fontSize: '12px', color: t.textFaint, lineHeight: 1.65,
                  fontStyle: 'italic', margin: '0 0 8px',
                }}>
                  {voiceMetrics.internationalPct}% of {lang.plural.toLowerCase()} joined from outside {voiceMetrics.topCountries[0]?.name}.
                  {voiceMetrics.singleCountries > 0 && ` ${voiceMetrics.singleCountries} countr${voiceMetrics.singleCountries !== 1 ? 'ies' : 'y'} sent exactly one ${lang.singular.toLowerCase()}.`}
                </p>
              )}
            </Section>
          )}

          {/* ── SECTION D: WHO SHOWED UP ── */}
          {voiceMetrics.topRelationships.length > 0 && (
            <Section
              title="Who Showed Up"
              subtitle={`${voiceMetrics.distinctRelationships} distinct connection${voiceMetrics.distinctRelationships !== 1 ? 's' : ''} to ${capsule.honouree_name}`}
              t={t}
            >
              <div style={{ marginBottom: '12px' }}>
                {voiceMetrics.topRelationships.map((r, i) => (
                  <RankedBar
                    key={r.label}
                    label={r.label}
                    count={r.count}
                    total={voiceMetrics.total}
                    rank={i + 1}
                    t={t}
                  />
                ))}
              </div>
              {voiceMetrics.attributionCount > 0 && (
                <div style={{
                  padding: '12px 14px', borderRadius: '12px',
                  background: 'rgba(226,195,107,0.04)',
                  border: `1px solid rgba(226,195,107,0.12)`,
                }}>
                  <p style={{ fontSize: '12px', color: t.textFaint, lineHeight: 1.65, margin: 0 }}>
                    <span style={{ color: t.accentPrimary, fontWeight: 700 }}>
                      {voiceMetrics.attributionCount} {voiceMetrics.attributionCount === 1 ? lang.singular.toLowerCase() : lang.plural.toLowerCase()}
                    </span>
                    {' '}({voiceMetrics.attributionPct}%) arrived through a shared link from within this community.
                  </p>
                </div>
              )}
            </Section>
          )}

          {/* ── SECTION 2: LEGACY BUILDERS ── */}
          {!showBuilders && (
            <div style={{ padding: '0 16px 8px' }}>
              <p style={{ fontSize: '11px', color: t.textFaint, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6 }}>
                When enough voices gather, those who helped bring others into this story will be recognised here.
              </p>
            </div>
          )}
          {showBuilders && (
            <Section
              title="Legacy Builders"
              subtitle="Those who helped bring more voices into this collection"
              t={t}
            >
              {/* Top builder highlight */}
              {topBuilder && topBuilder.ref_count > 1 && (
                <div style={{
                  padding: '14px 16px', borderRadius: '12px', marginBottom: '12px',
                  background: 'linear-gradient(135deg, rgba(226,195,107,0.08), rgba(226,195,107,0.03))',
                  border: `1px solid rgba(226,195,107,0.2)`,
                }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: t.accentMuted, margin: '0 0 4px' }}>
                    Most Active Builder
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: t.accentPrimary, margin: '0 0 2px', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {topBuilder.display_name || topBuilder.contributor_name}
                  </p>
                  <p style={{ fontSize: '12px', color: t.textFaint, margin: 0 }}>
                    Brought {topBuilder.ref_count} {topBuilder.ref_count === 1 ? lang.singular.toLowerCase() : lang.plural.toLowerCase()} into this collection
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {builders.map(builder => (
                  <BuilderCard key={builder.id} builder={builder} t={t} />
                ))}
              </div>
            </Section>
          )}

          {/* ── SECTION 3: RECENT ACTIVITY ── */}
          {activity.length > 0 && (
            <Section title="Recently Joined This Record" t={t}>
              <div style={{
                borderRadius: '14px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(255,255,255,0.05)`,
                padding: '4px 14px',
              }}>
                {activity.map((item, idx) => (
                  <ActivityRow key={item.id} item={item} t={t} lang={lang} />
                ))}
              </div>
            </Section>
          )}

          {/* ── SECTION 4: GALLERY — FEATURED MEMORIES ── */}
          {galleryPhotos.length > 0 && (
            <Section title="Featured Memories" subtitle="Curated by the organiser" t={t}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px',
              }}>
                {galleryPhotos.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxPhoto(photo)}
                    style={{
                      aspectRatio: '1', borderRadius: '10px', overflow: 'hidden',
                      cursor: 'pointer', position: 'relative',
                      border: `1px solid rgba(255,255,255,0.06)`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.description ?? ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Hover overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.15)',
                      opacity: 0, transition: 'opacity 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── SECTION 5: PUBLICATION STATUS ── */}
          <Section title="Publication Status" t={t}>
            {publicationStatus && publicationStatus.generationStatus === 'complete' && publicationStatus.sentCount > 0 ? (
              /* Distributed */
              <div style={{
                padding: '18px 18px', borderRadius: '14px',
                background: 'rgba(74,222,128,0.04)',
                border: `1px solid rgba(74,222,128,0.15)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>✦</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(134,239,172,0.9)', margin: 0 }}>
                      Publication distributed
                    </p>
                    <p style={{ fontSize: '11px', color: t.textFaint, margin: '2px 0 0' }}>
                      Version {publicationStatus.version} · Sent to {publicationStatus.sentCount} recipient{publicationStatus.sentCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.65, margin: 0 }}>
                  Every {lang.singular.toLowerCase()} in this collection has been preserved in a permanent digital keepsake.
                </p>
              </div>
            ) : publicationStatus && publicationStatus.generationStatus === 'complete' ? (
              /* Generated, not yet sent */
              <div style={{
                padding: '18px 18px', borderRadius: '14px',
                background: 'rgba(226,195,107,0.04)',
                border: `1px solid rgba(226,195,107,0.15)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>◈</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: t.accentPrimary, margin: 0 }}>
                      Publication ready
                    </p>
                    <p style={{ fontSize: '11px', color: t.textFaint, margin: '2px 0 0' }}>
                      Version {publicationStatus.version} · Awaiting distribution
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: t.textFaint, lineHeight: 1.65, margin: 0 }}>
                  The keepsake publication has been generated and will be distributed to contributors soon.
                </p>
              </div>
            ) : (
              /* Pending / not yet generated */
              <div style={{
                padding: '18px 18px', borderRadius: '14px', textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(255,255,255,0.06)`,
              }}>
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>✦</div>
                <p style={{
                  fontSize: '13px', fontWeight: 600, color: t.textHeading, margin: '0 0 6px',
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>
                  A permanent record is being assembled
                </p>
                <p style={{
                  fontSize: '11px', color: t.textFaint, lineHeight: 1.65, margin: 0,
                  maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto',
                }}>
                  {voiceMetrics.total > 0
                    ? `${voiceMetrics.total} ${voiceMetrics.total === 1 ? lang.singular.toLowerCase() : lang.plural.toLowerCase()} gathered so far — all will be preserved in a digital keepsake for generations to come.`
                    : `Every ${lang.singular.toLowerCase()} gathered here will be preserved in a digital publication — a lasting record for all who contributed.`
                  }
                </p>
              </div>
            )}
          </Section>

          {/* ── PAGE NAVIGATION ── */}
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'center',
            padding: '8px 16px 20px', flexWrap: 'wrap',
          }}>
            <Link href={`/for/${capsule.slug}`} style={{
              padding: '10px 22px', borderRadius: '24px', textDecoration: 'none',
              border: `1px solid ${t.accentFaint}`, color: t.accentMuted,
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em',
              background: 'rgba(255,255,255,0.03)',
            }}>
              The Voices →
            </Link>
            <Link href={`/for/${capsule.slug}/profile`} style={{
              padding: '10px 22px', borderRadius: '24px', textDecoration: 'none',
              border: `1px solid ${t.accentFaint}`, color: t.accentMuted,
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em',
              background: 'rgba(255,255,255,0.03)',
            }}>
              View Profile →
            </Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
              padding: '10px 22px', borderRadius: '24px',
              border: `1px solid ${t.accentFaint}`, background: 'rgba(255,255,255,0.03)',
              color: t.accentMuted, fontSize: '13px', fontWeight: 600,
              letterSpacing: '0.04em', cursor: 'pointer',
            }}>
              ↑ Back to Top
            </button>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ padding: '20px 16px 24px', textAlign: 'center' }}>
            <span style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em',
              background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentMuted})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>LEGACY</span>
            <span style={{
              fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em',
              color: t.textFaint, marginLeft: '0.18em',
            }}>CAPSULE</span>
            <p style={{
              fontSize: '9px', color: 'rgba(255,255,255,0.12)', marginTop: '6px',
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>
              Events end. Legacies don't.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
