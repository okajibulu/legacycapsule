'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/manage/gift/GiftCollectionSection.tsx
// PURPOSE:    Services Tab section for Gift Collection System
//             — Discovery card when not activated (with pricing + "Add to capsule")
//             — Tabbed management UI when activated (Manifest · Blocks · Settings)
//             Placed below Event Moments, above D-Day Live Wall in Services Tab
// SPEC:       GCS-SPEC-001-AMD-002 Part One (LC02 subordination, commercial path)
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// PARENT:     Rendered in the Services Tab of the manage dashboard
// GATING:     capsule.components.includes('gift_collection')
//             Commercial activation via LC04 Payment Engine (featureUnlocker.ts)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load heavy sub-components
const GiftManifestManager = dynamic(
  () => import('@/components/manage/gift/GiftManifestManager'),
  { loading: () => <SectionLoader /> }
)
const GiftBlockManager = dynamic(
  () => import('@/components/manage/gift/GiftBlockManager'),
  { loading: () => <SectionLoader /> }
)


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface CoAdmin {
  id:           string
  display_name: string
  role:         string
}

interface GiftCollectionSectionProps {
  capsuleId:  string
  isActive:   boolean   // capsule.components.includes('gift_collection')
  accountRole: string   // current user's role — gates block manager
  coAdmins:   CoAdmin[] // capsule_accounts with coordinator-eligible roles
  onActivate?: () => void  // opens LC04 payment flow
}

type ActiveTab = 'manifest' | 'blocks' | 'settings'


// ═══ SECTION 2 — Loader ═════════════════════════════════════════════════════════

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
    </div>
  )
}


// ═══ SECTION 3 — Discovery card (not yet activated) ════════════════════════════
//
// Shown when gift_collection is not in capsule.components[].
// Describes the service, shows price, and triggers the payment flow.

function GiftCollectionDiscovery({ onActivate }: { onActivate?: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Visual header */}
      <div className="bg-gradient-to-br from-[#1a0845] to-[#0f0a1e] border-b border-white/5 px-5 py-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E2C36B]/10 border border-[#E2C36B]/20 flex items-center
                          justify-center shrink-0">
            <svg className="w-6 h-6 text-[#E2C36B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Gift Collection</h3>
            <p className="text-white/50 text-sm mt-1 leading-relaxed">
              Coordinate gift distribution with precision — every guest receives exactly what was
              prepared for them, with zero confusion.
            </p>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="px-5 py-5 space-y-3">
        {[
          {
            icon: '🎫',
            title: 'Named collection credentials',
            desc:  'Each guest receives a personal code and QR — no crowding, no guessing.',
          },
          {
            icon: '📦',
            title: 'Live inventory tracking',
            desc:  'See exactly how many of each item has been collected and how much remains.',
          },
          {
            icon: '🔍',
            title: 'Dual-factor verification',
            desc:  'Code plus name or phone — only the right person collects the right gift.',
          },
          {
            icon: '📊',
            title: 'Coordinator blocks',
            desc:  'Divide guests between coordinators — each manages their assigned portion.',
          },
          {
            icon: '📋',
            title: 'Full reconciliation report',
            desc:  'End-of-event report showing every collection, every exception, every override.',
          },
        ].map(f => (
          <div key={f.title} className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">{f.icon}</span>
            <div>
              <p className="text-white/80 text-sm font-medium">{f.title}</p>
              <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={onActivate}
          className="w-full py-3 bg-[#E2C36B] text-[#0f0a1e] text-sm font-semibold rounded-xl
                     hover:bg-[#E2C36B]/90 transition-colors"
        >
          Add Gift Collection to this event →
        </button>
        <p className="text-white/30 text-xs text-center mt-2">
          Pricing varies by event size — tap above to view options and activate.
        </p>
      </div>
    </div>
  )
}


// ═══ SECTION 4 — Section tab bar ════════════════════════════════════════════════

const TABS: { key: ActiveTab; label: string; adminOnly?: boolean }[] = [
  { key: 'manifest', label: 'Gift Manifest' },
  { key: 'blocks',   label: 'Number Blocks', adminOnly: true },
  { key: 'settings', label: 'Settings',      adminOnly: true },
]

function TabBar({
  active,
  onChange,
  accountRole,
}: {
  active:      ActiveTab
  onChange:    (tab: ActiveTab) => void
  accountRole: string
}) {
  const isAdmin = ['organiser', 'frfa', 'family_rep_full'].includes(accountRole)
  const visible = TABS.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
      {visible.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            active === t.key
              ? 'bg-[#E2C36B] text-[#0f0a1e]'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}


// ═══ SECTION 5 — Settings stub (Phase 3+) ══════════════════════════════════════

function GiftSettingsStub() {
  return (
    <div className="text-center py-12 text-white/30 text-sm space-y-1">
      <p>Gift Collection settings will appear here.</p>
      <p className="text-white/20 text-xs">Available in the next build phase.</p>
    </div>
  )
}


// ═══ SECTION 6 — Active management UI ══════════════════════════════════════════

function GiftManagementUI({
  capsuleId,
  accountRole,
  coAdmins,
}: {
  capsuleId:   string
  accountRole: string
  coAdmins:    CoAdmin[]
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('manifest')
  const isAdmin = ['organiser', 'frfa', 'family_rep_full'].includes(accountRole)

  return (
    <div className="space-y-5">
      <TabBar active={activeTab} onChange={setActiveTab} accountRole={accountRole} />

      {activeTab === 'manifest' && (
        <GiftManifestManager
          capsuleId={capsuleId}
          readOnly={!isAdmin}
        />
      )}

      {activeTab === 'blocks' && isAdmin && (
        <GiftBlockManager
          capsuleId={capsuleId}
          coAdmins={coAdmins}
        />
      )}

      {activeTab === 'settings' && isAdmin && (
        <GiftSettingsStub />
      )}
    </div>
  )
}


// ═══ SECTION 7 — Root export ════════════════════════════════════════════════════

export default function GiftCollectionSection({
  capsuleId,
  isActive,
  accountRole,
  coAdmins,
  onActivate,
}: GiftCollectionSectionProps) {
  if (!isActive) {
    return <GiftCollectionDiscovery onActivate={onActivate} />
  }

  return (
    <GiftManagementUI
      capsuleId={capsuleId}
      accountRole={accountRole}
      coAdmins={coAdmins}
    />
  )
}
