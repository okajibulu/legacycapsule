'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/UsherSessionManager.tsx
// PURPOSE: Usher PIN session management and briefing document generation.
//          Implements ETH-AC-001 v1.1 AMD-001 R10:
//            · PIN session management with copy buttons (existing)
//            · Usher accountability notice at session login
//            · Briefing document generation — event-specific, print-ready
//            · Phase 2A briefing: standard procedure + walk-in section
//            · Gate/companion pass sections added automatically in Phase 2B/2C
// ARCHITECTURE: LC02 Event Services Engine · Access Code System (ETH-AC-001)
// BUILT BY: AI14 (session management), AI14 v2.11 (briefing generation)
// UPDATED: AI14 · Claude Opus 4.6 · 29 July 2026
// VERSION: v2.11.0
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useEffect } from 'react'

interface Session {
  id:         string
  label:      string
  expires_at: string
  is_active:  boolean
  created_at: string
}

interface Props {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  eventTag:     string | null
  eventDate:    string | null
}

// ═══ SECTION 2 — Design tokens ═══

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const cardBg       = 'rgba(255,255,255,0.04)'
const cardBorder   = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textFaint    = 'rgba(255,255,255,0.28)'
const successColor = 'rgba(134,239,172,0.8)'

const inputStyle: React.CSSProperties = {
  fontSize: '13px', padding: '10px 14px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

// ═══ SECTION 3 — CopyButton sub-component ═══

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'; ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}`}
      style={{
        fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
        border: `1px solid ${copied ? 'rgba(134,239,172,0.3)' : cardBorder}`,
        background: copied ? 'rgba(134,239,172,0.06)' : 'transparent',
        color: copied ? successColor : goldMuted,
        cursor: 'pointer', whiteSpace: 'nowrap' as const,
        transition: 'all 0.2s', flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied' : `Copy ${label}`}
    </button>
  )
}

// ═══ SECTION 4 — Usher briefing HTML builder ═══
//
// Per ETH-AC-001 AMD-001 R10: event-specific, print-ready briefing.
// Phase 2A includes: standard procedure, colour guide, manual fallback,
// walk-in procedure, accountability notice.
// Gate and companion pass sections added in Phase 2B/2C.

function buildBriefingHtml(params: {
  eventLabel:    string
  honoureeName:  string
  eventDate:     string | null
  usherLabel:    string
  checkinUrl:    string
  coordinatorName: string
  coordinatorPhone: string
}): string {
  const {
    eventLabel, honoureeName, eventDate,
    usherLabel, checkinUrl, coordinatorName, coordinatorPhone,
  } = params

  const dateDisplay = eventDate
    ? new Date(eventDate).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'See event programme'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Usher Briefing — ${eventLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .page {
      width: 210mm;
      min-height: 148mm;
      padding: 12mm 14mm;
      page-break-after: always;
    }
    .header {
      background: #1a0d3a;
      color: white;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .header h1 { font-size: 14px; margin-bottom: 3px; }
    .header p  { font-size: 10px; color: rgba(226,195,107,0.8); }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .box {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 8px 10px;
    }
    .box-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-bottom: 3px;
    }
    .box-value {
      font-size: 13px;
      font-weight: 700;
      color: #111;
    }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #555;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
      margin: 10px 0 7px;
    }
    .step {
      display: flex;
      gap: 8px;
      margin-bottom: 5px;
      align-items: flex-start;
    }
    .step-num {
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #1a0d3a;
      color: white;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-text { font-size: 11px; line-height: 1.5; }
    .colour-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .colour-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #eee;
      font-size: 10px;
      vertical-align: middle;
    }
    .colour-dot {
      width: 14px; height: 14px; border-radius: 50%;
      display: inline-block; margin-right: 6px;
      vertical-align: middle;
    }
    .notice {
      background: #fff8e6;
      border: 1px solid #f5c842;
      border-radius: 5px;
      padding: 8px 10px;
      margin-top: 10px;
      font-size: 10px;
      line-height: 1.6;
    }
    .footer {
      margin-top: 10px;
      font-size: 9px;
      color: #999;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 6px;
    }
    @media print {
      .page { padding: 10mm 12mm; }
    }
  </style>
</head>
<body>

<!-- ═══ PAGE ONE ═══ -->
<div class="page">

  <div class="header">
    <h1>USHER BRIEFING</h1>
    <p>${eventLabel} &nbsp;·&nbsp; ${honoureeName} &nbsp;·&nbsp; ${dateDisplay}</p>
  </div>

  <div class="grid-2">
    <div class="box">
      <div class="box-label">Your Position</div>
      <div class="box-value">${usherLabel}</div>
    </div>
    <div class="box">
      <div class="box-label">Event Coordinator</div>
      <div class="box-value" style="font-size:11px;">${coordinatorName}</div>
      <div style="font-size:10px;color:#666;margin-top:2px;">${coordinatorPhone}</div>
    </div>
  </div>

  <div class="section-title">Standard Entry Procedure</div>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-text">Open the check-in page on your device and enter your PIN to begin your session.</div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-text">Tap <strong>SCAN</strong> and point your camera at the guest's QR code. The QR code is the large square on their access card or phone screen.</div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-text">Read the result on your screen — see the colour guide below. Greet the guest warmly and direct them to their table or section.</div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-text">If a guest does not have their card or phone, use the manual fallback — see below.</div>
  </div>

  <div class="section-title">What the Colours Mean</div>

  <table class="colour-table">
    <tr>
      <td><span class="colour-dot" style="background:#22c55e;"></span><strong>GREEN — WELCOME</strong></td>
      <td>Guest is valid. Admit immediately. Show them their table from the result screen.</td>
    </tr>
    <tr>
      <td><span class="colour-dot" style="background:#E2C36B;"></span><strong>GOLD — VVIP ARRIVAL</strong></td>
      <td>Admit the guest and <strong>immediately notify the coordinator</strong>. Do not delay the guest.</td>
    </tr>
    <tr>
      <td><span class="colour-dot" style="background:#f59e0b;"></span><strong>AMBER — ALREADY CHECKED IN</strong></td>
      <td>Ask to see the guest's card. If genuine re-entry, tap Override and select a reason. If suspicious, contact the coordinator.</td>
    </tr>
    <tr>
      <td><span class="colour-dot" style="background:#ef4444;"></span><strong>RED — NOT RECOGNISED</strong></td>
      <td>Do <strong>not</strong> admit. Direct the guest politely to the coordinator's table. Do not argue or explain.</td>
    </tr>
  </table>

  <div class="section-title">When the Scanner Fails</div>

  <div class="step">
    <div class="step-num">A</div>
    <div class="step-text"><strong>Serial number:</strong> Ask the guest for their card serial number (4 digits, marked S/N on their card, or communicated to them before the event). Type it in the search box.</div>
  </div>
  <div class="step">
    <div class="step-num">B</div>
    <div class="step-text"><strong>Name search:</strong> Type the guest's name in the search box and select the correct person from the list.</div>
  </div>
  <div class="step">
    <div class="step-num">C</div>
    <div class="step-text"><strong>Paper list:</strong> If the device is not working, use the printed guest arrival list. Tick the guest's name and write the arrival time.</div>
  </div>

  <div class="notice">
    <strong>⚠ ACCOUNTABILITY NOTICE</strong><br/>
    Every action you take is recorded against your name and usher PIN.
    You are personally responsible for every admission made from your device during this session.
    If you are unsure about any guest, contact the coordinator — do not admit and ask questions later.
  </div>

  <div class="footer">
    Page 1 of 2 &nbsp;·&nbsp; ${eventLabel} &nbsp;·&nbsp; LegacyCapsule · EventToolsHub
  </div>

</div>

<!-- ═══ PAGE TWO ═══ -->
<div class="page">

  <div class="header">
    <h1>USHER BRIEFING — SPECIAL PROCEDURES</h1>
    <p>${eventLabel} &nbsp;·&nbsp; ${honoureeName}</p>
  </div>

  <div class="section-title">Walk-In Registration</div>

  <p style="font-size:11px;line-height:1.6;margin-bottom:8px;">
    A walk-in is a guest who arrives without prior registration — they were not on the original guest list.
    Do <strong>not</strong> turn walk-ins away before checking with the coordinator.
  </p>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-text">Hold the guest at the gate and contact the coordinator immediately.</div>
  </div>
  <div class="step">
    <div class="step-num">2</div>
    <div class="step-text">If the coordinator approves, tap <strong>WALK-IN</strong> on your device. Enter the guest's name and tier.</div>
  </div>
  <div class="step">
    <div class="step-num">3</div>
    <div class="step-text">The system generates an instant code. The guest is admitted and the organiser is notified.</div>
  </div>
  <div class="step">
    <div class="step-num">4</div>
    <div class="step-text">If using the paper list, record the walk-in in the Walk-In section at the bottom of the page.</div>
  </div>

  <div class="section-title">Check-In Page & Your PIN</div>

  <div class="box" style="margin-bottom:10px;">
    <div class="box-label">Check-in page URL</div>
    <div style="font-family:monospace;font-size:10px;color:#333;margin-top:3px;word-break:break-all;">${checkinUrl}</div>
  </div>

  <p style="font-size:10px;color:#666;line-height:1.5;margin-bottom:10px;">
    Your PIN was given to you by the event coordinator before this briefing.
    Enter it at the check-in page to begin your session.
    If you have not received your PIN, ask the coordinator now — before the event begins.
  </p>

  <div class="section-title">Important Reminders</div>

  <div style="font-size:11px;line-height:1.8;">
    <p>• <strong>Never leave your device unattended</strong> while your session is active.</p>
    <p>• <strong>Never share your PIN</strong> with another person.</p>
    <p>• <strong>Do not admit guests you cannot verify</strong> — redirect to coordinator.</p>
    <p>• <strong>Do not argue with guests</strong> — stay calm, stay professional, call the coordinator.</p>
    <p>• <strong>All overrides are logged</strong> — only use override when you have a genuine reason.</p>
    <p>• <strong>Treat every VVIP arrival</strong> as a priority — notify the coordinator immediately.</p>
  </div>

  <div class="notice" style="margin-top:12px;">
    <strong>COORDINATOR CONTACT</strong><br/>
    ${coordinatorName} &nbsp;·&nbsp; ${coordinatorPhone}<br/>
    Contact the coordinator for: walk-in approval · VVIP arrival · unresolvable disputes · any concern
  </div>

  <div class="footer" style="margin-top:16px;">
    Page 2 of 2 &nbsp;·&nbsp; ${eventLabel} &nbsp;·&nbsp; Confidential — For Usher Use Only
  </div>

</div>

</body>
</html>`
}

// ═══ SECTION 5 — Main component ═══

export function UsherSessionManager({
  capsuleId, capsuleSlug, honoureeName, eventTag, eventDate,
}: Props) {

  // ── 5.1 State ──────────────────────────────────────────────────────────────

  const [sessions,          setSessions]          = useState<Session[]>([])
  const [label,             setLabel]             = useState('')
  const [hours,             setHours]             = useState('12')
  const [newPin,            setNewPin]            = useState<string | null>(null)
  const [creating,          setCreating]          = useState(false)
  const [loading,           setLoading]           = useState(true)
  const [coordinatorName,   setCoordinatorName]   = useState('')
  const [coordinatorPhone,  setCoordinatorPhone]  = useState('')
  const [showBriefingSetup, setShowBriefingSetup] = useState(false)

  const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
  const checkinUrl = `${APP_URL}/manage/${capsuleSlug}/checkin`
  const eventLabel = eventTag ?? honoureeName

  // ── 5.2 Fetch sessions ─────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/usher/session?capsule_id=${capsuleId}`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [capsuleId])

  // ── 5.3 Create session ─────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!label.trim()) return
    setCreating(true); setNewPin(null)
    try {
      const res  = await fetch('/api/usher/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:    capsuleId,
          label:         label.trim(),
          expires_hours: Number(hours),
        }),
      })
      const data = await res.json()
      if (res.ok && data.pin) {
        setNewPin(data.pin)
        setSessions(prev => [data.session, ...prev])
        setLabel('')
      }
    } catch {}
    setCreating(false)
  }

  // ── 5.4 Deactivate session ─────────────────────────────────────────────────

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this usher session? The usher will be logged out immediately.')) return
    try {
      await fetch(`/api/usher/session?id=${id}`, { method: 'DELETE' })
      setSessions(prev => prev.map(s => s.id === id ? { ...s, is_active: false } : s))
    } catch {}
  }

  // ── 5.5 Generate briefing ──────────────────────────────────────────────────

  const handleGenerateBriefing = (session: Session) => {
    const html = buildBriefingHtml({
      eventLabel,
      honoureeName,
      eventDate:       eventDate ?? null,
      usherLabel:      session.label,
      checkinUrl,
      coordinatorName:  coordinatorName.trim() || 'Event Coordinator',
      coordinatorPhone: coordinatorPhone.trim() || 'See organiser',
    })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.print() }, 600)
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  const activeSessions = sessions.filter(s =>
    s.is_active && new Date(s.expires_at) > new Date()
  )

  // ═══ SECTION 6 — Render ═══

  return (
    <div>

      {/* ── 6.1 How it works ──────────────────────────────────────────────── */}

      <div style={{
        padding: '12px 14px', borderRadius: '10px',
        background: 'rgba(226,195,107,0.03)',
        border: '1px solid rgba(226,195,107,0.08)',
        marginBottom: '16px',
      }}>
        <p style={{
          fontSize: '10px', color: goldMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em', margin: '0 0 6px', fontWeight: 600,
        }}>
          How usher check-in works
        </p>
        <div style={{ fontSize: '11px', color: textFaint, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 4px' }}><strong style={{ color: goldMuted }}>1.</strong> Generate a PIN below and give it to your usher</p>
          <p style={{ margin: '0 0 4px' }}><strong style={{ color: goldMuted }}>2.</strong> Share the check-in page link with them</p>
          <p style={{ margin: '0 0 4px' }}><strong style={{ color: goldMuted }}>3.</strong> Print the usher briefing document — present it at the pre-event briefing</p>
          <p style={{ margin: 0 }}><strong style={{ color: goldMuted }}>4.</strong> Usher opens the link, enters PIN, and scans guest QR codes at the door</p>
        </div>
      </div>

      {/* ── 6.2 Check-in URL ─────────────────────────────────────────────── */}

      <div style={{
        padding: '10px 14px', borderRadius: '10px',
        border: '1px solid rgba(226,195,107,0.15)',
        background: 'rgba(226,195,107,0.04)',
        marginBottom: '14px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '9px', color: goldMuted,
            textTransform: 'uppercase' as const, letterSpacing: '0.1em',
            margin: '0 0 4px',
          }}>
            Check-in page URL
          </p>
          <p style={{
            fontSize: '11px', color: gold,
            fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' as const,
          }}>
            {checkinUrl}
          </p>
        </div>
        <CopyButton text={checkinUrl} label="URL" />
      </div>

      {/* ── 6.3 New PIN display ───────────────────────────────────────────── */}

      {newPin && (
        <div style={{
          padding: '18px 14px', borderRadius: '12px',
          border: '1px solid rgba(74,222,128,0.3)',
          background: 'rgba(74,222,128,0.06)',
          marginBottom: '14px', textAlign: 'center' as const,
        }}>
          <p style={{
            fontSize: '10px', color: 'rgba(134,239,172,0.7)',
            textTransform: 'uppercase' as const, letterSpacing: '0.12em',
            margin: '0 0 8px',
          }}>
            Share this PIN with your usher — shown once only
          </p>
          <p style={{
            fontSize: '40px', fontWeight: 800,
            color: 'rgba(134,239,172,0.95)',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '0.4em', margin: '0 0 10px',
          }}>
            {newPin}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <CopyButton text={newPin} label="PIN" />
            <CopyButton text={`Check-in PIN: ${newPin}\nPage: ${checkinUrl}`} label="PIN + URL" />
          </div>
          <p style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.25)',
            margin: '10px 0 0', lineHeight: 1.5,
          }}>
            After leaving this screen, this PIN cannot be retrieved.
            Generate a new one if needed.
          </p>
        </div>
      )}

      {/* ── 6.4 Create session ────────────────────────────────────────────── */}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input
          style={{ ...inputStyle, flex: 2 }}
          placeholder="Usher label (e.g. Main Gate, Side Entrance)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && label.trim()) handleCreate() }}
          maxLength={40}
        />
        <select
          style={{ ...inputStyle, flex: 1 }}
          value={hours}
          onChange={e => setHours(e.target.value)}
        >
          <option value="4">4 hrs</option>
          <option value="6">6 hrs</option>
          <option value="8">8 hrs</option>
          <option value="12">12 hrs</option>
          <option value="24">24 hrs</option>
        </select>
        <button
          onClick={handleCreate}
          disabled={creating || !label.trim()}
          style={{
            padding: '10px 16px', borderRadius: '10px', border: 'none',
            background: !label.trim()
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
            color: !label.trim() ? textFaint : '#1a0845',
            fontSize: '12px', fontWeight: 700,
            cursor: !label.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0, opacity: creating ? 0.7 : 1,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {creating ? '…' : 'Generate PIN'}
        </button>
      </div>

      {/* ── 6.5 Briefing document generator ──────────────────────────────── */}

      <div style={{
        padding: '14px', borderRadius: '12px',
        border: `1px solid ${cardBorder}`, background: cardBg,
        marginBottom: '14px',
      }}>
        <button
          onClick={() => setShowBriefingSetup(o => !o)}
          style={{
            width: '100%', background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: 0,
          }}
        >
          <div>
            <p style={{
              fontSize: '10px', color: goldMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em', margin: 0, fontWeight: 600,
            }}>
              📋 Usher Briefing Document
            </p>
            <p style={{ fontSize: '11px', color: textFaint, margin: '3px 0 0' }}>
              Generate a print-ready briefing for your usher team
            </p>
          </div>
          <span style={{ color: textFaint, fontSize: '12px' }}>
            {showBriefingSetup ? '▲' : '▼'}
          </span>
        </button>

        {showBriefingSetup && (
          <div style={{ marginTop: '14px' }}>
            <p style={{
              fontSize: '11px', color: textFaint,
              lineHeight: 1.65, margin: '0 0 12px',
            }}>
              The briefing document is event-specific — it includes your event name,
              coordinator contacts, standard entry procedure, colour guide, manual fallback,
              and walk-in procedure. Print one copy per usher position.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: '10px', color: textFaint,
                  display: 'block', marginBottom: '4px',
                }}>
                  Coordinator Name
                </label>
                <input
                  style={inputStyle}
                  placeholder="Name guests can be referred to"
                  value={coordinatorName}
                  onChange={e => setCoordinatorName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  fontSize: '10px', color: textFaint,
                  display: 'block', marginBottom: '4px',
                }}>
                  Coordinator Phone
                </label>
                <input
                  type="tel"
                  style={inputStyle}
                  placeholder="+234..."
                  value={coordinatorPhone}
                  onChange={e => setCoordinatorPhone(e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>

            {sessions.filter(s => s.is_active && new Date(s.expires_at) > new Date()).length === 0 ? (
              <p style={{ fontSize: '11px', color: textFaint, fontStyle: 'italic' }}>
                Create usher sessions above — each session gets its own personalised briefing document.
              </p>
            ) : (
              <div>
                <p style={{
                  fontSize: '10px', color: goldMuted,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 600,
                }}>
                  Generate briefing for:
                </p>
                <div style={{
                  display: 'flex', flexDirection: 'column' as const, gap: '6px',
                }}>
                  {sessions
                    .filter(s => s.is_active && new Date(s.expires_at) > new Date())
                    .map(session => (
                      <div key={session.id} style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '10px',
                        padding: '8px 12px', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                      }}>
                        <span style={{ fontSize: '13px', color: textPrimary, fontWeight: 600 }}>
                          {session.label}
                        </span>
                        <button
                          onClick={() => handleGenerateBriefing(session)}
                          style={{
                            padding: '6px 14px', borderRadius: '8px',
                            border: `1px solid rgba(226,195,107,0.3)`,
                            background: 'rgba(226,195,107,0.08)',
                            color: goldMuted, fontSize: '11px',
                            fontWeight: 600, cursor: 'pointer',
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          Print Briefing →
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 6.6 Session list ──────────────────────────────────────────────── */}

      {!loading && sessions.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '10px',
          }}>
            <p style={{
              fontSize: '10px', color: goldMuted,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em', margin: 0,
            }}>
              Usher Sessions
            </p>
            {activeSessions.length > 0 && (
              <span style={{
                fontSize: '9px', padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(134,239,172,0.08)',
                border: '1px solid rgba(134,239,172,0.2)',
                color: successColor, fontWeight: 700,
              }}>
                {activeSessions.length} active
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            {sessions.map(s => {
              const expired  = new Date(s.expires_at) < new Date()
              const isActive = s.is_active && !expired

              return (
                <div key={s.id} style={{
                  padding: '10px 14px', borderRadius: '10px',
                  border: `1px solid ${isActive ? cardBorder : 'rgba(255,255,255,0.04)'}`,
                  background: cardBg,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  opacity: isActive ? 1 : 0.45,
                }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: isActive
                      ? 'rgba(134,239,172,0.8)'
                      : expired
                      ? 'rgba(248,113,113,0.5)'
                      : 'rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 2px', fontSize: '13px',
                      fontWeight: 600, color: textPrimary,
                    }}>
                      {s.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: textFaint }}>
                      {isActive
                        ? `Active — expires ${new Date(s.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                        : expired ? 'Expired' : 'Deactivated'}
                    </p>
                  </div>
                  {isActive && (
                    <button
                      onClick={() => handleDeactivate(s.id)}
                      style={{
                        fontSize: '10px', padding: '4px 10px', borderRadius: '6px',
                        border: '1px solid rgba(248,113,113,0.2)',
                        background: 'transparent',
                        color: 'rgba(248,113,113,0.55)',
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── 6.7 Empty state ───────────────────────────────────────────────── */}

      {!loading && sessions.length === 0 && (
        <div style={{
          padding: '20px', textAlign: 'center' as const,
          borderRadius: '10px',
          border: '1px dashed rgba(226,195,107,0.12)',
        }}>
          <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
            No usher sessions yet. Generate a PIN above to get started.
          </p>
        </div>
      )}
    </div>
  )
}
