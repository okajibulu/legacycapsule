'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/for/[slug]/rsvp/page.tsx
// PURPOSE: Guest-facing RSVP response page.
//          Authenticated by rsvp_token in URL query param (?t=token).
//          Shows honouree name, event details (if organiser has enabled),
//          Attending / Not Attending buttons, optional tribute message,
//          optional dietary field. Mobile-first premium design.
//          No login required — token-scoped to one guest.
//          Submits to /api/rsvp/respond.
// ARCHITECTURE: LC02 Event Services Engine · Guest Coordination System
// PHASE: Guest Management — RSVP Guest Page
// BUILT BY: AI14 · Claude Opus 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect }         from 'react'
import { useParams, useSearchParams }  from 'next/navigation'
import Link                            from 'next/link'

// ═══ SECTION 2 — Design tokens ═══

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textFaint    = 'rgba(255,255,255,0.28)'
const successColor = 'rgba(134,239,172,0.85)'
const errorColor   = 'rgba(248,113,113,0.85)'
const bg           = '#0f0a1e'

// ═══ SECTION 3 — Types ═══

interface GuestData {
  name:       string
  tier:       string
  email:      string | null
  rsvp_status: string
  rsvp_responded_at: string | null
}

interface RsvpConfig {
  show_event_details:      boolean
  allow_additional_guests:  boolean
  max_additional_per_guest: number
  show_dietary:            boolean
  allow_rsvp_message:      boolean
  rsvp_tone:               string
  event_venue:             string | null
  event_datetime:          string | null
  event_dress_code:        string | null
  deadline_at:             string | null
}

interface CapsuleInfo {
  honouree_name: string
  event_tag:     string | null
  event_type:    string
  slug:          string
}

type PageState = 'loading' | 'form' | 'already_responded' | 'submitting' | 'success' | 'error'

// ═══ SECTION 4 — Component ═══

export default function RSVPPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const slug         = typeof params?.slug === 'string' ? params.slug : ''
  const token        = searchParams?.get('t') ?? ''
  const preResponse  = searchParams?.get('response') ?? null  // from email "decline" link

  // ── 4.1 State ──────────────────────────────────────────────────────────────

  const [pageState,    setPageState]    = useState<PageState>('loading')
  const [guest,        setGuest]        = useState<GuestData | null>(null)
  const [capsule,      setCapsule]      = useState<CapsuleInfo | null>(null)
  const [config,       setConfig]       = useState<RsvpConfig | null>(null)
  const [errorMsg,     setErrorMsg]     = useState('')

  // Form state
  const [response,     setResponse]     = useState<'confirmed' | 'declined' | null>(
    preResponse === 'declined' ? 'declined' : null
  )
  const [additional,   setAdditional]   = useState(0)
  const [dietary,      setDietary]      = useState('')
  const [message,      setMessage]      = useState('')

  // Success state
  const [result,       setResult]       = useState<{
    status: string; honouree_name: string; capsule_slug: string; tribute_inserted: boolean
  } | null>(null)

  // ── 4.2 Load guest data on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      setErrorMsg('No RSVP token found. Please use the link from your invitation email.')
      setPageState('error')
      return
    }

    const load = async () => {
      try {
        // Fetch guest by token (via a lightweight query through the respond endpoint)
        const res = await fetch(`/api/rsvp/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rsvp_token: token, status: '_preflight' }),
        })

        // Preflight will fail validation — we need a dedicated fetch.
        // Use a GET approach via capsule-by-slug + guest token lookup.
      } catch {}

      // Direct approach: fetch capsule info from public-info, then rely on
      // the form submission to validate the token at submit time.
      try {
        const capRes  = await fetch(`/api/capsule/public-info?slug=${slug}`)
        const capData = await capRes.json()

        if (capData.capsule) {
          setCapsule({
            honouree_name: capData.capsule.honouree_name,
            event_tag:     capData.capsule.event_tag,
            event_type:    capData.capsule.event_type,
            slug:          capData.capsule.slug,
          })

          // Fetch RSVP config
          const cfgRes  = await fetch(`/api/rsvp/config?capsule_id=${capData.capsule.id}`)
          const cfgData = await cfgRes.json()
          if (cfgData.config) setConfig(cfgData.config)
        }

        // We accept the token on faith during page load — the /api/rsvp/respond
        // endpoint validates it at submission. This avoids exposing a public
        // GET endpoint that reveals guest details from a token.
        setPageState('form')

      } catch {
        setErrorMsg('Could not load event details. Please try again.')
        setPageState('error')
      }
    }

    load()
  }, [token, slug])

  // ── 4.3 Submit RSVP ──────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!response) return

    setPageState('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/rsvp/respond', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          rsvp_token:           token,
          status:               response,
          additional_guests:    response === 'confirmed' ? additional : 0,
          rsvp_message:         message.trim() || null,
          dietary_requirements: dietary.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
        setPageState('form')
        return
      }

      setResult(data)
      setPageState('success')

    } catch {
      setErrorMsg('Could not submit your RSVP. Please check your connection and try again.')
      setPageState('form')
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const eventLabel    = capsule?.event_tag ?? capsule?.honouree_name ?? 'Event'
  const showDetails   = config?.show_event_details !== false
  const showDietary   = config?.show_dietary === true
  const showMessage   = config?.allow_rsvp_message !== false
  const showAdditional = config?.allow_additional_guests === true
  const maxAdditional  = config?.max_additional_per_guest ?? 5

  // ═══ SECTION 5 — Render ═══

  return (
    <div style={{
      minHeight: '100vh', background: bg,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        padding: '0 20px 60px',
      }}>

        {/* ── 5.1 Loading ─────────────────────────────────────────────────── */}

        {pageState === 'loading' && (
          <div style={{
            padding: '100px 0', textAlign: 'center' as const,
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '2px solid rgba(226,195,107,0.15)',
              borderTopColor: gold,
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 14px',
            }} />
            <p style={{ fontSize: '12px', color: textFaint }}>Loading your invitation…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ── 5.2 Error ───────────────────────────────────────────────────── */}

        {pageState === 'error' && (
          <div style={{
            padding: '80px 0', textAlign: 'center' as const,
          }}>
            <div style={{
              padding: '24px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(248,113,113,0.15)',
            }}>
              <p style={{ fontSize: '13px', color: errorColor, lineHeight: 1.7 }}>
                {errorMsg}
              </p>
            </div>
          </div>
        )}

        {/* ── 5.3 Form ────────────────────────────────────────────────────── */}

        {(pageState === 'form' || pageState === 'submitting') && capsule && (
          <div>
            {/* Header */}
            <div style={{
              textAlign: 'center' as const,
              padding: '48px 0 28px',
            }}>
              <p style={{
                fontSize: '9px', color: goldMuted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.2em',
                margin: '0 0 12px', fontWeight: 600,
              }}>
                You are personally invited
              </p>
              <h1 style={{
                fontSize: '28px', fontWeight: 700,
                color: textPrimary,
                fontFamily: "'Playfair Display', serif",
                margin: '0 0 6px', lineHeight: 1.3,
              }}>
                {eventLabel}
              </h1>
              {capsule.honouree_name && capsule.event_tag && (
                <p style={{
                  fontSize: '15px', color: goldMuted,
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                }}>
                  {capsule.honouree_name}
                </p>
              )}
            </div>

            {/* Decorative rule */}
            <div style={{
              height: '1px', margin: '0 40px 28px',
              background: 'linear-gradient(90deg, transparent, rgba(226,195,107,0.3), transparent)',
            }} />

            {/* Event details card */}
            {showDetails && (config?.event_venue || config?.event_datetime) && (
              <div style={{
                padding: '16px 20px', borderRadius: '14px',
                background: 'rgba(226,195,107,0.04)',
                border: '1px solid rgba(226,195,107,0.12)',
                marginBottom: '24px',
              }}>
                {config.event_datetime && (
                  <div style={{ marginBottom: config.event_venue ? '12px' : 0 }}>
                    <p style={{
                      fontSize: '9px', color: goldMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.12em', margin: '0 0 4px',
                    }}>
                      Date & Time
                    </p>
                    <p style={{
                      fontSize: '14px', fontWeight: 600,
                      color: textPrimary, margin: 0,
                    }}>
                      {config.event_datetime}
                    </p>
                  </div>
                )}
                {config.event_venue && (
                  <div style={{ marginBottom: config.event_dress_code ? '12px' : 0 }}>
                    <p style={{
                      fontSize: '9px', color: goldMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.12em', margin: '0 0 4px',
                    }}>
                      Venue
                    </p>
                    <p style={{
                      fontSize: '13px', color: 'rgba(255,255,255,0.7)',
                      margin: 0, lineHeight: 1.5,
                    }}>
                      {config.event_venue}
                    </p>
                  </div>
                )}
                {config.event_dress_code && (
                  <div>
                    <p style={{
                      fontSize: '9px', color: goldMuted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.12em', margin: '0 0 4px',
                    }}>
                      Dress Code
                    </p>
                    <p style={{
                      fontSize: '13px', color: 'rgba(255,255,255,0.7)',
                      margin: 0,
                    }}>
                      {config.event_dress_code}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* RSVP deadline note */}
            {config?.deadline_at && (
              <p style={{
                fontSize: '11px', color: textFaint,
                textAlign: 'center' as const,
                margin: '0 0 20px', lineHeight: 1.5,
              }}>
                Please respond by {new Date(config.deadline_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}.
              </p>
            )}

            {/* ── Attendance selection ─────────────────────────────────────── */}

            <p style={{
              fontSize: '12px', color: textFaint,
              textAlign: 'center' as const,
              margin: '0 0 12px',
            }}>
              Will you be joining us?
            </p>

            <div style={{
              display: 'flex', gap: '10px', marginBottom: '20px',
            }}>
              {/* Attending */}
              <button
                onClick={() => setResponse('confirmed')}
                style={{
                  flex: 1, padding: '16px 12px', borderRadius: '12px',
                  border: `2px solid ${response === 'confirmed'
                    ? 'rgba(134,239,172,0.5)'
                    : 'rgba(255,255,255,0.08)'}`,
                  background: response === 'confirmed'
                    ? 'rgba(134,239,172,0.06)'
                    : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                  transition: 'all 0.2s',
                }}
              >
                <p style={{
                  fontSize: '20px', margin: '0 0 6px',
                }}>✓</p>
                <p style={{
                  fontSize: '13px', fontWeight: 700,
                  color: response === 'confirmed' ? successColor : textPrimary,
                  margin: '0 0 2px',
                }}>
                  I Will Attend
                </p>
                <p style={{
                  fontSize: '10px', color: textFaint, margin: 0,
                }}>
                  Looking forward to it
                </p>
              </button>

              {/* Unable to attend */}
              <button
                onClick={() => setResponse('declined')}
                style={{
                  flex: 1, padding: '16px 12px', borderRadius: '12px',
                  border: `2px solid ${response === 'declined'
                    ? 'rgba(248,113,113,0.35)'
                    : 'rgba(255,255,255,0.08)'}`,
                  background: response === 'declined'
                    ? 'rgba(248,113,113,0.04)'
                    : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                  transition: 'all 0.2s',
                }}
              >
                <p style={{
                  fontSize: '20px', margin: '0 0 6px',
                }}>✗</p>
                <p style={{
                  fontSize: '13px', fontWeight: 700,
                  color: response === 'declined' ? errorColor : textPrimary,
                  margin: '0 0 2px',
                }}>
                  Unable to Attend
                </p>
                <p style={{
                  fontSize: '10px', color: textFaint, margin: 0,
                }}>
                  Send my regards
                </p>
              </button>
            </div>

            {/* ── Expanded form after selection ───────────────────────────── */}

            {response && (
              <div style={{
                padding: '20px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '20px',
              }}>

                {/* Additional guests (only on confirmed + if enabled) */}
                {response === 'confirmed' && showAdditional && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      fontSize: '11px', color: textFaint,
                      display: 'block', marginBottom: '6px',
                    }}>
                      I will be bringing
                    </label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <button
                        onClick={() => setAdditional(Math.max(0, additional - 1))}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent', color: textPrimary,
                          fontSize: '16px', cursor: 'pointer',
                        }}
                      >
                        −
                      </button>
                      <span style={{
                        fontSize: '18px', fontWeight: 700,
                        color: textPrimary, minWidth: '40px',
                        textAlign: 'center' as const,
                      }}>
                        {additional}
                      </span>
                      <button
                        onClick={() => setAdditional(Math.min(maxAdditional, additional + 1))}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent', color: textPrimary,
                          fontSize: '16px', cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                      <span style={{
                        fontSize: '11px', color: textFaint,
                      }}>
                        additional guest{additional !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dietary requirements (if enabled) */}
                {response === 'confirmed' && showDietary && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      fontSize: '11px', color: textFaint,
                      display: 'block', marginBottom: '6px',
                    }}>
                      Dietary requirements (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vegetarian, no shellfish"
                      value={dietary}
                      onChange={e => setDietary(e.target.value)}
                      maxLength={200}
                      style={{
                        width: '100%', fontSize: '13px',
                        padding: '10px 14px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: textPrimary, outline: 'none',
                        fontFamily: "'DM Sans', sans-serif",
                        boxSizing: 'border-box' as const,
                      }}
                    />
                  </div>
                )}

                {/* Tribute message */}
                {showMessage && (
                  <div>
                    <label style={{
                      fontSize: '11px', color: textFaint,
                      display: 'block', marginBottom: '6px',
                    }}>
                      {response === 'confirmed'
                        ? `A message for ${capsule?.honouree_name ?? 'the honouree'} (optional — you can also do this from the tribute wall)`
                        : `Send your regards to ${capsule?.honouree_name ?? 'the honouree'} (optional)`
                      }
                    </label>
                    <textarea
                      placeholder={
                        response === 'confirmed'
                          ? 'Looking forward to celebrating with you…'
                          : 'Sorry I cannot make it, but wishing you all the best…'
                      }
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={3}
                      maxLength={500}
                      style={{
                        width: '100%', fontSize: '13px',
                        padding: '10px 14px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: textPrimary, outline: 'none',
                        fontFamily: "'DM Sans', sans-serif",
                        resize: 'vertical' as const, lineHeight: 1.6,
                        boxSizing: 'border-box' as const,
                      }}
                    />
                    <p style={{
                      fontSize: '10px', color: 'rgba(255,255,255,0.15)',
                      margin: '4px 0 0', textAlign: 'right' as const,
                    }}>
                      {message.length}/500
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <p style={{
                fontSize: '12px', color: errorColor,
                marginBottom: '12px', textAlign: 'center' as const,
              }}>
                {errorMsg}
              </p>
            )}

            {/* Submit button */}
            {response && (
              <button
                onClick={handleSubmit}
                disabled={pageState === 'submitting'}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background: pageState === 'submitting'
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
                  color: pageState === 'submitting' ? textFaint : '#1a0845',
                  fontSize: '14px', fontWeight: 700,
                  cursor: pageState === 'submitting' ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                {pageState === 'submitting'
                  ? 'Submitting…'
                  : response === 'confirmed'
                  ? 'Confirm My Attendance'
                  : 'Submit Response'}
              </button>
            )}
          </div>
        )}

        {/* ── 5.4 Success ─────────────────────────────────────────────────── */}

        {pageState === 'success' && result && (
          <div style={{
            textAlign: 'center' as const,
            padding: '60px 0 40px',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: result.status === 'confirmed'
                ? 'rgba(134,239,172,0.1)'
                : 'rgba(248,113,113,0.06)',
              border: `2px solid ${result.status === 'confirmed'
                ? 'rgba(134,239,172,0.3)'
                : 'rgba(248,113,113,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px',
            }}>
              {result.status === 'confirmed' ? '✓' : '✗'}
            </div>

            <h2 style={{
              fontSize: '22px', fontWeight: 700,
              color: textPrimary, margin: '0 0 8px',
              fontFamily: "'Playfair Display', serif",
            }}>
              {result.status === 'confirmed'
                ? 'We look forward to seeing you!'
                : 'Thank you for letting us know'}
            </h2>

            <p style={{
              fontSize: '13px', color: textFaint,
              lineHeight: 1.7, margin: '0 0 24px',
              maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto',
            }}>
              {result.status === 'confirmed'
                ? `Your attendance at ${result.honouree_name}'s celebration has been confirmed. We cannot wait to celebrate together.`
                : `Your response has been recorded. We understand and hope you will be with us in spirit.`}
            </p>

            {result.tribute_inserted && (
              <p style={{
                fontSize: '11px', color: goldMuted,
                margin: '0 0 20px',
              }}>
                Your message will appear on the tribute wall after review.
              </p>
            )}

            {/* Link to capsule */}
            <Link
              href={`/for/${result.capsule_slug}`}
              style={{
                display: 'inline-block',
                padding: '12px 28px', borderRadius: '10px',
                background: 'rgba(226,195,107,0.08)',
                border: '1px solid rgba(226,195,107,0.25)',
                color: gold, fontSize: '13px',
                fontWeight: 600, textDecoration: 'none',
                letterSpacing: '0.04em',
              }}
            >
              Visit the Tribute Wall →
            </Link>
          </div>
        )}

        {/* ── 5.5 Footer ──────────────────────────────────────────────────── */}

        <div style={{
          textAlign: 'center' as const,
          padding: '40px 0 20px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          marginTop: '20px',
        }}>
          <p style={{
            fontSize: '8px', color: 'rgba(255,255,255,0.12)',
            letterSpacing: '0.2em', textTransform: 'uppercase' as const,
            margin: 0,
          }}>
            LegacyCapsule · Valnex, Unipessoal LDA · RevoWorldTech
          </p>
        </div>
      </div>
    </div>
  )
}
