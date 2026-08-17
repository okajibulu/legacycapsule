'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/OrganizerUpgradePanel.tsx
// PURPOSE:   Allows the organiser to upgrade themselves to Family Rep Full
//            Access. This is a one-way, irreversible action.
//            The organiser gains tribute/EOH response capability.
//            Their organiser role is replaced by Full Access.
//            Billing remains anchored to their email.
//            Requires typing "UPGRADE" to confirm — prevents accidents.
//            ECS: honest about permanence, warm about the gain.
//            Not alarming — framed as a positive choice, not a warning.
// ARCHITECTURE: CA-SPEC-001 — Step 9.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// PROPS:
//   capsuleId    — capsule UUID
//   capsuleSlug  — for redirect after upgrade
//   honoureeName — shown in contextual copy
//   organiserEmail — the organiser's own email
//   onUpgraded   — callback after successful upgrade
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint   = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '14px', padding: '11px 16px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box', letterSpacing: '0.06em',
}

// ═══ SECTION 2 — Props ═══

interface Props {
  capsuleId:      string
  capsuleSlug:    string
  honoureeName:   string
  organiserEmail: string
  onUpgraded:     () => void
}

// ═══ SECTION 3 — Component ═══

export default function OrganizerUpgradePanel({
  capsuleId,
  capsuleSlug,
  honoureeName,
  organiserEmail,
  onUpgraded,
}: Props) {
  const [showModal,     setShowModal]     = useState(false)
  const [confirmation,  setConfirmation]  = useState('')
  const [password,      setPassword]      = useState('')
  const [confirmPass,   setConfirmPass]   = useState('')
  const [step,          setStep]          = useState<'confirm' | 'password'>('confirm')
  const [upgrading,     setUpgrading]     = useState(false)
  const [error,         setError]         = useState('')
  const [showPass,      setShowPass]      = useState(false)

  const confirmationOk = confirmation === 'UPGRADE'
  const passwordOk     = password.length >= 8 && password === confirmPass

  const handleProceedToPassword = () => {
    if (!confirmationOk) return
    setStep('password')
  }

  const handleUpgrade = async () => {
    if (!passwordOk || upgrading) return
    setUpgrading(true); setError('')

    try {
      const res = await fetch('/api/team/upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id: capsuleId,
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setUpgrading(false)
        return
      }

      // Success — reload the page with the new role
      onUpgraded()
      window.location.href = `/manage/${capsuleSlug}?upgraded=1`

    } catch {
      setError('Something went wrong. Please try again.')
      setUpgrading(false)
    }
  }

  const handleClose = () => {
    if (upgrading) return
    setShowModal(false)
    setStep('confirm')
    setConfirmation('')
    setPassword('')
    setConfirmPass('')
    setError('')
  }

  return (
    <>
      {/* ── Trigger card ── */}
      <div style={{
        padding: '16px', borderRadius: '14px',
        background: goldFaint, border: `1px solid rgba(226,195,107,0.2)`,
      }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: gold, margin: '0 0 8px', fontFamily: "'Playfair Display', serif" }}>
          Take on Full Access yourself
        </p>
        <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.75, margin: '0 0 16px' }}>
          If you are also the family lead — the person who will be reading and responding to tributes — you can upgrade your own account to Family Rep Full Access. You will gain the ability to respond to voices and acknowledgements directly. Your billing and account settings remain exactly as they are.
        </p>

        {/* ── What you gain ── */}
        <div style={{ marginBottom: '16px' }}>
          {[
            'Respond to individual voices on behalf of the family',
            'Respond to EOH acknowledgements',
            'Set and publish the Family Appreciation message',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span style={{ color: gold, flexShrink: 0, marginTop: '1px' }}>✦</span>
              <p style={{ fontSize: '12px', color: textSecondary, margin: 0, lineHeight: 1.6 }}>{item}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '11px', color: textFaint, marginBottom: '14px', fontStyle: 'italic', lineHeight: 1.6 }}>
          This is a permanent change — once you upgrade, your organiser role becomes Full Access. You will need to set a password for your new login.
        </p>

        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 22px', borderRadius: '10px', border: 'none',
            background: `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`,
            color: '#1a0845', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          Upgrade my account →
        </button>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', background: 'rgba(8,2,20,0.92)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={handleClose}
        >
          <div
            style={{
              width: '100%', maxWidth: '380px',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, #1e0d4e, #2a1060)',
              border: `1px solid rgba(226,195,107,0.3)`,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

            <div style={{ padding: '28px 24px 32px' }}>

              {step === 'confirm' ? (
                <>
                  {/* ── Step 1 — Confirmation ── */}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <p style={{ fontSize: '28px', marginBottom: '12px' }}>✦</p>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '19px', fontWeight: 700,
                      color: textPrimary, margin: '0 0 10px',
                    }}>
                      Confirm your upgrade
                    </h3>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.7, margin: 0 }}>
                      Once you upgrade, you will gain the ability to respond to voices and acknowledgements for <strong style={{ color: goldMuted }}>{honoureeName}</strong>. You will set a new password in the next step. This cannot be undone.
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      fontSize: '10px', color: goldMuted,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      display: 'block', marginBottom: '8px',
                    }}>
                      Type UPGRADE to continue
                    </label>
                    <input
                      style={inp}
                      placeholder="UPGRADE"
                      value={confirmation}
                      onChange={e => setConfirmation(e.target.value.toUpperCase())}
                      autoFocus
                    />
                    <p style={{ fontSize: '11px', color: textFaint, marginTop: '8px', lineHeight: 1.6 }}>
                      Your billing stays with {organiserEmail}. Only your dashboard capabilities change.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleProceedToPassword}
                      disabled={!confirmationOk}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                        background: confirmationOk
                          ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
                          : 'rgba(255,255,255,0.05)',
                        color: confirmationOk ? '#1a0845' : textFaint,
                        fontSize: '13px', fontWeight: 700,
                        cursor: confirmationOk ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Continue →
                    </button>
                    <button
                      onClick={handleClose}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px',
                        background: 'transparent', border: `1px solid ${cardBorder}`,
                        color: textFaint, fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* ── Step 2 — Password ── */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '19px', fontWeight: 700,
                      color: textPrimary, margin: '0 0 8px',
                    }}>
                      Set your password
                    </h3>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.7, margin: 0 }}>
                      You will use this password to sign in to your upgraded account going forward.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>New password</label>
                        <button onClick={() => setShowPass(p => !p)} style={{ fontSize: '10px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {showPass ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <input
                        type={showPass ? 'text' : 'password'}
                        style={inp}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Confirm password</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        style={{ ...inp, borderColor: confirmPass.length > 0 && password !== confirmPass ? 'rgba(248,113,113,0.4)' : 'rgba(226,195,107,0.18)' }}
                        placeholder="Same password again"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                      />
                      {confirmPass.length > 0 && password !== confirmPass && (
                        <p style={{ fontSize: '11px', color: 'rgba(248,113,113,0.7)', marginTop: '5px' }}>These don't match yet</p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '12px' }}>{error}</p>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleUpgrade}
                      disabled={!passwordOk || upgrading}
                      style={{
                        flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                        background: passwordOk
                          ? `linear-gradient(135deg, ${gold}, rgba(226,195,107,0.7))`
                          : 'rgba(255,255,255,0.05)',
                        color: passwordOk ? '#1a0845' : textFaint,
                        fontSize: '13px', fontWeight: 700,
                        cursor: passwordOk && !upgrading ? 'pointer' : 'not-allowed',
                        opacity: upgrading ? 0.7 : 1,
                      }}
                    >
                      {upgrading ? 'Upgrading…' : 'Complete upgrade →'}
                    </button>
                    <button
                      onClick={() => setStep('confirm')}
                      disabled={upgrading}
                      style={{
                        padding: '11px 16px', borderRadius: '10px',
                        background: 'transparent', border: `1px solid ${cardBorder}`,
                        color: textFaint, fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
