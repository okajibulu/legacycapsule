/**
 * ============================================================
 * LEGACYCAPSULE — app/for/[slug]/profile/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Public subject profile page — rethemed to purple/gold.
 * Route: /for/[slug]/profile
 *
 * Architecture preserved intact:
 * - Server component — no 'use client'
 * - Account numbers masked server-side before render
 * - Parallel data fetches
 * - notFound() guards
 *
 * Visual: Dark purple base, lighter warm card surfaces
 * for reading sections, gold accent language throughout.
 * ============================================================
 */

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  getWaysToHonourLabel,
  getGiftAcknowledgeLabel,
  getEventTypeLabel,
  getEventTypeEmoji,
  getProfileSectionLabel,
} from '@/lib/eventLabels'
import WaysToHonourCard from '@/components/honouree/WaysToHonourCard'

/* =========================================================
   SECTION 1 — Admin client + utilities
========================================================= */
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function maskAccountNumber(full: string | null): string {
  if (!full || full.length < 4) return '••••'
  return `••••${full.slice(-4)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return dateStr }
}

// Design tokens — inline for server component
const purpleDark = '#0f0a1e'
const purpleMid = '#1a0845'
const purpleHero = 'linear-gradient(160deg, #1a0845 0%, #2a0f6a 60%, #160740 100%)'
const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.60)'
const goldFaint = 'rgba(226,195,107,0.18)'
// Light warm surface for reading sections — easier on the eye for long text
const cardSurface = 'rgba(255,253,245,0.06)'
const cardSurfaceLight = 'rgba(255,253,248,0.92)' // warm near-white for text content

/* =========================================================
   SECTION 2 — Page component
========================================================= */
interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params

  const { data: capsule, error } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, event_date, page_state, tier, hero_image_url')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !capsule) return notFound()
  if (capsule.page_state === 'draft') return notFound()

  const [profileRes, featuredRes, galleryRes, supportRes] = await Promise.all([
    adminClient
      .from('capsule_profile_sections')
      .select('id, section_type, custom_title, content, sort_order')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .not('content', 'is', null)
      .order('sort_order'),

    adminClient
      .from('capsule_featured_photos')
      .select('id, image_url, caption, sort_order')
      .eq('capsule_id', capsule.id)
      .order('sort_order'),

    adminClient
      .from('capsule_gallery')
      .select('id, image_url, caption, sort_order')
      .eq('capsule_id', capsule.id)
      .order('sort_order'),

    adminClient
      .from('capsule_support_accounts')
      .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, sort_order')
      .eq('capsule_id', capsule.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order'),
  ])

  const profileSections = profileRes.data ?? []
  const featuredPhotos = featuredRes.data ?? []
  const galleryPhotos = galleryRes.data ?? []

  // SECURITY — account numbers masked server-side, never reach client
  const supportAccounts = (supportRes.data ?? []).map(acc => ({
    ...acc,
    account_number: maskAccountNumber(acc.account_number),
  }))

  const hasWaysToHonour = supportAccounts.length > 0
  const waysLabel = getWaysToHonourLabel(capsule.event_type, capsule.honouree_name)
  const eventLabel = getEventTypeLabel(capsule.event_type)
  const eventEmoji = getEventTypeEmoji(capsule.event_type)

  const hasContent = profileSections.length > 0 || featuredPhotos.length > 0 ||
    galleryPhotos.length > 0 || hasWaysToHonour

  return (
    <div style={{ minHeight: '100vh', background: purpleDark, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ═══════════════════════════════════════════════
          TOP NAV BAR
          Minimal — logo left, back link right
      ═══════════════════════════════════════════════ */}
      <div style={{
        background: 'rgba(15,10,30,0.95)',
        borderBottom: `1px solid ${goldFaint}`,
        padding: '12px 16px',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: '720px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em',
              background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>LEGACY</span>
            <span style={{
              fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em',
              color: 'rgba(255,255,255,0.28)', marginLeft: '0.1em',
            }}>CAPSULE</span>
          </a>

          {/* Back to tribute wall */}
          <a
            href={`/for/${slug}`}
            style={{
              fontSize: '12px', color: goldMuted, textDecoration: 'none',
              letterSpacing: '0.04em', transition: 'color 0.2s',
            }}
          >
            ← Tribute Wall
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          HERO — Photo backdrop + identity
      ═══════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        minHeight: '280px',
      }}>
        {/* Background — photo or gradient */}
        {capsule.hero_image_url ? (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${capsule.hero_image_url})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: purpleHero }} />
        )}

        {/* Overlays */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(15,10,30,0.5) 0%, rgba(15,10,30,0.3) 40%, rgba(15,10,30,0.85) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(226,195,107,0.08) 0%, transparent 60%)',
        }} />

        {/* Gold top rule */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.6), transparent)',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 10,
          maxWidth: '720px', margin: '0 auto',
          padding: '48px 20px 40px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '28px', marginBottom: '12px', lineHeight: 1 }}>{eventEmoji}</p>
          <p style={{
            fontSize: '10px', textTransform: 'uppercase',
            letterSpacing: '0.24em', color: goldMuted,
            marginBottom: '14px',
          }}>{eventLabel}</p>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(26px, 6vw, 42px)',
            fontWeight: 800, color: '#ffffff',
            lineHeight: 1.15, marginBottom: '10px',
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}>
            {capsule.honouree_name}
          </h1>
          {capsule.event_tag && (
            <p style={{
              fontSize: '15px', color: gold,
              marginBottom: '8px', fontWeight: 500,
            }}>
              {capsule.event_tag}
            </p>
          )}
          {capsule.event_date && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>
              {formatDate(capsule.event_date)}
            </p>
          )}
        </div>
      </div>

      {/* Gold rule */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.5), transparent)',
      }} />

      {/* ═══════════════════════════════════════════════
          SUBMIT TRIBUTE CTA — immediately after hero
      ═══════════════════════════════════════════════ */}
      <div style={{
        background: 'rgba(226,195,107,0.05)',
        borderBottom: `1px solid ${goldFaint}`,
        padding: '14px 20px',
        textAlign: 'center',
      }}>
        <a
          href={`/for/${slug}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
            color: '#1a0845', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', letterSpacing: '0.04em',
            boxShadow: '0 4px 16px rgba(226,195,107,0.25)',
          }}
        >
          ✦ Leave a tribute
        </a>
      </div>

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT
          Warm card surface for readability of long text
      ═══════════════════════════════════════════════ */}
      <main style={{
        maxWidth: '720px', margin: '0 auto',
        padding: '40px 16px 60px',
      }}>

        {!hasContent && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            borderRadius: '16px',
            border: `1px solid ${goldFaint}`,
            background: cardSurface,
          }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.75 }}>
              The organiser is still building this profile.<br />
              Check back soon.
            </p>
          </div>
        )}

        {/* ── Profile text sections ── */}
        {profileSections.map((section, index) => (
          <div
            key={section.id}
            style={{ marginBottom: '32px' }}
          >
            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                flex: 1, height: '1px',
                background: 'linear-gradient(to right, rgba(226,195,107,0.3), transparent)',
              }} />
              <h2 style={{
                fontSize: '10px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.2em',
                color: goldMuted, margin: 0, whiteSpace: 'nowrap',
              }}>
                {getProfileSectionLabel(section.section_type, section.custom_title)}
              </h2>
              <div style={{
                flex: 1, height: '1px',
                background: 'linear-gradient(to left, rgba(226,195,107,0.3), transparent)',
              }} />
            </div>

            {/* Content card — warm light surface for reading */}
            <div style={{
              background: cardSurfaceLight,
              borderRadius: '14px',
              padding: '24px 26px',
              border: `1px solid rgba(226,195,107,0.12)`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '15px',
                color: '#1C1014',
                lineHeight: 1.85,
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}>
                {section.content}
              </p>
            </div>
          </div>
        ))}

        {/* ── Featured Photos ── */}
        {featuredPhotos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(226,195,107,0.3), transparent)' }} />
              <h2 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: goldMuted, margin: 0 }}>
                Featured Photos
              </h2>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, rgba(226,195,107,0.3), transparent)' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
            }}>
              {featuredPhotos.map(photo => (
                <div key={photo.id} style={{
                  borderRadius: '12px', overflow: 'hidden',
                  border: `1px solid ${goldFaint}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                }}>
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? `Photo of ${capsule.honouree_name}`}
                    style={{ width: '100%', objectFit: 'cover', aspectRatio: '4/3', display: 'block' }}
                    loading="lazy"
                  />
                  {photo.caption && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'rgba(255,253,248,0.95)',
                    }}>
                      <p style={{ fontSize: '12px', color: '#5F5E5A', margin: 0 }}>{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Gallery grid ── */}
        {galleryPhotos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(226,195,107,0.3), transparent)' }} />
              <h2 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: goldMuted, margin: 0 }}>
                Gallery
              </h2>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, rgba(226,195,107,0.3), transparent)' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}>
              {galleryPhotos.map(photo => (
                <div key={photo.id} style={{
                  borderRadius: '10px', overflow: 'hidden',
                  border: `1px solid ${goldFaint}`,
                  aspectRatio: '1',
                }}>
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Ways to Honour ── */}
        {hasWaysToHonour && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(226,195,107,0.3), transparent)' }} />
              <h2 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: goldMuted, margin: 0, textAlign: 'center' }}>
                {waysLabel}
              </h2>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, rgba(226,195,107,0.3), transparent)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {supportAccounts.map(account => (
                <WaysToHonourCard
                  key={account.id}
                  account={account}
                  capsuleId={capsule.id}
                  acknowledgeLabel={getGiftAcknowledgeLabel(capsule.event_type)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom navigation ── */}
        <div style={{
          paddingTop: '24px',
          borderTop: `1px solid ${goldFaint}`,
          display: 'flex', flexWrap: 'wrap', gap: '10px',
          justifyContent: 'center',
          marginTop: '16px',
        }}>
          <a
            href={`/for/${slug}`}
            style={{
              padding: '10px 22px', borderRadius: '24px', textDecoration: 'none',
              border: `1px solid rgba(226,195,107,0.28)`,
              color: goldMuted, fontSize: '13px', fontWeight: 600,
              letterSpacing: '0.04em', background: 'rgba(226,195,107,0.05)',
            }}
          >
            ← Tribute Wall
          </a>
          <a
            href={`/for/${slug}`}
            style={{
              padding: '10px 22px', borderRadius: '24px', textDecoration: 'none',
              background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
              color: '#1a0845', fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            Leave a Tribute ✦
          </a>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer style={{
        background: 'rgba(255,255,255,0.02)',
        borderTop: `1px solid ${goldFaint}`,
        padding: '32px 20px',
        textAlign: 'center',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em',
          background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LEGACY</span>
        <span style={{
          fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.2)', marginLeft: '0.1em',
        }}>CAPSULE</span>
        <p style={{
          fontSize: '10px', color: 'rgba(255,255,255,0.15)',
          marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Events end. Legacies don't.
        </p>
        <p style={{ marginTop: '10px' }}>
          <a
            href="/book"
            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', textDecoration: 'none', letterSpacing: '0.04em' }}
          >
            Planning your own event? Start here →
          </a>
        </p>
      </footer>

    </div>
  )
}

/* =========================================================
   SECTION 3 — Metadata
========================================================= */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await client
    .from('capsules')
    .select('honouree_name, event_tag, event_type')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return { title: 'Profile | LegacyCapsule' }

  return {
    title: `${data.honouree_name} — ${data.event_tag ?? getEventTypeLabel(data.event_type)} | LegacyCapsule`,
    description: `${data.event_tag ?? getEventTypeLabel(data.event_type)} — a LegacyCapsule tribute collection.`,
  }
}
