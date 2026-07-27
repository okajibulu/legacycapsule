// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/guests/RSVPDashboard.tsx
// PURPOSE:   RSVP management panel. Send invitations and reminders, configure
//            RSVP options (dietary, additional guests, message, tone), manage
//            private event details (venue, datetime, dress code), set deadline.
// BUILT BY:  AI15 (Claude Opus 4.6) · 26 July 2026
// VERSION:   v2.9.0
// DEPENDS ON:
//   - GET/POST /api/rsvp/config
//   - POST /api/rsvp/invite
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect, useCallback } from 'react'

// ═══ SECTION 1 — Types ═══

interface RSVPDashboardProps {
  capsuleId:    string
  capsuleSlug:  string
  honoureeName: string
  eventTag:     string | null
  counts: {
    confirmed:   number
    declined:    number
    pending:     number
    no_response: number
    total:       number
  }
  onDataChange: () => void
}

interface RsvpConfig {
  show_event_details:      boolean
  allow_additional_guests: boolean
  max_additional_per_guest: number
  show_dietary:            boolean
  allow_rsvp_message:      boolean
  rsvp_tone:               'warm' | 'formal'
  deadline_at:             string | null
  event_venue:             string | null
  event_datetime:          string | null
  event_dress_code:        string | null
}

const DEFAULT_CONFIG: RsvpConfig = {
  show_event_details: true,
  allow_additional_guests: false,
  max_additional_per_guest: 2,
  show_dietary: false,
  allow_rsvp_message: true,
  rsvp_tone: 'warm',
  deadline_at: null,
  event_venue: null,
  event_datetime: null,
  event_dress_code: null,
}

// ═══ SECTION 2 — Design tokens ═══

const gold          = '#E2C36B'
const goldMuted     = 'rgba(226,195,107,0.55)'
const goldFaint     = 'rgba(226,195,107,0.12)'
const textPrimary   = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint     = 'rgba(255,255,255,0.28)'
const cardBg        = 'rgba(255,255,255,0.04)'
const cardBorder    = 'rgba(226,195,107,0.12)'
const greenBg       = 'rgba(74,222,128,0.08)'
const greenText     = 'rgba(134,239,172,0.9)'
const redText       = 'rgba(248,113,113,0.8)'

// ═══ SECTION 3 — Toggle sub-component ═══

function Toggle({
  label, description, checked, onChange, disabled,
}: {
  label:       string
  description: string
  checked:     boolean
  onChange:     (val: boolean) => void
  disabled?:   boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '10px 0',
    }}>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
          border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          background: checked ? 'rgba(226,195,107,0.35)' : 'rgba(255,255,255,0.08)',
          position: 'relative', transition: 'background 0.2s',
          marginTop: '2px',
        }}
      >
        <span style={{
          position: 'absolute', top: '2px',
          left: checked ? '18px' : '2px',
          width: '16px', height: '16px', borderRadius: '8px',
          background: checked ? gold : 'rgba(255,255,255,0.25)',
          transition: 'all 0.2s',
        }} />
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: textPrimary, margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </div>
  )
}

// ═══ SECTION 4 — Main RSVPDashboard component ═══

export default function RSVPDashboard({
  capsuleId, capsuleSlug, honoureeName, eventTag, counts, onDataChange,
}: RSVPDashboardProps) {
  const [config,       setConfig]       = useState<RsvpConfig>(DEFAULT_CONFIG)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [dirty,        setDirty]        = useState(false)
  const [sending,      setSending]      = useState(false)
  const [sendResult,   setSendResult]   = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [reminding,    setReminding]    = useState(false)
  const [remindResult, setRemindResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ── 4.1 Field styles ─────────────────────────────────────────────────────

  const fieldStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid rgba(226,195,107,0.2)`,
    color: textPrimary, fontSize: '13px',
    outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontSize: '9px', color: goldMuted, textTransform: 'uppercase' as const,
    letterSpacing: '0.1em', display: 'block' as const, marginBottom: '5px', fontWeight: 700,
  }

  // ── 4.2 Fetch config ─────────────────────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    try {
      const res  = await fetch(`/api/rsvp/config?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (data.config) {
        setConfig({ ...DEFAULT_CONFIG, ...data.config })
      }
    } catch (err) {
      console.warn('[RSVPDashboard] Failed to fetch config:', err)
    } finally {
      setConfigLoaded(true)
    }
  }, [capsuleId])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  // ── 4.3 Update config field ───────────────────────────────────────────────

  const updateField = <K extends keyof RsvpConfig>(key: K, value: RsvpConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  // ── 4.4 Save config ──────────────────────────────────────────────────────

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/rsvp/config', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ capsule_id: capsuleId, ...config }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setDirty(false)
    } catch (err) {
      console.error('[RSVPDashboard] Save config failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── 4.5 Send invitations ─────────────────────────────────────────────────

  const handleSendInvitations = async () => {
    setSending(true)
    setSendResult(null)
    try {
      const res  = await fetch('/api/rsvp/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: capsuleId,
          mode:       'unsent',  // only guests who haven't been sent yet
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')
      setSendResult({
        type: 'success',
        message: data.sent_count
          ? `${data.sent_count} invitation${data.sent_count !== 1 ? 's' : ''} sent`
          : 'All guests have already been invited',
      })
      onDataChange()
    } catch (err: any) {
      setSendResult({ type: 'error', message: err.message ?? 'Failed to send invitations' })
    } finally {
      setSending(false)
      setTimeout(() => setSendResult(null), 5000)
    }
  }

  // ── 4.6 Send reminders ───────────────────────────────────────────────────

  const handleSendReminders = async () => {
    setReminding(true)
    setRemindResult(null)
    try {
      const res  = await fetch('/api/rsvp/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: capsuleId,
          mode:       'reminder',  // only guests sent but not responded
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')
      setRemindResult({
        type: 'success',
        message: data.sent_count
          ? `${data.sent_count} reminder${data.sent_count !== 1 ? 's' : ''} sent`
          : 'No outstanding RSVPs to remind',
      })
    } catch (err: any) {
      setRemindResult({ type: 'error', message: err.message ?? 'Failed to send reminders' })
    } finally {
      setReminding(false)
      setTimeout(() => setRemindResult(null), 5000)
    }
  }

  // ── 4.7 Computed values ───────────────────────────────────────────────────

  const notYetInvited = counts.no_response  // guests who haven't received an RSVP
  const awaitingReply = counts.pending       // sent but haven't responded
  const deadlinePassed = config.deadline_at
    ? new Date(config.deadline_at) < new Date()
    : false

  // ── 4.8 Loading state ────────────────────────────────────────────────────

  if (!configLoaded) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: textFaint, fontSize: '12px' }}>
        Loading RSVP settings…
      </div>
    )
  }

  // ── 4.9 Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Send Actions ── */}
      <div style={{
        padding: '16px', borderRadius: '14px',
        background: cardBg, border: `1px solid ${cardBorder}`,
      }}>
        <p style={{
          fontSize: '9px', fontWeight: 700, color: goldMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          margin: '0 0 12px',
        }}>
          Send Invitations
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSendInvitations}
            disabled={sending || counts.total === 0}
            style={{
              flex: '1 1 160px', padding: '11px 16px', borderRadius: '10px',
              border: 'none',
              background: counts.total > 0
                ? 'linear-gradient(135deg,#E2C36B,#C8A84A)'
                : 'rgba(255,255,255,0.06)',
              color: counts.total > 0 ? '#1a0845' : textFaint,
              fontSize: '12px', fontWeight: 700,
              cursor: counts.total > 0 ? 'pointer' : 'not-allowed',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Sending…' : `✉ Send RSVP Invitations`}
          </button>

          <button
            onClick={handleSendReminders}
            disabled={reminding || awaitingReply === 0}
            style={{
              flex: '1 1 140px', padding: '11px 16px', borderRadius: '10px',
              border: `1px solid ${awaitingReply > 0 ? 'rgba(226,195,107,0.25)' : 'rgba(255,255,255,0.06)'}`,
              background: 'transparent',
              color: awaitingReply > 0 ? goldMuted : textFaint,
              fontSize: '12px', fontWeight: 600,
              cursor: awaitingReply > 0 ? 'pointer' : 'not-allowed',
              opacity: reminding ? 0.7 : 1,
            }}
          >
            {reminding ? 'Sending…' : `Send Reminders (${awaitingReply})`}
          </button>
        </div>

        {/* ── Send result feedback ── */}
        {sendResult && (
          <p style={{
            fontSize: '11px', fontWeight: 600, margin: '10px 0 0',
            color: sendResult.type === 'success' ? greenText : redText,
          }}>
            {sendResult.type === 'success' ? '✓' : '✗'} {sendResult.message}
          </p>
        )}
        {remindResult && (
          <p style={{
            fontSize: '11px', fontWeight: 600, margin: '10px 0 0',
            color: remindResult.type === 'success' ? greenText : redText,
          }}>
            {remindResult.type === 'success' ? '✓' : '✗'} {remindResult.message}
          </p>
        )}
      </div>

      {/* ── Event Details (private — only shown on RSVP page) ── */}
      <div style={{
        padding: '16px', borderRadius: '14px',
        background: cardBg, border: `1px solid ${cardBorder}`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '12px',
        }}>
          <p style={{
            fontSize: '9px', fontWeight: 700, color: goldMuted,
            textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>
            Event Details (Private)
          </p>
          <p style={{ fontSize: '9px', color: textFaint, margin: 0, fontStyle: 'italic' }}>
            Only shown on RSVP page
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Venue</label>
            <input
              style={fieldStyle}
              placeholder="Event venue name and address"
              value={config.event_venue ?? ''}
              onChange={e => updateField('event_venue', e.target.value || null)}
              maxLength={200}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={labelStyle}>Date & Time</label>
              <input
                style={fieldStyle}
                type="datetime-local"
                value={config.event_datetime ?? ''}
                onChange={e => updateField('event_datetime', e.target.value || null)}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={labelStyle}>Dress Code</label>
              <input
                style={fieldStyle}
                placeholder="e.g. Native formal, Aso-Ebi"
                value={config.event_dress_code ?? ''}
                onChange={e => updateField('event_dress_code', e.target.value || null)}
                maxLength={100}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── RSVP Options ── */}
      <div style={{
        padding: '16px', borderRadius: '14px',
        background: cardBg, border: `1px solid ${cardBorder}`,
      }}>
        <p style={{
          fontSize: '9px', fontWeight: 700, color: goldMuted,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          margin: '0 0 4px',
        }}>
          RSVP Options
        </p>

        <Toggle
          label="Allow additional guests"
          description="Guests can bring plus-ones when they RSVP"
          checked={config.allow_additional_guests}
          onChange={v => updateField('allow_additional_guests', v)}
        />

        {config.allow_additional_guests && (
          <div style={{ paddingLeft: '48px', marginBottom: '8px' }}>
            <label style={labelStyle}>Max additional per guest</label>
            <select
              value={config.max_additional_per_guest}
              onChange={e => updateField('max_additional_per_guest', parseInt(e.target.value))}
              style={{
                ...fieldStyle, width: '80px', cursor: 'pointer',
              }}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        <Toggle
          label="Show dietary requirements"
          description="Ask guests about dietary needs on the RSVP form"
          checked={config.show_dietary}
          onChange={v => updateField('show_dietary', v)}
        />

        <Toggle
          label="Allow RSVP message"
          description="Guests can write a message when they RSVP — confirmed messages become pending tributes"
          checked={config.allow_rsvp_message}
          onChange={v => updateField('allow_rsvp_message', v)}
        />

        <div style={{ padding: '10px 0' }}>
          <label style={labelStyle}>Invitation Tone</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['warm', 'formal'] as const).map(tone => (
              <button
                key={tone}
                onClick={() => updateField('rsvp_tone', tone)}
                style={{
                  padding: '8px 16px', borderRadius: '10px',
                  border: config.rsvp_tone === tone
                    ? `1px solid rgba(226,195,107,0.4)`
                    : '1px solid rgba(255,255,255,0.08)',
                  background: config.rsvp_tone === tone ? goldFaint : 'transparent',
                  color: config.rsvp_tone === tone ? gold : textFaint,
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tone}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '10px', color: textFaint, margin: '6px 0 0' }}>
            {config.rsvp_tone === 'warm'
              ? 'Subject: "You are personally invited — [event]"'
              : 'Subject: "Invitation — [event]"'
            }
          </p>
        </div>

        {/* ── RSVP Deadline ── */}
        <div style={{ padding: '10px 0' }}>
          <label style={labelStyle}>RSVP Deadline</label>
          <input
            style={{ ...fieldStyle, width: '220px' }}
            type="datetime-local"
            value={config.deadline_at ?? ''}
            onChange={e => updateField('deadline_at', e.target.value || null)}
          />
          {deadlinePassed && config.deadline_at && (
            <p style={{ fontSize: '10px', color: redText, margin: '6px 0 0' }}>
              This deadline has passed. Guests can still submit — consider extending it.
            </p>
          )}
        </div>
      </div>

      {/* ── Save button ── */}
      {dirty && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#E2C36B,#C8A84A)',
              color: '#1a0845', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}
