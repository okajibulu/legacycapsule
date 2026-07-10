// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/og/OpenGraphHeroCover.tsx
// PURPOSE: Mode B — Hero Cover (with organiser hero image) (OG02 Section 8)
// Rendered by Satori in Edge runtime — pure JSX, no CSS classes, no hooks
// 1200 × 630 px output
// The hero image enhances — all hierarchy from Mode A is preserved
// ─────────────────────────────────────────────────────────────────────────────

import type { CoverTheme } from '@/lib/og/CoverThemeResolver'
import type { LegacySnapshot } from '@/lib/og/getLegacySnapshot'
import { formatContributions, formatCountries } from '@/lib/og/getLegacySnapshot'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Props
// ─────────────────────────────────────────────────────────────────────────────

interface OpenGraphHeroCoverProps {
  honoureeName: string
  honoureeTitle?: string | null
  eventContext: string
  snapshot: LegacySnapshot
  theme: CoverTheme
  participationPrompt: string
  legacyStatement: string
  /** Absolute URL to hero image — must be publicly accessible */
  heroImageUrl: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Constants
// ─────────────────────────────────────────────────────────────────────────────

const W = 1200
const H = 630
const SPINE_W = 6
// Hero takes right 42% — text left 58%
const TEXT_COL_W = Math.floor(W * 0.58)
const HERO_COL_W = W - TEXT_COL_W

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Helpers
// ─────────────────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + '…'
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Component
// Layout: split — text left column, hero image right column
// Left column preserves complete hierarchy from Mode A
// Right column: hero image with gradient fade into left column
// ─────────────────────────────────────────────────────────────────────────────

export default function OpenGraphHeroCover({
  honoureeName,
  honoureeTitle,
  eventContext,
  snapshot,
  theme: t,
  participationPrompt,
  legacyStatement,
  heroImageUrl,
}: OpenGraphHeroCoverProps) {
  const contribFormatted = formatContributions(snapshot.contributions)
  const countriesFormatted = formatCountries(snapshot.countries)
  const hasSnapshot = contribFormatted !== null && snapshot.contributions > 0

  const displayName = honoureeTitle
    ? `${honoureeTitle} ${honoureeName}`
    : honoureeName
  const nameFontSize = displayName.length > 32 ? 44 : displayName.length > 24 ? 52 : 60

  return (
    <div
      style={{
        display: 'flex',
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        background: t.bgGradient,
      }}
    >
      {/* ── Spine ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SPINE_W,
          height: H,
          background: `linear-gradient(to bottom, ${t.accent}, ${t.accentMuted}, ${t.accent})`,
          zIndex: 10,
          display: 'flex',
        }}
      />

      {/* ── Hero image — right column ───────────────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImageUrl}
        alt=""
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: HERO_COL_W + 60, // slight overlap for gradient blend
          height: H,
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />

      {/* ── Gradient: fade hero left into background ───────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: TEXT_COL_W - 120,
          top: 0,
          width: 200,
          height: H,
          background: `linear-gradient(to right, ${t.bgGradient.includes('#') ? t.bgGradient.split('0%, ')[1]?.split(' ')[0] ?? '#110824' : '#110824'} 0%, transparent 100%)`,
          zIndex: 2,
          display: 'flex',
        }}
      />

      {/* ── Dark scrim over hero for legibility ────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: HERO_COL_W,
          height: H,
          background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)',
          zIndex: 3,
          display: 'flex',
        }}
      />

      {/* ── Top-right: Legacy Snapshot pill floating on hero ──────────────── */}
      {hasSnapshot && (
        <div
          style={{
            position: 'absolute',
            top: 28,
            right: 32,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${t.accent}50`,
            borderRadius: 6,
            backdropFilter: 'blur(8px)',
          }}
        >
          {contribFormatted && (
            <span style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>
              {contribFormatted}
            </span>
          )}
          {contribFormatted && countriesFormatted && (
            <div style={{ width: 1, height: 18, background: `${t.accent}40`, display: 'flex' }} />
          )}
          {countriesFormatted && (
            <span style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>
              {countriesFormatted}
            </span>
          )}
        </div>
      )}

      {/* ── Left column: full text hierarchy ──────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingLeft: 60 + SPINE_W,
          paddingRight: 40,
          paddingTop: 40,
          paddingBottom: 36,
          width: TEXT_COL_W,
          height: H,
          zIndex: 5,
          position: 'relative',
        }}
      >
        {/* TOP: masthead */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, display: 'flex', opacity: 0.8 }}>{t.ornament}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: t.textFaint,
              }}
            >
              LEGACYCAPSULE
            </span>
          </div>
          <span
            style={{
              fontSize: 13,
              color: t.accentMuted,
              fontStyle: 'italic',
              marginTop: 6,
              letterSpacing: '0.03em',
            }}
          >
            Events end. Legacies don&apos;t.
          </span>
          <div
            style={{
              marginTop: 18,
              width: 40,
              height: 1,
              background: `linear-gradient(to right, ${t.accent}, transparent)`,
              display: 'flex',
            }}
          />
        </div>

        {/* CENTRE: honouree + event context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div
            style={{
              fontSize: nameFontSize,
              fontWeight: 700,
              color: t.textPrimary,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              display: 'flex',
              flexWrap: 'wrap',
              maxWidth: TEXT_COL_W - 100,
            }}
          >
            {truncate(displayName, 38)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: t.accent,
                display: 'flex',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 17,
                color: t.accentMuted,
                letterSpacing: '0.03em',
              }}
            >
              {truncate(eventContext, 44)}
            </span>
          </div>
        </div>

        {/* BOTTOM: statement + CTA + domain */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              width: TEXT_COL_W - 100,
              height: 1,
              background: `linear-gradient(to right, ${t.accent}40, transparent)`,
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 12,
                color: t.textFaint,
                fontStyle: 'italic',
                maxWidth: 280,
              }}
            >
              {legacyStatement}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 16px',
                background: `linear-gradient(135deg, ${t.accent}CC, ${t.accentMuted}CC)`,
                borderRadius: 24,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0A0818', letterSpacing: '0.04em' }}>
                {participationPrompt}
              </span>
              <span style={{ fontSize: 12, color: '#0A0818', opacity: 0.7 }}>→</span>
            </div>
          </div>
          <span style={{ fontSize: 10, color: t.textFaint, letterSpacing: '0.12em', opacity: 0.5 }}>
            itslegacycapsule.com
          </span>
        </div>
      </div>
    </div>
  )
}
