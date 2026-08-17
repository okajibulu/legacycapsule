'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/SettingsSubTabs.tsx
// PURPOSE:   Sub-tab navigation inside the Settings tab of the manage dashboard.
//            Renders pill navigation for: Capsule, Notifications, Team,
//            Orders, Activity Log.
//            Activity Log tab is hidden for all account types except Organiser
//            and Family Rep Full Access.
//            Horizontally scrollable on mobile.
// ARCHITECTURE: CA-SPEC-001 — Settings restructure (Step 3).
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// PROPS:
//   active         — currently active sub-tab key
//   onChange       — callback when user selects a sub-tab
//   canSeeActivity — true only for Organiser and Family Rep Full Access
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Types ═══

export type SettingsSubTab = 'capsule' | 'notifications' | 'team' | 'orders' | 'activity'

interface SettingsSubTabsProps {
  active:         SettingsSubTab
  onChange:       (tab: SettingsSubTab) => void
  canSeeActivity: boolean
}

// ═══ SECTION 2 — Theme constants ═══
// Matches the manage dashboard colour palette exactly.

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const textFaint   = 'rgba(255,255,255,0.28)'
const textPrimary = 'rgba(255,255,255,0.92)'

// ═══ SECTION 3 — Component ═══

export default function SettingsSubTabs({
  active,
  onChange,
  canSeeActivity,
}: SettingsSubTabsProps) {

  const tabs: { id: SettingsSubTab; label: string }[] = [
    { id: 'capsule',       label: 'Capsule' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'team',          label: 'Team' },
    { id: 'orders',        label: 'Orders' },
    ...(canSeeActivity ? [{ id: 'activity' as SettingsSubTab, label: 'Activity Log' }] : []),
  ]

  return (
    <div style={{
      display:        'flex',
      gap:            '6px',
      overflowX:      'auto',
      paddingBottom:  '2px',
      marginBottom:   '16px',
      // Hide scrollbar across browsers
      scrollbarWidth: 'none',
      msOverflowStyle: 'none' as any,
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink:    0,
              padding:       '7px 16px',
              borderRadius:  '20px',
              border:        `1px solid ${isActive ? 'rgba(226,195,107,0.4)' : 'rgba(255,255,255,0.08)'}`,
              background:    isActive ? goldFaint : 'transparent',
              color:         isActive ? gold : textFaint,
              fontSize:      '11px',
              fontWeight:    isActive ? 700 : 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              cursor:        'pointer',
              transition:    'all 0.15s',
              whiteSpace:    'nowrap',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
