// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/og/OpenGraphCover.tsx
// PURPOSE: Mode A — Legacy Cover (no hero image required) (OG02 Section 8)
// Rendered by Satori in the Edge runtime — MUST be pure JSX, no CSS classes,
// no browser APIs, no dynamic imports, no React hooks
// 1200 × 630 px output
// ─────────────────────────────────────────────────────────────────────────────

import type { CoverTheme } from '@/lib/og/CoverThemeResolver'
import type { LegacySnapshot } from '@/lib/og/getLegacySnapshot'
import { formatContributions, formatCountries } from '@/lib/og/getLegacySnapshot'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Props
// ─────────────────────────────────────────────────────────────────────────────

interface OpenGraphCoverProps {
  /** The subject / honouree name — largest element (OG02 Level 3) */
  honoureeName: string
  /** Optional title prefix — Prof., Dr., Chief, etc. */
  honoureeTitle?: string | null
  /** Event context line — "Retirement Celebration", "Celebration of Life" (OG02 Level 4) */
  eventContext: string
  /** Participation metrics for Legacy Snapshot (OG02 Level 5) */
  snapshot: LegacySnapshot
  /** Theme tokens derived from CoverThemeResolver */
  theme: CoverTheme
  /** Context-aware participation CTA (OG02 Section 5A) */
  participationPrompt: string
  /** Legacy statement (OG02 Level 6) */
  legacyStatement: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Constants
// ─────────────────────────────────────────────────────────────────────────────

const W = 1200
const H = 630
const SPINE_W = 6       // book spine width in px
const MARGIN_L = 72     // left content margin
const MARGIN_R = 72
const CONTENT_W = W - MARGIN_L - MARGIN_R - SPINE_W

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Name truncation helper
// Satori does not reflow — prevent overflow on very long names
// ─────────────────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + '…'
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Component
// Visual hierarchy per OG02 Section 5:
// Level 1 LEGACYCAPSULE masthead (top)
// Level 2 Brand promise "Events end. Legacies don't." (below masthead)
// Level 3 Honouree name (largest — centre-left)
// Level 4 Event context (below honouree)
// Level 5 Legacy Snapshot (contributions + countries)
// Level 6 Legacy statement (above footer)
// Level 7 Footer domain
// Signature element: diagonal spine on left edge
// ─────────────────────────────────────────────────────────────────────────────

export default function OpenGraphCover({
  honoureeName,
  honoureeTitle,
  eventContext,
  snapshot,
  theme: t,
  participationPrompt,
  legacyStatement,
}: OpenGraphCoverProps) {
  const contribFormatted = formatContributions(snapshot.contributions)
  const countriesFormatted = formatCountries(snapshot.countries)
  const hasSnapshot = contribFormatted !== null && snapshot.contributions > 0

  // Full name line — title if present
  const displayName = honoureeTitle
    ? `${honoureeTitle} ${honoureeName}`
    : honoureeName

  // Name size responsive to length
  const nameFontSize = displayName.length > 32 ? 52 : displayName.length > 24 ? 62 : 72

  return (
    <div
      style={{
        display: 'flex',
        width: W,
        height: H,
        background: t.bgGradient,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      {/* ── Signature: Book spine — left edge ────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SPINE_W,
          height: H,
          background: `linear-gradient(to bottom, ${t.accent}, ${t.accentMuted}, ${t.accent})`,
          display: 'flex',
        }}
      />

      {/* ── Background texture — subtle radiating glow ────────────────────── */}
      <div
        style={{
          position: 'absolute',
          right: -80,
          top: -80,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${t.accent}18 0%, transparent 70%)`,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 80,
          bottom: -120,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${t.accent}10 0%, transparent 70%)`,
          display: 'flex',
        }}
      />

      {/* ── Main content column ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingLeft: MARGIN_L + SPINE_W,
          paddingRight: MARGIN_R,
          paddingTop: 44,
          paddingBottom: 40,
          width: W,
          height: H,
        }}
      >
        {/* ── TOP ROW: masthead + brand promise ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Level 1 — Masthead */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Ornament */}
            <span
              style={{
                fontSize: 18,
                lineHeight: 1,
                display: 'flex',
                opacity: 0.85,
              }}
            >
              {t.ornament}
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: t.textFaint,
              }}
            >
              LEGACYCAPSULE
            </span>
          </div>

          {/* Level 2 — Brand promise */}
          <div style={{ display: 'flex', marginTop: 8 }}>
            <span
              style={{
                fontSize: 14,
                color: t.accentMuted,
                fontStyle: 'italic',
                letterSpacing: '0.04em',
              }}
            >
              Events end. Legacies don&apos;t.
            </span>
          </div>

          {/* Thin accent rule below header */}
          <div
            style={{
              marginTop: 20,
              width: 48,
              height: 1,
              background: `linear-gradient(to right, ${t.accent}, transparent)`,
              display: 'flex',
            }}
          />
        </div>

        {/* ── CENTRE: Honouree name + event context ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Level 3 — Honouree name — LARGEST element */}
          <div
            style={{
              fontSize: nameFontSize,
              fontWeight: 700,
              color: t.textPrimary,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              maxWidth: CONTENT_W,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {truncate(displayName, 44)}
          </div>

          {/* Level 4 — Event context */}
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {/* Accent dot */}
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: t.accent,
                display: 'flex',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 20,
                color: t.accentMuted,
                letterSpacing: '0.04em',
                fontWeight: 400,
              }}
            >
              {truncate(eventContext, 52)}
            </span>
          </div>

          {/* Level 5 — Legacy Snapshot */}
          {hasSnapshot && (
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '10px 20px',
                background: `${t.accent}14`,
                border: `1px solid ${t.accent}30`,
                borderRadius: 6,
                width: 'fit-content',
              }}
            >
              {contribFormatted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: t.accent,
                      lineHeight: 1,
                    }}
                  >
                    {contribFormatted}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: t.textFaint,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    contributed
                  </span>
                </div>
              )}

              {contribFormatted && countriesFormatted && (
                <div
                  style={{
                    width: 1,
                    height: 32,
                    background: `${t.accent}30`,
                    display: 'flex',
                  }}
                />
              )}

              {countriesFormatted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: t.accent,
                      lineHeight: 1,
                    }}
                  >
                    {countriesFormatted}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: t.textFaint,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    represented
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BOTTOM ROW: statement + CTA + domain ──────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Divider */}
          <div
            style={{
              width: '100%',
              height: 1,
              background: `linear-gradient(to right, ${t.accent}40, transparent)`,
              display: 'flex',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Level 6 — Legacy statement */}
            <span
              style={{
                fontSize: 13,
                color: t.textFaint,
                fontStyle: 'italic',
                letterSpacing: '0.02em',
                maxWidth: 480,
              }}
            >
              {legacyStatement}
            </span>

            {/* Participation CTA pill (OG02 Section 5A) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                background: `linear-gradient(135deg, ${t.accent}CC, ${t.accentMuted}CC)`,
                borderRadius: 24,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0A0818',
                  letterSpacing: '0.04em',
                }}
              >
                {participationPrompt}
              </span>
              <span style={{ fontSize: 13, color: '#0A0818', opacity: 0.7 }}>→</span>
            </div>
          </div>

          {/* Level 7 — Domain footer */}
          <span
            style={{
              fontSize: 11,
              color: t.textFaint,
              letterSpacing: '0.12em',
              opacity: 0.6,
            }}
          >
            itslegacycapsule.com
          </span>
        </div>
      </div>
    </div>
  )
}
