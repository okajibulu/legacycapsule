/**
 * ============================================================
 * FILE PATH: components/CapsuleBottomNav.tsx
 * LEGACYCAPSULE ? VALNEX, UNIPESSOAL LDA ? RevoWorldTech
 * ============================================================
 * Built by: AI11 ? June 2026
 * Updated:  AI13 ? Claude Opus 4.6 ? 22 July 2026
 *   ? Premiums tab replaces Attire tab (always shown, 5th tab)
 *   ? PremiumsPanel bottom sheet wired to Premiums tab
 *   ? CapsulePage type: 'attire' removed, 'premiums' added
 *   ? 3 new props: capsuleId, honourName, eventType
 *   ? supportAccounts prop added for Gifting/EOH inline panel
 *
 * Bottom navigation for all public capsule pages.
 * Fixed to bottom. Theme-aware. Shows only active sections.
 *
 * Active sections shown based on:
 *   - Tribute Room:  always shown
 *   - Memories:      always shown (community stories always free)
 *   - Profile:       always shown
 *   - Highlights:    always shown
 *   - Premiums:      always shown (active = gold, inactive = greyed)
 *
 * Sub-sections:
 *   1. Types & constants
 *   2. Nav item config
 *   3. Render
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 ? Types & constants
// ============================================================

import { useState }            from 'react'
import { getThemeConfig }      from '@/lib/themeConfig'
import type { ThemeKey }       from '@/lib/themeConfig'
import PremiumsPanel           from '@/components/PremiumsPanel'

interface SupportAccount {
  id:                      string
  method_label:            string | null
  account_holder:          string | null
  bank_name:               string | null
  account_number:          string | null
  reference_guide:         string | null
  currency:                string | null
  is_active:               boolean
  sort_order:              number
  relationship_to_honouree: string | null
}

export type CapsulePage = 'tribute' | 'memories' | 'profile' | 'legacy' | 'premiums'

interface CapsuleBottomNavProps {
  slug:            string
  currentPage:     CapsulePage
  components:      string[]
  contributorCount: number
  hasPhases:       boolean
  themeKey:        ThemeKey
  // ?? New props for PremiumsPanel ??
  capsuleId:       string
  honourName:      string
  eventType:       string
  supportAccounts: SupportAccount[]
}

// Nav tab definition
interface NavTab {
  id:       CapsulePage
  label:    string
  icon:     string
  href:     string | null   // null = panel trigger (Premiums)
  active:   boolean
}

// ============================================================
// SECTION 2 ? Build nav item list from props
// ============================================================

function buildNavTabs(props: CapsuleBottomNavProps): NavTab[] {
  const { slug } = props
  const tabs: NavTab[] = []

  // Tab 1 ? Tributes (always)
  tabs.push({
    id:     'tribute',
    label:  'Tributes',
    icon:   '?',
    href:   `/for/${slug}`,
    active: true,
  })

  // Tab 2 ? Memories (always ? community stories is free for all capsules)
  tabs.push({
    id:     'memories',
    label:  'Memories',
    icon:   '?',
    href:   `/for/${slug}/stories`,
    active: true,
  })

  // Tab 3 ? Profile (always)
  tabs.push({
    id:     'profile',
    label:  'Profile',
    icon:   '?',
    href:   `/for/${slug}/profile`,
    active: true,
  })

  // Tab 4 ? Highlights (always)
  tabs.push({
    id:     'legacy',
    label:  'Highlights',
    icon:   '?',
    href:   `/for/${slug}/legacy`,
    active: true,
  })

  // Tab 5 ? Premiums (always ? panel trigger, not a page)
  tabs.push({
    id:     'premiums',
    label:  'Premiums',
    icon:   '?',
    href:   null,
    active: true,
  })

  return tabs
}

// ============================================================
// SECTION 3 ? Render
// ============================================================

export default function CapsuleBottomNav(props: CapsuleBottomNavProps) {
  const {
    currentPage, themeKey,
    slug, components, capsuleId, honourName, eventType, supportAccounts,
  } = props

  const t    = getThemeConfig(themeKey)
  const tabs = buildNavTabs(props)

  const [premiumsOpen, setPremiumsOpen] = useState(false)

  const gold     = t.accentPrimary
  const goldFaint = t.accentFaint

  // Check if any premium is active ? Premiums tab glows gold when active
  const PREMIUM_KEYS = ['ways_to_honour', 'attire', 'dday_capture', 'live_wall']
  const hasPremiumActive = PREMIUM_KEYS.some(k => (components ?? []).includes(k))

  return (
    <>
      {/* ?? Safe area spacer ?? */}
      <div style={{ height: '80px' }} />

      {/* ?? Fixed bottom bar ?? */}
      <div style={{
        position:          'fixed',
        bottom:            0,
        left:              0,
        right:             0,
        zIndex:            50,
        background:        'rgba(15,10,30,0.98)',
        backdropFilter:    'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop:         `1px solid ${goldFaint}`,
        display:           'flex',
        padding:           '6px 8px max(8px, env(safe-area-inset-bottom))',
      }}>
        {tabs.map(tab => {
          const isPremiums = tab.id === 'premiums'
          const isCurrent  = !premiumsOpen && tab.id === currentPage || (premiumsOpen && isPremiums)
          const isGlowing  = isPremiums && hasPremiumActive

          const tabContent = (
            <>
              {/* Icon */}
              <span style={{
                fontSize:   '18px',
                color:      isCurrent
                  ? gold
                  : isPremiums && hasPremiumActive
                    ? 'rgba(226,195,107,0.5)'
                    : 'rgba(255,255,255,0.45)',
                transition: 'color 0.15s',
                lineHeight: 1,
              }}>
                {tab.icon}
              </span>

              {/* Label */}
              <span style={{
                fontSize:      '10px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                color:         isCurrent
                  ? gold
                  : isPremiums && hasPremiumActive
                    ? 'rgba(226,195,107,0.5)'
                    : 'rgba(255,255,255,0.45)',
                fontWeight:    isCurrent ? 700 : 500,
                transition:    'color 0.15s',
                fontFamily:    "'DM Sans', sans-serif",
              }}>
                {tab.label}
              </span>

              {/* Active indicator */}
              {isCurrent && (
                <div style={{
                  position:     'absolute',
                  bottom:       0,
                  left:         '25%',
                  right:        '25%',
                  height:       '2px',
                  borderRadius: '1px',
                  background:   gold,
                }} />
              )}

              {/* Premiums active dot */}
              {isPremiums && hasPremiumActive && !isCurrent && (
                <div style={{
                  position:     'absolute',
                  top:          '6px',
                  right:        'calc(25% - 2px)',
                  width:        '5px',
                  height:       '5px',
                  borderRadius: '50%',
                  background:   'rgba(226,195,107,0.7)',
                }} />
              )}
            </>
          )

          const sharedStyle: React.CSSProperties = {
            flex:          1,
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '4px',
            background:    isCurrent ? 'rgba(226,195,107,0.1)' : 'transparent',
            padding:       '8px 4px',
            borderRadius:  '10px',
            position:      'relative',
            margin:        '0 2px',
            transition:    'background 0.2s',
            cursor:        'pointer',
          }

          if (isPremiums) {
            return (
              <button
                key={tab.id}
                onClick={() => setPremiumsOpen(o => !o)}
                style={{ ...sharedStyle, border: 'none', textDecoration: 'none' }}
              >
                {tabContent}
              </button>
            )
          }

          return (
            <a
              key={tab.id}
              href={tab.href!}
              style={{ ...sharedStyle, textDecoration: 'none' }}
            >
              {tabContent}
            </a>
          )
        })}
      </div>

      {/* ?? Premiums panel ?? */}
      {premiumsOpen && (
        <PremiumsPanel
          slug={slug}
          components={components}
          capsuleId={capsuleId}
          honourName={honourName}
          eventType={eventType}
          supportAccounts={supportAccounts}
          onClose={() => setPremiumsOpen(false)}
        />
      )}
    </>
  )
}
