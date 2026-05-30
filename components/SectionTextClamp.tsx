'use client'
/* =========================================================
   components/SectionTextClamp.tsx
   → components/SectionTextClamp.tsx
   
   Client wrapper for profile section text truncation.
   6-line clamp with inline "read more" / "show less".
   Profile page is a server component — this client
   component handles the expand/collapse interaction.
========================================================= */
import { useState } from 'react'

interface Props {
  content: string
  isQuote?: boolean
  bodyTextStyle: React.CSSProperties
}

export default function SectionTextClamp({ content, isQuote, bodyTextStyle }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (isQuote) {
    return (
      <p style={{ ...bodyTextStyle, fontSize: '17px', fontStyle: 'italic', lineHeight: 1.75 }}>
        "{content}"
      </p>
    )
  }

  return (
    <div>
      <p style={{
        ...bodyTextStyle,
        display: expanded ? 'block' : '-webkit-box',
        WebkitLineClamp: expanded ? undefined : 6,
        WebkitBoxOrient: 'vertical' as any,
        overflow: expanded ? 'visible' : 'hidden',
        margin: 0,
      }}>
        {content}
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
