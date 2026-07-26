// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/guests/GuestModule.tsx
// PURPOSE:   Guest Coordination orchestrator — tabbed shell hosting
//            CircleManager, RSVPDashboard, ActivityFeed, and GuestList.
//            STUB: build-safe placeholder. Full implementation by AI15 Opus.
// BUILT BY:  AI15 (Claude Sonnet 4.6) · 26 July 2026 — STUB
// VERSION:   v2.9.0-stub
// ─────────────────────────────────────────────────────────────────────────────

'use client'

// ═══ SECTION 1 — Types ═══

interface GuestModuleProps {
  capsule: {
    id:              string
    slug:            string
    honouree_name:   string
    event_tag:       string | null
    tier:            string | null
    components:      string[]
  }
}

// ═══ SECTION 2 — Stub component ═══

export default function GuestModule({ capsule }: GuestModuleProps) {
  return (
    <div style={{
      minHeight:      '60vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '12px',
      padding:        '40px 24px',
      color:          'rgba(255,255,255,0.4)',
      fontFamily:     "'DM Sans', sans-serif",
    }}>
      <p style={{ fontSize: '13px', margin: 0 }}>
        Guest Management — coming online
      </p>
      <p style={{ fontSize: '11px', margin: 0, opacity: 0.6 }}>
        {capsule.slug}
      </p>
    </div>
  )
}
