'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/capsule/GlobalExpressionsStrip.tsx
// PURPOSE: Rotating multilingual expressions strip for the tribute wall hero.
//          Sits below the honouree photo box, above the CTA.
//          Fixed to viewport — does not scroll with tribute cards.
//
// BEHAVIOUR:
//   - Random start position (no obvious first word)
//   - Time-based progression — continues from where sequence is at any moment
//   - Never resets on page revisit
//   - Fades between expressions (no slide)
//   - Pauses on hover
//   - Respects prefers-reduced-motion
//   - Brand interludes shown centred without language label
//   - English entries shown without secondary label (or 'English' dimmed)
//   - CTA never rotates — this component only manages the expression display
//
// INTEGRATION:
//   Pass expressionCategory from lang.expressionCategory (ParticipationLanguage)
//   The category is reserved for future per-category expression pools.
//   Currently uses the shared global pool.
//
// BUILT BY: AI12 · Claude Sonnet 4.6 · 22 July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect, useRef, useMemo } from 'react'
import { buildExpressionSequence }              from '@/lib/config/globalExpressions'
import type { Expression }                      from '@/lib/config/globalExpressions'

// ═══ SECTION 2 — Props ═══

interface Props {
  expressionCategory?: string   // Future: per-category pools. Currently unused.
  intervalMs?:         number   // Default: 3000
  themeAccent?:        string   // Colour for expression text. Default: gold
  themeSecondary?:     string   // Colour for language label. Default: dimmed
}

// ═══ SECTION 3 — Constants ═══

const INTERVAL_DEFAULT  = 3000
const GOLD              = '#E2C36B'
const GOLD_MUTED        = 'rgba(226,195,107,0.45)'
const BRAND_COLOR       = 'rgba(255,255,255,0.45)'

// ═══ SECTION 4 — Component ═══

export default function GlobalExpressionsStrip({
  expressionCategory,
  intervalMs    = INTERVAL_DEFAULT,
  themeAccent   = GOLD,
  themeSecondary = GOLD_MUTED,
}: Props) {

  // Build the sequence once per mount — random shuffle via buildExpressionSequence
  const sequence = useMemo<Expression[]>(() => buildExpressionSequence(), [])

  // ── Continuous time-based index ──────────────────────────────────────────
  // Uses elapsed time to pick a random-offset starting position that
  // continues progressing even when the user is away from the page.
  // No localStorage needed — purely time-derived.

  const startOffsetRef = useRef<number | null>(null)

  function getCurrentIndex(): number {
    if (startOffsetRef.current === null) {
      // Random offset on first render — no obvious starting word
      startOffsetRef.current = Math.floor(Math.random() * sequence.length)
    }
    const elapsed = Math.floor(Date.now() / intervalMs)
    return (startOffsetRef.current + elapsed) % sequence.length
  }

  const [currentIndex, setCurrentIndex] = useState<number>(() => getCurrentIndex())
  const [visible,      setVisible]      = useState(true)
  const [paused,       setPaused]       = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Reduced motion detection ──────────────────────────────────────────────
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // ── Interval ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return

    function tick() {
      if (paused) return
      // Fade out
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex(getCurrentIndex())
        // Fade in
        setVisible(true)
      }, 400) // 400ms fade duration
    }

    timerRef.current = setInterval(tick, intervalMs)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, intervalMs, sequence.length])

  const current = sequence[currentIndex]
  if (!current) return null

  const isBrand   = current.isBrand   ?? false
  const isEnglish = current.isEnglish ?? false

  // ── Reduced motion: show static first expression ──────────────────────────
  if (prefersReducedMotion) {
    return (
      <div style={wrapperStyle}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: themeAccent, letterSpacing: '0.02em' }}>
          {sequence[0].text}
        </span>
        {sequence[0].language && !sequence[0].isBrand && (
          <span style={{ fontSize: '11px', color: themeSecondary, marginLeft: '6px' }}>
            · {sequence[0].language}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 2000)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        style={{
          opacity:    visible ? 1 : 0,
          transition: `opacity ${prefersReducedMotion ? '0ms' : '400ms'} ease`,
          display:    'flex',
          alignItems: 'baseline',
          gap:        '0',
          justifyContent: isBrand ? 'center' : 'flex-start',
          width:      '100%',
        }}
      >
        {isBrand ? (
          // ── Brand interlude ────────────────────────────────────────────────
          <span style={{
            fontSize:      '13px',
            fontWeight:    500,
            color:         BRAND_COLOR,
            fontStyle:     'italic',
            letterSpacing: '0.03em',
            textAlign:     'center',
          }}>
            {current.text}
          </span>
        ) : (
          // ── Expression + language ──────────────────────────────────────────
          <>
            <span style={{
              fontSize:      '18px',
              fontWeight:    700,
              color:         themeAccent,
              letterSpacing: '0.01em',
              lineHeight:    1.2,
            }}>
              {current.text}
            </span>
            {current.language && !isEnglish && (
              <span style={{
                fontSize:   '11px',
                fontWeight: 400,
                color:      themeSecondary,
                marginLeft: '6px',
                lineHeight: 1.2,
              }}>
                · {current.language}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ═══ SECTION 5 — Styles ═══

const wrapperStyle: React.CSSProperties = {
  display:        'flex',
  alignItems:     'center',
  minHeight:      '28px',
  padding:        '4px 0',
  overflow:       'hidden',
  width:          '100%',
}
