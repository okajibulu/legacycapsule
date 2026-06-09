/**
 * ============================================================
 * FILE PATH: components/CapsuleBottomNav.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Bottom navigation for all public capsule pages.
 * Fixed to bottom. Theme-aware. Shows only active sections.
 * Matches manage page bottom nav aesthetic (dark bg, gold accents).
 *
 * Active sections shown based on:
 *   - Tribute Room: always shown
 *   - Event Story: shown when hasPhases = true
 *   - Profile: always shown
 *   - Legacy Room: shown when contributorCount >= 1
 *   - Attire: shown when 'attire' in components
 *
 * Usage:
 *   <CapsuleBottomNav
 *     slug="my-capsule"
 *     currentPage="tribute"
 *     components={capsule.components}
 *     contributorCount={42}
 *     hasPhases={true}
 *     themeKey="memorial"
 *   />
 *
 * Sub-sections:
 *   1. Types & constants
 *   2. Nav item config (derived from props)
 *   3. Render
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types & constants
// ============================================================

import { getThemeConfig } from '@/lib/themeConfig'
import type { ThemeKey } from '@/lib/themeConfig'

export type CapsulePage = 'tribute' | 'story' | 'profile' | 'legacy' | 'attire'

interface CapsuleBottomNavProps {
  slug: string
  currentPage: CapsulePage
  components: string[]
  contributorCount: number
  hasPhases: boolean
  themeKey: ThemeKey
}

// Nav tab definition
interface NavTab {
  id: CapsulePage
  label: string
  icon: string
  href: string
  active: boolean
}

// ============================================================
// SECTION 2 — Build nav item list from props
// ============================================================

function buildNavTabs(props: CapsuleBottomNavProps): NavTab[] {
  const { slug, components, contributorCount, hasPhases } = props

  const tabs: NavTab[] = []

  // Tribute Room — always visible
  tabs.push({
    id: 'tribute',
    label: 'Tributes',
    icon: '✦',
    href: `/for/${slug}`,
    active: true,
  })

  // Event Story — only when phases exist
  if (hasPhases) {
    tabs.push({
      id: 'story',
      label: 'Story',
      icon: '◈',
      href: `/for/${slug}/story`,
      active: true,
    })
  }

  // Profile — always visible
  tabs.push({
    id: 'profile',
    label: 'Profile',
    icon: '◉',
    href: `/for/${slug}/profile`,
    active: true,
  })

  // Legacy Room — only when there are approved contributions
  if (contributorCount >= 1) {
    tabs.push({
      id: 'legacy',
      label: 'Legacy',
      icon: '◎',
      href: `/for/${slug}/legacy`,
      active: true,
    })
  }

  // Attire — only when module activated
  if ((components ?? []).includes('attire')) {
    tabs.push({
      id: 'attire',
      label: 'Attire',
      icon: '◐',
      href: `/for/${slug}/attire`,
      active: true,
    })
  }

  return tabs
}

// ============================================================
// SECTION 3 — Render
// ============================================================

export default function CapsuleBottomNav(props: CapsuleBottomNavProps) {
  const { currentPage, themeKey } = props
  const t = getThemeConfig(themeKey)
  const tabs = buildNavTabs(props)

  // Don't render if only 1 tab (nothing to navigate between)
  if (tabs.length <= 1) return null

  const gold = t.accentPrimary
  const goldFaint = t.accentFaint
  const textFaint = t.textFaint

  return (
    <>
      {/* Safe area spacer */}
      <div style={{ height: '80px' }} />

      {/* Fixed bottom bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(15,10,30,0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${goldFaint}`,
        display: 'flex',
        padding: '6px 8px max(8px, env(safe-area-inset-bottom))',
      }}>
        {tabs.map(tab => {
          const isCurrent = tab.id === currentPage

          return (
            <a
              key={tab.id}
              href={tab.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: '4px',
                background: isCurrent ? `rgba(226,195,107,0.1)` : 'transparent',
                textDecoration: 'none',
                padding: '8px 4px',
                borderRadius: '10px',
                position: 'relative' as const,
                margin: '0 2px',
                transition: 'background 0.2s',
              }}
            >
              {/* Icon */}
              <span style={{
                fontSize: '18px',
                color: isCurrent ? gold : 'rgba(255,255,255,0.45)',
                transition: 'color 0.15s',
                lineHeight: 1,
              }}>
                {tab.icon}
              </span>

              {/* Label */}
              <span style={{
                fontSize: '10px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                color: isCurrent ? gold : 'rgba(255,255,255,0.45)',
                fontWeight: isCurrent ? 700 : 500,
                transition: 'color 0.15s',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {tab.label}
              </span>

              {/* Active indicator line */}
              {isCurrent && (
                <div style={{
                  position: 'absolute' as const,
                  bottom: 0,
                  left: '25%',
                  right: '25%',
                  height: '2px',
                  borderRadius: '1px',
                  background: gold,
                }} />
              )}
            </a>
          )
        })}
      </div>
    </>
  )
}
