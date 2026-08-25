'use client'
/* =========================================================
   FILE PATH: components/SectionTextClamp.tsx
   PURPOSE:   Client wrapper for profile section text.
              6-line clamp with inline "read more" / "show less".
              Auto-detects URLs in content and renders them
              as clickable hyperlinks (profile sections only).
   BUILT BY:  AI6
   UPDATED:   AI25 · Claude Sonnet 4.6 · 25 August 2026
              — linkifyText utility added
              — URLs in section content render as hyperlinks
              — XSS-safe: React.createElement only, no dangerouslySetInnerHTML
   VERSION:   v2.2.0
========================================================= */
import { useState } from 'react'
import React from 'react'

// ═══ SECTION 1 — Types ═══

interface Props {
  content:       string
  isQuote?:      boolean
  bodyTextStyle: React.CSSProperties
}

// ═══ SECTION 2 — URL linkifier ═══
// Splits text on URLs and returns mixed array of strings and anchor elements.
// Uses React.createElement instead of JSX to avoid parser ambiguity
// inside a utility function.

const URL_PATTERN = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g

const LINK_STYLE: React.CSSProperties = {
  color:               '#B8960C',
  textDecoration:      'underline',
  textUnderlineOffset: '2px',
  wordBreak:           'break-all',
  fontStyle:           'normal',
}

function linkifyText(text: string): React.ReactNode[] {
  const parts = text.split(URL_PATTERN)
  return parts.map((part, i) => {
    const isUrl = /^https?:\/\//.test(part) || /^www\./.test(part)
    if (!isUrl) return part
    const href    = part.startsWith('http') ? part : `https://${part}`
    const clean   = href.replace(/[.,;:!?)'"\]]+$/, '')
    const display = part.replace(/[.,;:!?)'"\]]+$/, '')
    return React.createElement(
      'a',
      {
        key:    i,
        href:   clean,
        target: '_blank',
        rel:    'noopener noreferrer',
        style:  LINK_STYLE,
      },
      display
    )
  })
}

// ═══ SECTION 3 — Component ═══

export default function SectionTextClamp({ content, isQuote, bodyTextStyle }: Props) {
  const [expanded, setExpanded] = useState(false)

  const linked = linkifyText(content)

  if (isQuote) {
    return (
      <p style={{ ...bodyTextStyle, fontSize: '17px', fontStyle: 'italic', lineHeight: 1.75 }}>
        "{linked}"
      </p>
    )
  }

  return (
    <div>
      <p style={{
        ...bodyTextStyle,
        display:         expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? undefined : 6,
        WebkitBoxOrient: 'vertical' as any,
        overflow:        expanded ? 'visible' : 'hidden',
        margin:          0,
      }}>
        {linked}
      </p>
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{ fontSize: '12px', color: '#B8960C', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', display: 'block', fontFamily: "'DM Sans', sans-serif" }}
        >
          read more
        </button>
      )}
      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          style={{ fontSize: '12px', color: '#B8960C', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', display: 'block', fontFamily: "'DM Sans', sans-serif" }}
        >
          show less
        </button>
      )}
    </div>
  )
}
