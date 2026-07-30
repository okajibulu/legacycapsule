'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/AccessCodeModule.tsx
// PURPOSE: Orchestrator for the Access Code System module.
//          Provides tabbed navigation: Setup · Codes · Ushers · Live Metrics.
//          Each tab has a contextual tip explaining its function.
//          Tabs beyond Setup are locked until hall configuration is saved.
//          Renders existing sub-components in Phase 1; each is rebuilt to
//          premium standard in subsequent phases.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect }       from 'react'
import { useRouter }                  from 'next/navigation'
import AccessCodeSetup               from '@/components/manage/access-codes/AccessCodeSetup'
import SectionManager                from '@/components/manage/access-codes/SectionManager'
import GuestCodeList                 from '@/components/manage/access-codes/GuestCodeList'
import { UsherSessionManager }       from '@/components/manage/access-codes/UsherSessionManager'
import BulkGuestImport               from '@/components/manage/access-codes/BulkGuestImport'
import { AccessMetricsDashboard }    from '@/components/manage/access-codes/AccessMetricsDashboard'

interface Props {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  eventTag:     string | null
  eventDate:    string | null
  guestCount:   number
  onBack:       () => void
}

type ModuleTab = 'setup' | 'codes' | 'ushers' | 'metrics'

// ═══ SECTION 2 — Design tokens ═══

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.12)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'

// ═══ SECTION 3 — Tab definitions with contextual tips ═══
//
// Each tab tip is written from the organiser's perspective.
// Tips answer: "What is this tab for? What should I do here?"
// Dismissable per session via local state (not localStorage — re-show on
// next visit so new organisers always see guidance on first encounter).

const TABS: { key: ModuleTab; label: string; icon: string; tip: string }[] = [
  {
    key:   'setup',
    label: 'Setup',
    icon:  '⚙',
    tip:   'Configure your venue layout — how tables or sections are arranged, '
         + 'entry rules, and when check-in opens. Save this before generating codes.',
  },
  {
    key:   'codes',
    label: 'Codes',
    icon:  '🎫',
    tip:   'Generate a unique entry code for each guest. '
         + 'Send codes by email, print physical access cards, or both. '
         + 'You can regenerate at any time — but guests who already received a code will need a new one.',
  },
  {
    key:   'ushers',
    label: 'Ushers',
    icon:  '🚪',
    tip:   'Create PIN-protected sessions for your ushers. '
         + 'On event day, each usher opens the check-in screen on their phone, '
         + 'enters their PIN, and scans guest codes at the door.',
  },
  {
    key:   'metrics',
    label: 'Live',
    icon:  '📊',
    tip:   'Your real-time arrivals dashboard. '
         + 'See who has checked in, which VVIPs are still outstanding, '
         + 'and how your venue is filling — updated every 15 seconds on event day.',
  },
]


// ═══ SECTION 3B — CodesTabContent sub-component ═══
//
// Handles the Codes tab: generate panel (when no codes) or code list (when codes exist).
// Keeps generation logic contained so the orchestrator stays clean.

function CodesTabContent({ capsuleId, capsuleSlug, honoureeName, eventTag, guestCount, codesExist, onCodesGenerated }: {
  capsuleId:        string
  capsuleSlug:      string
  honoureeName:     string
  eventTag:         string | null
  guestCount:       number
  codesExist:       boolean
  onCodesGenerated: (count: number) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [genMsg,     setGenMsg]     = useState('')
  const [genError,   setGenError]   = useState('')

  const handleGenerate = async () => {
    setGenerating(true); setGenMsg(''); setGenError('')
    try {
      const res = await fetch('/api/access-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsuleId, scope: 'all' }),
      })
      const data = await res.json()
      // Handle regeneration warning (409) — codes already sent to guests
      if (res.status === 409 && data.warning) {
        setGenError(data.error)
        // Store warning state so a second button press sends confirm_regenerate: true
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setGenMsg(`${data.generated} access codes generated successfully.${data.errors > 0 ? ` ${data.errors} could not be created.` : ''}`)
      onCodesGenerated(data.generated)
    } catch (e: any) {
      setGenError(e.message || 'Something went wrong during code generation.')
    }
    setGenerating(false)
  }

  if (codesExist) {
    return (
      <GuestCodeList
        capsuleId={capsuleId}
        capsuleSlug={capsuleSlug}
        honoureeName={honoureeName}
        eventTag={eventTag}
        onCodesGenerated={onCodesGenerated}
      />
    )
  }

  return (
    <div style={{
      padding: '28px 20px', textAlign: 'center' as const,
      borderRadius: '12px',
      border: '1px dashed rgba(226,195,107,0.15)',
    }}>
      <p style={{ fontSize: '28px', marginBottom: '10px' }}>🎫</p>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px' }}>
        Generate entry codes
      </p>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', margin: '0 0 20px', lineHeight: 1.65, maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}>
        {guestCount > 0
          ? `Create a unique entry code for each of your ${guestCount} guests. Codes can be sent by email or printed as access cards.`
          : 'You need to add guests before generating codes. If Guest Management is active, add guests there first.'}
      </p>

      {genMsg && <p style={{ fontSize: '12px', color: 'rgba(134,239,172,0.8)', marginBottom: '12px' }}>{genMsg}</p>}
      {genError && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '12px' }}>{genError}</p>}

      {guestCount > 0 && !genMsg && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '12px 32px', borderRadius: '10px', border: 'none',
            background: generating ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
            color: generating ? 'rgba(255,255,255,0.28)' : '#1a0845',
            fontSize: '13px', fontWeight: 700,
            cursor: generating ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          {generating ? 'Generating…' : `Generate ${guestCount} Codes`}
        </button>
      )}
    </div>
  )
}


// ═══ SECTION 4 — Component ═══

export default function AccessCodeModule({
  capsuleId, capsuleSlug, honoureeName, eventTag, eventDate, guestCount, onBack,
}: Props) {

  // ── State ──────────────────────────────────────────────────────────────────

  const [activeTab,      setActiveTab]      = useState<ModuleTab>('setup')
  const [isConfigured,   setIsConfigured]   = useState(false)
  const [codesExist,     setCodesExist]     = useState(false)
  const [codeCount,      setCodeCount]      = useState(0)
  const [configLoading,  setConfigLoading]  = useState(true)
  const [tipDismissed,   setTipDismissed]   = useState<Record<string, boolean>>({})
  const [configVersion,  setConfigVersion]  = useState(0)
  const router = useRouter()

  // ── Check configuration and code status on mount ───────────────────────────

  useEffect(() => {
    let cancelled = false

    const checkStatus = async () => {
      try {
        // Check if hall config exists
        const configRes  = await fetch(`/api/access-codes/config?capsule_id=${capsuleId}`)
        const configData = await configRes.json()
        if (!cancelled && configData.config?.id) {
          setIsConfigured(true)
        }

        // Check if any codes have been generated
        const codesRes  = await fetch(`/api/access-codes/list?capsule_id=${capsuleId}`)
        const codesData = await codesRes.json()
        if (!cancelled && codesData.codes?.length > 0) {
          setCodesExist(true)
          setCodeCount(codesData.codes.length)
        }
      } catch {
        // Silently handle — tabs will show appropriate empty states
      }
      if (!cancelled) setConfigLoading(false)
    }

    checkStatus()
    return () => { cancelled = true }
  }, [capsuleId])

  // ── Tab navigation helpers ─────────────────────────────────────────────────

  const isTabLocked = (key: ModuleTab): boolean => {
    if (key === 'setup') return false
    return !isConfigured
  }

  const handleTabChange = (key: ModuleTab) => {
    if (!isTabLocked(key)) setActiveTab(key)
  }

  const dismissTip = () => {
    setTipDismissed(prev => ({ ...prev, [activeTab]: true }))
  }

  const currentTab = TABS.find(t => t.key === activeTab)!

  // ── Days until event ───────────────────────────────────────────────────────

  const daysToEvent = eventDate
    ? Math.max(0, Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86_400_000))
    : null

  // ═══ SECTION 5 — Render ═══

  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto',
      padding: '0 16px 100px',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── 5.1 Header ────────────────────────────────────────────────────── */}

      <div style={{
        padding: '16px 0 14px',
        display: 'flex', alignItems: 'center', gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        marginBottom: '16px',
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          aria-label="Back to dashboard"
          style={{
            background: 'none', border: 'none',
            color: goldMuted, fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', padding: '6px 10px', borderRadius: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(226,195,107,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          ←
        </button>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '9px', color: goldMuted,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            margin: 0, fontWeight: 600,
          }}>
            Access Code System
          </p>
          <p style={{
            fontSize: '16px', fontWeight: 700, color: textPrimary,
            margin: '2px 0 0',
            fontFamily: "'Playfair Display', serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {honoureeName}
          </p>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {guestCount > 0 && (
            <div style={{
              padding: '5px 10px', borderRadius: '8px',
              background: goldFaint, border: `1px solid ${cardBorder}`,
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: gold }}>{guestCount}</span>
              <span style={{
                fontSize: '8px', color: textFaint,
                display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em',
                marginTop: '1px',
              }}>
                guests
              </span>
            </div>
          )}
          {daysToEvent !== null && (
            <div style={{
              padding: '5px 10px', borderRadius: '8px',
              background: daysToEvent <= 7 ? 'rgba(248,191,113,0.06)' : cardBg,
              border: `1px solid ${daysToEvent <= 7 ? 'rgba(248,191,113,0.2)' : 'rgba(255,255,255,0.05)'}`,
              textAlign: 'center',
            }}>
              <span style={{
                fontSize: '13px', fontWeight: 800,
                color: daysToEvent <= 7 ? 'rgba(248,191,113,0.9)' : textPrimary,
              }}>
                {daysToEvent}
              </span>
              <span style={{
                fontSize: '8px', color: textFaint,
                display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em',
                marginTop: '1px',
              }}>
                {daysToEvent === 1 ? 'day left' : 'days left'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 5.2 Tab navigation ────────────────────────────────────────────── */}

      <div style={{
        display: 'flex', gap: '4px', marginBottom: '8px',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const locked   = isTabLocked(tab.key)

          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              disabled={locked}
              aria-label={locked ? `${tab.label} — complete setup first` : tab.label}
              style={{
                flex: 1,
                padding: '10px 4px 8px',
                borderRadius: '10px',
                border: `1px solid ${
                  isActive ? 'rgba(226,195,107,0.45)'
                  : locked ? 'rgba(255,255,255,0.03)'
                  : 'rgba(255,255,255,0.06)'
                }`,
                background: isActive ? goldFaint : 'transparent',
                color: isActive ? gold : locked ? 'rgba(255,255,255,0.15)' : textFaint,
                cursor: locked ? 'not-allowed' : 'pointer',
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.04em',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '3px',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>
                {locked ? '🔒' : tab.icon}
              </span>
              <span>{tab.label}</span>

              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: '3px',
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: gold,
                }} />
              )}

              {/* Code count badge on Codes tab */}
              {tab.key === 'codes' && codesExist && !locked && (
                <span style={{
                  position: 'absolute', top: '4px', right: '12px',
                  fontSize: '8px', fontWeight: 800,
                  padding: '1px 5px', borderRadius: '6px',
                  background: 'rgba(226,195,107,0.15)',
                  color: gold,
                }}>
                  {codeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── 5.3 Contextual tip bar ────────────────────────────────────────── */}

      {!tipDismissed[activeTab] && !configLoading && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(226,195,107,0.03)',
          border: '1px solid rgba(226,195,107,0.08)',
          marginBottom: '16px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <span style={{
            fontSize: '13px', color: goldMuted,
            flexShrink: 0, marginTop: '1px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: 'rgba(226,195,107,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
          }}>
            i
          </span>
          <p style={{
            fontSize: '11px', color: textFaint,
            margin: 0, lineHeight: 1.7, flex: 1,
          }}>
            {currentTab.tip}
          </p>
          <button
            onClick={dismissTip}
            aria-label="Dismiss tip"
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.12)', fontSize: '14px',
              cursor: 'pointer', flexShrink: 0,
              padding: '0 4px', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── 5.4 Config loading state ──────────────────────────────────────── */}

      {configLoading && (
        <div style={{
          padding: '40px 0', textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: textFaint }}>
            Checking your configuration…
          </p>
        </div>
      )}

      {/* ── 5.5 Tab content ───────────────────────────────────────────────── */}

      {!configLoading && (
        <>
          {/* ── SETUP TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'setup' && (
            <div>
              <AccessCodeSetup
                capsuleId={capsuleId}
                guestCount={guestCount}
                eventDate={eventDate}
                onActivated={() => {
                  setIsConfigured(true)
                  setConfigVersion(v => v + 1)
                  setActiveTab('codes')
                }}
              />

              {/* Guest count notice */}
              {guestCount === 0 && (
                <div style={{
                  marginTop: '16px', padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(248,191,113,0.2)',
                  background: 'rgba(248,191,113,0.04)',
                }}>
                  <p style={{
                    fontSize: '12px', color: 'rgba(248,191,113,0.8)',
                    margin: 0, lineHeight: 1.7,
                  }}>
                    <strong>No guests yet.</strong> You will need to add guests
                    before generating access codes. If Guest Management is
                    activated, add guests there first — they will appear here
                    automatically.
                  </p>
                </div>
              )}

              {/* Section/table/zone manager — appears after config is saved */}
              {isConfigured && (
                <div style={{ marginTop: '20px' }}>
                  <SectionManager capsuleId={capsuleId} key={configVersion} />
                </div>
              )}

              {/* Bulk guest import — always available in Setup tab */}
              <div style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <BulkGuestImport
                  capsuleId={capsuleId}
                  onImported={(count) => {
                    // Refresh guest count badge in header
                    window.location.reload()
                  }}
                />
              </div>
            </div>
          )}

          {/* ── CODES TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'codes' && isConfigured && (
            <div>
              <CodesTabContent
                capsuleId={capsuleId}
                capsuleSlug={capsuleSlug}
                honoureeName={honoureeName}
                eventTag={eventTag}
                guestCount={guestCount}
                codesExist={codesExist}
                onCodesGenerated={(count: number) => {
                  setCodesExist(true)
                  setCodeCount(count)
                }}
              />
            {/* Print cards link — shown when codes exist */}
            {codesExist && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => router.push(`/manage/${capsuleSlug}/access/cards/print`)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(226,195,107,0.2)',
                    background: 'rgba(226,195,107,0.04)',
                    color: 'rgba(226,195,107,0.7)', fontSize: '12px',
                    fontWeight: 600, cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  🖨 Print Access Cards
                </button>
              </div>
            )}
            </div>
          )}

          {/* ── USHERS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'ushers' && isConfigured && (
            <UsherSessionManager
              capsuleId={capsuleId}
              capsuleSlug={capsuleSlug}
              honoureeName={honoureeName}
              eventTag={eventTag}
              eventDate={eventDate}
            />
          )}

          {/* ── LIVE METRICS TAB ──────────────────────────────────────────── */}
          {activeTab === 'metrics' && isConfigured && (
            <AccessMetricsDashboard capsuleId={capsuleId} />
          )}

          {/* ── LOCKED TAB MESSAGE ────────────────────────────────────────── */}
          {activeTab !== 'setup' && !isConfigured && (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              borderRadius: '12px',
              border: '1px dashed rgba(226,195,107,0.12)',
            }}>
              <p style={{
                fontSize: '22px', marginBottom: '8px',
              }}>
                🔒
              </p>
              <p style={{
                fontSize: '13px', fontWeight: 600,
                color: textPrimary, margin: '0 0 6px',
              }}>
                Set up your venue first
              </p>
              <p style={{
                fontSize: '11px', color: textFaint,
                margin: '0 0 16px', lineHeight: 1.65,
                maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto',
              }}>
                Configure your hall layout and check-in rules before
                generating codes or setting up ushers.
              </p>
              <button
                onClick={() => setActiveTab('setup')}
                style={{
                  padding: '9px 22px', borderRadius: '9px',
                  border: `1px solid rgba(226,195,107,0.3)`,
                  background: 'rgba(226,195,107,0.08)',
                  color: gold, fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.04em',
                }}
              >
                Go to Setup
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
