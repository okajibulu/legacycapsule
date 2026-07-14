'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/for/[slug]/dday/page.tsx
// PURPOSE: D-Day guest capture portal. Accessed via context-aware QR scan.
//          Guests upload photos/videos and/or leave tributes on event day.
//          Mobile-first — guests are at the event, on their phones.
//
// FLOW:
//   Step 1 — Choose: Upload photo | Leave tribute | Both
//   Step 2 — Name + optional email (prompted with publication incentive)
//   Step 3 — Upload / Write (or both)
//   Step 4 — Submit → success screen with capsule link
//
// ARCHITECTURE: LC02 Event Services Engine · D-Day Collection
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Imports & types
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Action = 'photo' | 'tribute' | 'both' | null
type Step   = 'choose' | 'identity' | 'capture' | 'success'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const pageBg       = 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)'
const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.08)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint    = 'rgba(255,255,255,0.28)'
const cardBorder   = 'rgba(226,195,107,0.15)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '14px', padding: '13px 16px', borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(226,195,107,0.22)`,
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Main client component
// ─────────────────────────────────────────────────────────────────────────────

export default function DdayPage() {
  const params       = useParams() as { slug: string }
  const searchParams = useSearchParams()
  const slug         = params.slug
  const phaseId      = searchParams.get('phase')
  const capsuleId    = searchParams.get('cid')
  const honoureeName = searchParams.get('name') ?? 'this special occasion'
  const eventTag     = searchParams.get('tag')

  // ── State ────────────────────────────────────────────────────────────────
  const [step,      setStep]      = useState<Step>('choose')
  const [action,    setAction]    = useState<Action>(null)
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [text,      setText]      = useState('')
  const [file,      setFile]      = useState<File | null>(null)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
  const capsuleUrl = `${APP_URL}/for/${slug}`

  // ── File selection ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setPreview(ev.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name'); return }
    if ((action === 'tribute' || action === 'both') && !text.trim()) {
      setError('Please write your tribute before submitting'); return
    }
    if ((action === 'photo' || action === 'both') && !file) {
      setError('Please select a photo or video to upload'); return
    }

    setSubmitting(true); setError('')

    try {
      const formData = new FormData()
      formData.append('capsule_id',        capsuleId ?? '')
      formData.append('capsule_slug',      slug)
      formData.append('phase_id',          phaseId ?? '')
      formData.append('contributor_name',  name.trim())
      formData.append('contributor_email', email.trim())
      formData.append('tribute_text',      text.trim())
      formData.append('action',            action ?? 'tribute')
      if (file) formData.append('file', file)

      const res  = await fetch('/api/dday/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setStep('success')
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 4 — Step: Choose action
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'choose') {
    return (
      <Shell honoureeName={honoureeName} eventTag={eventTag}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>📸</p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif", marginBottom: '8px', lineHeight: 1.25 }}>
            You're at the event.
          </h1>
          <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.7 }}>
            Share what you're seeing. Your moment becomes part of a permanent record.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '24px' }}>
          {[
            { key: 'photo',   icon: '📷', label: 'Share a photo or video',  desc: 'Upload what you\'re capturing right now' },
            { key: 'tribute', icon: '✍️', label: 'Leave a tribute',          desc: 'Write a personal message for the wall' },
            { key: 'both',    icon: '✨', label: 'Do both',                  desc: 'A photo and a personal tribute together' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => { setAction(opt.key as Action); setStep('identity') }}
              style={{
                width: '100%', textAlign: 'left' as const, padding: '16px 18px',
                borderRadius: '14px', border: `1px solid ${cardBorder}`,
                background: goldFaint, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}
            >
              <span style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textPrimary }}>{opt.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: textFaint }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.6, margin: 0 }}>
            Or{' '}
            <Link href={capsuleUrl} style={{ color: goldMuted, textDecoration: 'underline' }}>
              visit the tribute wall
            </Link>
            {' '}to read what others have shared.
          </p>
        </div>
      </Shell>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 5 — Step: Identity
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'identity') {
    return (
      <Shell honoureeName={honoureeName} eventTag={eventTag}>
        <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '12px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
          ← Back
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", marginBottom: '6px' }}>
          Who's sharing?
        </h2>
        <p style={{ fontSize: '13px', color: textFaint, lineHeight: 1.6, marginBottom: '24px' }}>
          Your name will appear with your {action === 'photo' ? 'photo' : action === 'tribute' ? 'tribute' : 'contribution'} on the wall.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Your name *</label>
            <input style={inp} placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Email (optional)</label>
            <input type="email" style={inp} placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <p style={{ fontSize: '11px', color: textFaint, margin: '6px 0 0', lineHeight: 1.6 }}>
              💌 Leave your email and we'll send you the Digital Publication when it's ready — a beautifully compiled record of this event.
            </p>
          </div>
        </div>

        <button
          onClick={() => { if (name.trim()) setStep('capture') }}
          disabled={!name.trim()}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: name.trim() ? 'linear-gradient(135deg,#E2C36B,#C8A84A)' : 'rgba(255,255,255,0.06)',
            color: name.trim() ? '#1a0845' : textFaint, fontSize: '15px', fontWeight: 700,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Continue →
        </button>
      </Shell>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 6 — Step: Capture (upload + tribute)
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'capture') {
    return (
      <Shell honoureeName={honoureeName} eventTag={eventTag}>
        <button onClick={() => setStep('identity')} style={{ background: 'none', border: 'none', color: textFaint, fontSize: '12px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
          ← Back
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, fontFamily: "'Playfair Display', serif", marginBottom: '20px' }}>
          Share your moment
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px', marginBottom: '20px' }}>

          {/* ── Photo/video upload ── */}
          {(action === 'photo' || action === 'both') && (
            <div>
              <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                {action === 'both' ? 'Your photo or video *' : 'Upload your photo or video *'}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                capture="environment"
              />
              {file ? (
                <div style={{ position: 'relative' as const }}>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                  ) : (
                    <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' as const }}>
                      <p style={{ fontSize: '14px', color: textSecondary }}>🎬 {file.name}</p>
                      <p style={{ fontSize: '11px', color: textFaint, marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  )}
                  <button
                    onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    style={{ position: 'absolute' as const, top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ width: '100%', padding: '32px 20px', borderRadius: '14px', border: `2px dashed rgba(226,195,107,0.25)`, background: goldFaint, cursor: 'pointer', textAlign: 'center' as const }}
                >
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>📷</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, margin: '0 0 4px' }}>Tap to select photo or video</p>
                  <p style={{ fontSize: '11px', color: textFaint, margin: 0 }}>Taken just now, or from your camera roll</p>
                </button>
              )}
            </div>
          )}

          {/* ── Tribute text ── */}
          {(action === 'tribute' || action === 'both') && (
            <div>
              <label style={{ fontSize: '10px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                {action === 'both' ? 'Your tribute *' : 'Your tribute message *'}
              </label>
              <textarea
                style={{ ...inp, minHeight: '120px', resize: 'vertical' as const, lineHeight: 1.7 }}
                placeholder={`Share a message for ${honoureeName}. This will appear on the tribute wall.`}
                value={text}
                onChange={e => setText(e.target.value.slice(0, 500))}
              />
              <p style={{ fontSize: '10px', color: 500 - text.length < 50 ? 'rgba(248,113,113,0.7)' : textFaint, textAlign: 'right' as const, margin: '4px 0 0' }}>
                {500 - text.length} characters remaining
              </p>
            </div>
          )}
        </div>

        {error && <p style={{ fontSize: '12px', color: 'rgba(248,113,113,0.8)', marginBottom: '12px', textAlign: 'center' as const }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845',
            fontSize: '15px', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Sharing…' : 'Share Now ✦'}
        </button>

        <p style={{ fontSize: '11px', color: textFaint, textAlign: 'center' as const, marginTop: '10px', lineHeight: 1.6 }}>
          Your contribution will be reviewed before appearing on the wall.
        </p>
      </Shell>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 7 — Step: Success
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Shell honoureeName={honoureeName} eventTag={eventTag}>
      <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
          ✓
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif", marginBottom: '10px', lineHeight: 1.25 }}>
          Your moment has been captured
        </h2>
        <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.75, marginBottom: '8px' }}>
          It will be reviewed and added to the record for {honoureeName}.
        </p>
        {email && (
          <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '24px' }}>
            We'll send the Digital Publication to <span style={{ color: goldMuted }}>{email}</span> when it's ready.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
        <Link
          href={capsuleUrl}
          style={{ display: 'block', padding: '13px', borderRadius: '12px', textDecoration: 'none', background: 'linear-gradient(135deg,#E2C36B,#C8A84A)', color: '#1a0845', fontSize: '14px', fontWeight: 700, textAlign: 'center' as const }}
        >
          View the Tribute Wall →
        </Link>
        <button
          onClick={() => { setStep('choose'); setAction(null); setText(''); setFile(null); setPreview(null) }}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid rgba(226,195,107,0.2)`, background: goldFaint, color: goldMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          Share another moment
        </button>
      </div>
    </Shell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — Shell wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Shell({ honoureeName, eventTag, children }: {
  honoureeName: string; eventTag: string | null; children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '0 0 40px' }}>

      {/* ── Compact header ── */}
      <div style={{ width: '100%', padding: '14px 20px 12px', borderBottom: '1px solid rgba(226,195,107,0.1)', marginBottom: '8px', textAlign: 'center' as const }}>
        <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', color: goldMuted, textTransform: 'uppercase' as const, margin: 0 }}>
          LEGACYCAPSULE
        </p>
      </div>

      {/* ── Event label ── */}
      <div style={{ textAlign: 'center', padding: '12px 20px 4px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: gold, margin: 0 }}>{honoureeName}</p>
        {eventTag && <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>{eventTag}</p>}
      </div>

      {/* ── Content ── */}
      <div style={{ width: '100%', maxWidth: '440px', padding: '20px 20px 0' }}>
        {children}
      </div>
    </div>
  )
}
