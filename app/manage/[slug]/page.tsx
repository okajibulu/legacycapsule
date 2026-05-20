'use client'

/* =========================================================
   ORGANISER CONTROL DASHBOARD — /manage/[slug]
   The organiser's premium workspace. Clean rebuild v1.

   Philosophy:
   - This is not a tool. It is a space where an event lives.
   - Every element earns its place.
   - Premium throughout — not a form, not a dashboard widget dump.

   SECTIONS:
   1.  Imports
   2.  Types
   3.  Constants
   4.  Utilities
   5.  Sub-components
       5a. FreeTierBar
       5b. StatPill
       5c. SectionCard
       5d. TributeReviewCard
       5e. EditField
       5f. UpgradeCard
       5g. BottomNav
   6.  Main component
   7.  — State & data fetch
   8.  — Derived values
   9.  — Handlers
   10. — Render
========================================================= */

/* =========================================================
   SECTION 1 — IMPORTS
========================================================= */
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'
import Link from 'next/link'

/* =========================================================
   SECTION 2 — TYPES
========================================================= */
interface Capsule {
  id: string
  slug: string
  honouree_name: string
  honouree_title: string | null
  event_type: string
  event_tag: string | null
  event_date: string | null
  page_state: string
  tier: string | null
  hero_image_url: string | null
  organiser_email: string
  free_tier_expires_at: string | null
  activated_at: string | null
  approved_contrib_count: number
  components: string[]
}

interface Contribution {
  id: string
  contributor_name: string
  city: string
  country: string
  relationship: string | null
  tribute_text: string
  thumbnail_url: string | null
  email: string | null
  status: string
  created_at: string
}

interface ProfileSection {
  id: string
  section_type: string
  custom_title: string | null
  content: string | null
  sort_order: number
  is_active: boolean
}

type Tab = 'overview' | 'tributes' | 'profile' | 'settings'

/* =========================================================
   SECTION 3 — CONSTANTS
========================================================= */
const LS_EMAIL = 'lc_visitor_email'
const FREE_TRIBUTE_LIMIT = 50
const FREE_DAY_LIMIT = 90

const pageBg = '#0f0a1e'
const cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const goldFaint = 'rgba(226,195,107,0.15)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.50)'
const textFaint = 'rgba(255,255,255,0.28)'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.25)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: textPrimary,
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: "'DM Sans', sans-serif",
}

// Dynamic import — TributeMap uses Leaflet, never SSR
const TributeMap = dynamic(() => import('@/components/TributeMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#0a0218' }} />
  ),
})

/* =========================================================
   SECTION 4 — UTILITIES
========================================================= */
function daysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function compressPhoto(file: File): Promise<File> {
  try {
    const ic = (await import('browser-image-compression')).default
    return await ic(file, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
  } catch { return file }
}

/* =========================================================
   SECTION 5A — FREE TIER STATUS BAR
========================================================= */
function FreeTierBar({
  approvedCount,
  daysLeft,
  onUpgrade,
}: {
  approvedCount: number
  daysLeft: number | null
  onUpgrade: () => void
}) {
  const tributePct = Math.min(100, (approvedCount / FREE_TRIBUTE_LIMIT) * 100)
  const isUrgent = (daysLeft !== null && daysLeft < 14) || tributePct > 80

  return (
    <div style={{
      background: isUrgent ? 'rgba(226,195,107,0.08)' : 'rgba(255,255,255,0.03)',
      borderBottom: `1px solid ${isUrgent ? 'rgba(226,195,107,0.25)' : 'rgba(255,255,255,0.06)'}`,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      {/* Tribute progress */}
      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: goldMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Tributes
          </span>
          <span style={{ fontSize: '10px', color: isUrgent ? gold : textFaint }}>
            {approvedCount} / {FREE_TRIBUTE_LIMIT}
          </span>
        </div>
        <div style={{
          height: '3px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${tributePct}%`,
            borderRadius: '2px',
            background: tributePct > 80
              ? 'linear-gradient(to right, #E2C36B, #F0D878)'
              : 'linear-gradient(to right, rgba(226,195,107,0.5), rgba(226,195,107,0.8))',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Days remaining */}
      {daysLeft !== null && (
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <span style={{
            fontSize: '11px',
            color: daysLeft < 14 ? gold : textSecondary,
            fontWeight: daysLeft < 14 ? 600 : 400,
          }}>
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
          </span>
        </div>
      )}

      {/* Upgrade CTA */}
      <button
        onClick={onUpgrade}
        style={{
          flexShrink: 0,
          fontSize: '11px',
          fontWeight: 700,
          padding: '5px 14px',
          borderRadius: '20px',
          border: `1px solid rgba(226,195,107,0.4)`,
          background: 'rgba(226,195,107,0.10)',
          color: gold,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          transition: 'all 0.2s',
        }}
      >
        Expand Capsule
      </button>
    </div>
  )
}

/* =========================================================
   SECTION 5B — STAT PILL
========================================================= */
function StatPill({ label, value, accent }: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div style={{
      flex: 1,
      minWidth: '80px',
      padding: '14px 12px',
      borderRadius: '12px',
      background: accent ? 'rgba(226,195,107,0.07)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.06)'}`,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '22px',
        fontWeight: 800,
        color: accent ? gold : textPrimary,
        lineHeight: 1.1,
        fontFamily: "'Playfair Display', serif",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '10px',
        color: textFaint,
        marginTop: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {label}
      </div>
    </div>
  )
}

/* =========================================================
   SECTION 5C — SECTION CARD WRAPPER
========================================================= */
function SectionCard({ title, subtitle, children, action }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px 12px',
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
      }}>
        <div>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 700,
            color: textPrimary,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '11px', color: textFaint, marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div style={{ padding: '16px 18px' }}>
        {children}
      </div>
    </div>
  )
}

/* =========================================================
   SECTION 5D — TRIBUTE REVIEW CARD
========================================================= */
function TributeReviewCard({
  c, onApprove, onDecline,
}: {
  c: Contribution
  onApprove: (id: string) => void
  onDecline: (id: string) => void
}) {
  const [declining, setDeclining] = useState(false)
  const [approving, setApproving] = useState(false)
  const displayName = c.relationship
    ? `${c.contributor_name} (${c.relationship})`
    : c.contributor_name

  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid rgba(226,195,107,0.18)',
      background: 'rgba(226,195,107,0.04)',
      padding: '14px 16px',
      marginBottom: '10px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: gold }}>
          {displayName}
        </span>
        <span style={{ fontSize: '11px', color: textFaint }}>
          {[c.city, c.country].filter(Boolean).join(' · ')}
        </span>
        <span style={{ fontSize: '10px', color: textFaint, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </span>
      </div>

      {/* Full tribute text — no truncation on review */}
      <p style={{
        fontSize: '13px',
        color: textPrimary,
        lineHeight: 1.65,
        marginBottom: '12px',
        fontStyle: 'italic',
      }}>
        "{c.tribute_text}"
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          disabled={approving}
          onClick={async () => { setApproving(true); await onApprove(c.id) }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            border: '1px solid rgba(74,222,128,0.3)',
            background: 'rgba(74,222,128,0.08)',
            color: approving ? textFaint : 'rgba(134,239,172,0.9)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: approving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.04em',
          }}
        >
          {approving ? 'Publishing…' : '✓ Publish'}
        </button>
        <button
          disabled={declining}
          onClick={() => setDeclining(true)}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            border: '1px solid rgba(248,113,113,0.22)',
            background: 'rgba(248,113,113,0.06)',
            color: 'rgba(248,113,113,0.7)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.04em',
          }}
        >
          Decline
        </button>
      </div>

      {/* Decline confirm */}
      {declining && (
        <div style={{
          marginTop: '10px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(248,113,113,0.06)',
          border: '1px solid rgba(248,113,113,0.18)',
        }}>
          <p style={{ fontSize: '12px', color: textSecondary, marginBottom: '8px' }}>
            Decline this tribute? The contributor will not be notified.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { onDecline(c.id); setDeclining(false) }}
              style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
                color: 'rgba(248,113,113,0.9)', cursor: 'pointer',
              }}
            >Confirm decline</button>
            <button
              onClick={() => setDeclining(false)}
              style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '12px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                color: textFaint, cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SECTION 5E — EDITABLE FIELD
========================================================= */
function EditField({
  label, value, placeholder, onSave, type = 'text', hint,
}: {
  label: string
  value: string
  placeholder?: string
  onSave: (val: string) => Promise<void>
  type?: 'text' | 'date' | 'email'
  hint?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <label style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </label>
        {!editing && (
          <button
            onClick={() => { setDraft(value); setEditing(true) }}
            style={{ fontSize: '11px', color: textFaint, background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
          >Edit</button>
        )}
      </div>

      {editing ? (
        <div>
          <input
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
            autoFocus
          />
          {hint && <p style={{ fontSize: '10px', color: textFaint, marginTop: '4px' }}>{hint}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
                color: '#1a0845', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >{saving ? 'Saving…' : 'Save'}</button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                color: textFaint, cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          fontSize: '14px',
          color: value ? textPrimary : textFaint,
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
        }}>
          {value || <span style={{ fontStyle: 'italic' }}>{placeholder || 'Not set'}</span>}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SECTION 5F — UPGRADE CARD
========================================================= */
function UpgradeCard({ capsuleName }: { capsuleName: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return
    setSending(true)
    // Fire contact email — uses existing email infrastructure
    try {
      await fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          capsule: capsuleName,
          subject: 'Capsule expansion enquiry',
        }),
      })
      setSent(true)
    } catch {
      setSent(true) // Fail gracefully — don't alarm the user
    }
    setSending(false)
  }

  return (
    <div style={{
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid rgba(226,195,107,0.2)`,
      background: 'linear-gradient(145deg, rgba(226,195,107,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      marginBottom: '16px',
    }}>
      {/* Gold top rule */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.6), transparent)',
      }} />

      <div style={{ padding: '24px 20px' }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '18px',
          fontWeight: 700,
          color: gold,
          marginBottom: '8px',
          textShadow: '0 0 20px rgba(226,195,107,0.3)',
        }}>
          Expand Your Capsule
        </h3>

        <p style={{
          fontSize: '13px',
          color: textSecondary,
          lineHeight: 1.7,
          marginBottom: '20px',
        }}>
          Your capsule is live and growing. When you are ready to unlock more features — 
          photo tributes, audio and video contributions, digital publication, 
          extended validity, or increased capacity — we will build the right 
          package around your event.
        </p>

        {/* Publication promise */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'rgba(226,195,107,0.06)',
          border: '1px solid rgba(226,195,107,0.15)',
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '12px', color: goldMuted, lineHeight: 1.75, margin: 0 }}>
            ✦ At the close of your event, LegacyCapsule automatically compiles every tribute, 
            photo, and voice from your wall — from guests in the room and contributors around 
            the world — into a beautifully designed digital publication, complete with the 
            Capsule Profile you have built. The platform can be triggered to send it to every 
            person who contributed, wherever they are. No designer. No effort. Just a permanent, 
            shareable record of a moment that mattered.
          </p>
        </div>

        {sent ? (
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'rgba(74,222,128,0.07)',
            border: '1px solid rgba(74,222,128,0.2)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', color: 'rgba(134,239,172,0.9)', fontWeight: 600 }}>
              ✓ Message received
            </p>
            <p style={{ fontSize: '12px', color: textFaint, marginTop: '4px' }}>
              We will be in touch within 24 hours.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder="Tell us what you need — or just say hello"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !name.trim() || !email.trim() || !message.trim()}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
                color: '#1a0845',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending || !name.trim() || !email.trim() || !message.trim() ? 0.6 : 1,
                letterSpacing: '0.04em',
                transition: 'all 0.2s',
              }}
            >
              {sending ? 'Sending…' : 'Get in Touch'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   SECTION 5G — BOTTOM NAV (mobile)
========================================================= */
function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '◈' },
    { id: 'tributes', label: 'Tributes', icon: '✦' },
    { id: 'profile', label: 'Profile', icon: '◉' },
    { id: 'settings', label: 'Settings', icon: '⊙' },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(15,10,30,0.97)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(226,195,107,0.15)',
      display: 'flex',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            fontSize: '16px',
            color: active === tab.id ? gold : 'rgba(255,255,255,0.2)',
            transition: 'all 0.15s',
            lineHeight: 1,
          }}>
            {tab.icon}
          </span>
          <span style={{
            fontSize: '9px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: active === tab.id ? gold : 'rgba(255,255,255,0.2)',
            fontWeight: active === tab.id ? 700 : 400,
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </span>
          {active === tab.id && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              width: '20px',
              height: '2px',
              borderRadius: '1px',
              background: gold,
            }} />
          )}
        </button>
      ))}
    </div>
  )
}

/* =========================================================
   SECTION 6 — MAIN COMPONENT
========================================================= */
export default function ManagePage() {
  const params = useParams()
  const slug = params?.slug as string

  /* =========================================================
     SECTION 7 — STATE & DATA FETCH
  ========================================================= */
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [capsule, setCapsule] = useState<Capsule | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([])
  const [visitorEmail, setVisitorEmail] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [storyText, setStoryText] = useState('')
  const [storySaving, setStorySaving] = useState(false)

  // Load visitor email from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_EMAIL)
    if (saved) setVisitorEmail(saved)
  }, [])

  // Fetch all data
  const fetchAll = useCallback(async () => {
    if (!slug) return
    const [capRes, contribRes, sectionsRes] = await Promise.all([
      supabase.from('capsules')
        .select('id, slug, honouree_name, honouree_title, event_type, event_tag, event_date, page_state, tier, hero_image_url, organiser_email, free_tier_expires_at, activated_at, approved_contrib_count, components')
        .eq('slug', slug)
        .single(),
      supabase.from('contributions')
        .select('id, contributor_name, city, country, relationship, tribute_text, thumbnail_url, email, status, created_at')
        .eq('capsule_id', (await supabase.from('capsules').select('id').eq('slug', slug).single()).data?.id ?? '')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('capsule_profile_sections')
        .select('id, section_type, custom_title, content, sort_order, is_active')
        .eq('capsule_id', (await supabase.from('capsules').select('id').eq('slug', slug).single()).data?.id ?? '')
        .order('sort_order'),
    ])

    if (capRes.data) {
      setCapsule(capRes.data)
      setHeroImage(capRes.data.hero_image_url)
      // Pre-fill story section
      const story = sectionsRes.data?.find(s => s.section_type === 'story')
      if (story) setStoryText(story.content ?? '')
    }
    if (contribRes.data) setContributions(contribRes.data as Contribution[])
    if (sectionsRes.data) setProfileSections(sectionsRes.data as ProfileSection[])
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchAll() }, [fetchAll])

  /* =========================================================
     SECTION 8 — DERIVED VALUES
  ========================================================= */
  const isOrganiser = visitorEmail !== '' &&
    visitorEmail.toLowerCase() === capsule?.organiser_email?.toLowerCase()

  const pending = contributions.filter(c =>
    c.status === 'pending_review' || c.status === 'pending'
  )
  const approved = contributions.filter(c => c.status === 'approved')

  const days = daysRemaining(capsule?.free_tier_expires_at ?? null)
  const isFree = !capsule?.tier || capsule.tier === 'free'

  const capsuleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/for/${slug}`
    : `https://itslegacycapsule.com/for/${slug}`

  const pins = approved
    .filter(c => (c as any).lat && (c as any).lng)
    .map(c => ({
      lat: (c as any).lat,
      lng: (c as any).lng,
      name: c.contributor_name,
      country: c.country,
    }))

  /* =========================================================
     SECTION 9 — HANDLERS
  ========================================================= */
  const handleApprove = async (id: string) => {
    await supabase.from('contributions').update({ status: 'approved' }).eq('id', id)
    fetch('/api/email/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contributionId: id }),
    }).catch(() => {})
    await fetchAll()
  }

  const handleDecline = async (id: string) => {
    await supabase.from('contributions').delete().eq('id', id)
    await fetchAll()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(capsuleUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateCapsule = async (fields: Partial<Capsule>) => {
    if (!capsule) return
    await supabase.from('capsules').update(fields).eq('id', capsule.id)
    await fetchAll()
  }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !capsule) return
    setHeroUploading(true)
    try {
      const compressed = await compressPhoto(f)
      const ext = compressed.name.split('.').pop() ?? 'jpg'
      const path = `hero/${capsule.id}.${ext}`
      const { error: ue } = await supabase.storage
        .from('tribute-photos')
        .upload(path, compressed, { upsert: true })
      if (!ue) {
        const url = supabase.storage.from('tribute-photos').getPublicUrl(path).data.publicUrl
        await supabase.from('capsules').update({ hero_image_url: url }).eq('id', capsule.id)
        setHeroImage(url)
      }
    } catch (err) { console.error(err) }
    setHeroUploading(false)
  }

  const handleSaveStory = async () => {
    if (!capsule) return
    setStorySaving(true)
    const existing = profileSections.find(s => s.section_type === 'story')
    if (existing) {
      await supabase.from('capsule_profile_sections')
        .update({ content: storyText, is_active: true })
        .eq('id', existing.id)
    } else {
      await supabase.from('capsule_profile_sections')
        .insert({
          capsule_id: capsule.id,
          section_type: 'story',
          custom_title: 'Their Story',
          content: storyText,
          sort_order: 0,
          is_active: true,
        })
    }
    await fetchAll()
    setStorySaving(false)
  }

  /* =========================================================
     SECTION 10 — RENDER
  ========================================================= */

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '2px solid rgba(226,195,107,0.2)',
            borderTopColor: gold,
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ fontSize: '12px', color: textFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Loading your capsule
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Not found
  if (!capsule) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: textFaint, fontSize: '14px' }}>Capsule not found.</p>
      </div>
    )
  }

  // Auth gate — not the organiser
  if (visitorEmail && !isOrganiser) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
        <p style={{ color: textFaint, fontSize: '14px', maxWidth: '280px' }}>
          This dashboard is only accessible to the capsule organiser.
        </p>
        <Link href={`/for/${slug}`} style={{ fontSize: '13px', color: goldMuted, textDecoration: 'underline' }}>
          View the tribute wall
        </Link>
      </div>
    )
  }

  // Email prompt if no email in localStorage yet
  if (!visitorEmail) {
    return <EmailGate onEmail={email => {
      localStorage.setItem(LS_EMAIL, email)
      setVisitorEmail(email)
    }} />
  }

  const resolvedHero = heroImage ?? '/honouree.jpg'

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(226,195,107,0.2); border-radius: 2px; }
        input:focus, textarea:focus { 
          border-color: rgba(226,195,107,0.6) !important;
          box-shadow: 0 0 0 2px rgba(226,195,107,0.12), 0 0 14px rgba(226,195,107,0.3) !important;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: pageBg,
        fontFamily: "'DM Sans', sans-serif",
        color: textPrimary,
        paddingBottom: '80px', // space for bottom nav
      }}>

        {/* ═══════════════════════════════════════════════
            TOP HEADER — Capsule identity + status
        ═══════════════════════════════════════════════ */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(226,195,107,0.1)',
          padding: '14px 16px 12px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em',
                background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>LEGACY</span>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.25)', marginLeft: '0.1em' }}>CAPSULE</span>
            </Link>

            {/* Divider */}
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

            {/* Capsule name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px', fontWeight: 700,
                color: textPrimary,
                fontFamily: "'Playfair Display', serif",
                margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {capsule.honouree_name}
              </p>
              <p style={{ fontSize: '10px', color: textFaint, margin: 0, marginTop: '1px' }}>
                {capsule.event_type}
                {capsule.event_tag && ` · ${capsule.event_tag}`}
              </p>
            </div>

            {/* Status pill */}
            <div style={{
              flexShrink: 0,
              fontSize: '10px', fontWeight: 700,
              padding: '4px 10px', borderRadius: '20px',
              background: capsule.page_state === 'active'
                ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
              border: capsule.page_state === 'active'
                ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: capsule.page_state === 'active'
                ? 'rgba(134,239,172,0.9)' : textFaint,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {capsule.page_state === 'active' ? 'Live' : capsule.page_state}
            </div>
          </div>
        </div>

        {/* Free tier bar */}
        {isFree && (
          <FreeTierBar
            approvedCount={capsule.approved_contrib_count}
            daysLeft={days}
            onUpgrade={() => setActiveTab('settings')}
          />
        )}

        {/* ═══════════════════════════════════════════════
            MAIN CONTENT — tab-driven
        ═══════════════════════════════════════════════ */}
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 0' }}>

          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <StatPill label="Total" value={contributions.length} />
                <StatPill label="Approved" value={capsule.approved_contrib_count} accent />
                <StatPill label="Awaiting" value={pending.length} />
                {capsule.event_date && (
                  <StatPill
                    label="Days to event"
                    value={Math.max(0, Math.ceil((new Date(capsule.event_date).getTime() - Date.now()) / 86400000))}
                  />
                )}
              </div>

              {/* Share card */}
              <SectionCard title="Your Capsule Is Live">
                <p style={{ fontSize: '12px', color: textFaint, marginBottom: '14px' }}>
                  Share this link and watch the tributes arrive.
                </p>

                {/* URL display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(226,195,107,0.05)',
                  border: '1px solid rgba(226,195,107,0.18)',
                  marginBottom: '12px',
                }}>
                  <span style={{ flex: 1, fontSize: '12px', color: goldMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {capsuleUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{
                      flexShrink: 0, fontSize: '11px', fontWeight: 700,
                      padding: '5px 12px', borderRadius: '6px',
                      background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(226,195,107,0.1)',
                      border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(226,195,107,0.25)'}`,
                      color: copied ? 'rgba(134,239,172,0.9)' : gold,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                {/* WhatsApp share */}
                <Link
                  href={`https://wa.me/?text=${encodeURIComponent(`You are invited to leave a tribute for ${capsule.honouree_name}: ${capsuleUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', padding: '11px', borderRadius: '10px',
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.22)',
                    color: 'rgba(134,239,172,0.85)',
                    textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>💬</span>
                  Share via WhatsApp
                </Link>
              </SectionCard>

              {/* Live map widget */}
              {approved.length > 0 && (
                <SectionCard
                  title="World Tribute Map"
                  subtitle={`${pins.length > 0 ? `${[...new Set(pins.map(p => p.country))].length} countries represented` : 'Map pins appear as tributes are geocoded'}`}
                >
                  <div style={{ height: '160px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(226,195,107,0.15)' }}>
                    <TributeMap pins={pins} locked={true} />
                  </div>
                </SectionCard>
              )}

              {/* Pending tributes prompt */}
              {pending.length > 0 && (
                <div
                  onClick={() => setActiveTab('tributes')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(226,195,107,0.07)',
                    border: '1px solid rgba(226,195,107,0.25)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: gold, margin: 0 }}>
                      {pending.length} tribute{pending.length !== 1 ? 's' : ''} awaiting your review
                    </p>
                    <p style={{ fontSize: '11px', color: textFaint, margin: '2px 0 0' }}>
                      Tap to review and publish
                    </p>
                  </div>
                  <span style={{ fontSize: '18px', color: goldMuted }}>→</span>
                </div>
              )}

              {/* View tribute wall */}
              <Link
                href={`/for/${slug}`}
                target="_blank"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', padding: '11px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: textSecondary, textDecoration: 'none',
                  fontSize: '12px', letterSpacing: '0.06em',
                  textTransform: 'uppercase', fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                View Public Tribute Wall ↗
              </Link>
            </div>
          )}

          {/* ─── TRIBUTES TAB ─── */}
          {activeTab === 'tributes' && (
            <div>
              {pending.length > 0 && (
                <SectionCard
                  title="Awaiting Review"
                  subtitle={`${pending.length} tribute${pending.length !== 1 ? 's' : ''} to review`}
                >
                  {pending.map(c => (
                    <TributeReviewCard
                      key={c.id}
                      c={c}
                      onApprove={handleApprove}
                      onDecline={handleDecline}
                    />
                  ))}
                </SectionCard>
              )}

              {approved.length > 0 && (
                <SectionCard
                  title="Published Tributes"
                  subtitle={`${approved.length} live on the wall`}
                >
                  {approved.map(c => (
                    <div key={c.id} style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(255,255,255,0.03)',
                      marginBottom: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>
                          {c.contributor_name}
                          {c.relationship && (
                            <span style={{ fontWeight: 400, color: textFaint }}> ({c.relationship})</span>
                          )}
                        </span>
                        <span style={{ fontSize: '10px', color: textFaint }}>
                          {[c.city, c.country].filter(Boolean).join(' · ')}
                        </span>
                        <span style={{ fontSize: '10px', color: textFaint, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.6, margin: 0 }}>
                        {c.tribute_text.length > 200 ? c.tribute_text.slice(0, 200) + '…' : c.tribute_text}
                      </p>
                    </div>
                  ))}
                </SectionCard>
              )}

              {contributions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>✦</p>
                  <p style={{ fontSize: '14px', color: textFaint, lineHeight: 1.7 }}>
                    No tributes yet. Share your capsule link and the first one will arrive soon.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div>
              {/* Hero photo */}
              <SectionCard title="Capsule Photo" subtitle="Appears on the tribute wall and profile">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Photo preview */}
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden',
                    border: '2px solid rgba(226,195,107,0.4)',
                    boxShadow: '0 0 16px rgba(226,195,107,0.15)',
                  }}>
                    <img
                      src={resolvedHero}
                      alt={capsule.honouree_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.65, marginBottom: '12px' }}>
                      This photo appears as the backdrop on your tribute wall and as the profile photo beneath the wall.
                      Upload a clear, high-quality photo of {capsule.honouree_name}.
                    </p>
                    <label style={{
                      display: 'inline-block',
                      padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                      background: 'rgba(226,195,107,0.08)',
                      border: '1px solid rgba(226,195,107,0.25)',
                      color: gold, fontSize: '12px', fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}>
                      {heroUploading ? 'Uploading…' : '📷 Upload Photo'}
                      <input
                        type="file" accept="image/*"
                        onChange={handleHeroUpload}
                        style={{ display: 'none' }}
                        disabled={heroUploading}
                      />
                    </label>
                  </div>
                </div>
              </SectionCard>

              {/* Story section */}
              <SectionCard
                title="Their Story"
                subtitle="Shown in the profile section beneath the tribute wall"
              >
                <p style={{ fontSize: '12px', color: textFaint, marginBottom: '12px', lineHeight: 1.65 }}>
                  Write a short note about {capsule.honouree_name} — who they are, why this occasion matters,
                  or anything you want contributors to know. This appears publicly beneath the tribute wall.
                </p>
                <textarea
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  placeholder={`Tell the story of ${capsule.honouree_name}…`}
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    lineHeight: 1.7,
                    marginBottom: '12px',
                  }}
                />
                <button
                  onClick={handleSaveStory}
                  disabled={storySaving || !storyText.trim()}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                    background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
                    color: '#1a0845', border: 'none',
                    cursor: storySaving || !storyText.trim() ? 'not-allowed' : 'pointer',
                    opacity: storySaving || !storyText.trim() ? 0.6 : 1,
                    letterSpacing: '0.04em', transition: 'all 0.2s',
                  }}
                >
                  {storySaving ? 'Saving…' : 'Save Story'}
                </button>

                {/* Story status */}
                {profileSections.find(s => s.section_type === 'story')?.is_active && (
                  <p style={{ fontSize: '11px', color: 'rgba(134,239,172,0.7)', marginTop: '8px' }}>
                    ✓ Story is live on your profile
                  </p>
                )}
              </SectionCard>

              {/* Coming soon sections */}
              <SectionCard title="Coming Soon" subtitle="More profile sections in next update">
                {['Gallery', 'Milestones', 'Quote', 'Video Reel'].map(name => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '8px', marginBottom: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize: '13px', color: textFaint }}>{name}</span>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: textFaint,
                      padding: '3px 8px', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>Soon</span>
                  </div>
                ))}
              </SectionCard>
            </div>
          )}

          {/* ─── SETTINGS TAB ─── */}
          {activeTab === 'settings' && (
            <div>
              <SectionCard title="Capsule Details" subtitle="How your capsule appears publicly">
                <EditField
                  label="Display Name"
                  value={capsule.honouree_name}
                  placeholder="Name as it appears on the tribute wall"
                  hint="This is the name contributors see when leaving a tribute."
                  onSave={async val => { await updateCapsule({ honouree_name: val }) }}
                />
                <EditField
                  label="Event Tag"
                  value={capsule.event_tag ?? ''}
                  placeholder="e.g. United In Love · 35 Years of Excellence"
                  hint="A short subtitle shown beneath the name on the tribute wall."
                  onSave={async val => { await updateCapsule({ event_tag: val }) }}
                />
                <EditField
                  label="Honouree Title"
                  value={capsule.honouree_title ?? ''}
                  placeholder="e.g. Dr · Chief · Pastor · Prof"
                  onSave={async val => { await updateCapsule({ honouree_title: val }) }}
                />
                <EditField
                  label="Event Date"
                  value={capsule.event_date ?? ''}
                  type="date"
                  hint="Used to calculate the anniversary reminder and days-to-event countdown."
                  onSave={async val => { await updateCapsule({ event_date: val }) }}
                />
                <EditField
                  label="Capsule URL"
                  value={capsule.slug}
                  placeholder="your-capsule-slug"
                  hint={`Your public link: itslegacycapsule.com/for/${capsule.slug}`}
                  onSave={async val => {
                    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
                    await updateCapsule({ slug: clean })
                  }}
                />
              </SectionCard>

              <SectionCard title="Family Representative" subtitle="Portal access for the event subject or family">
                <EditField
                  label="Representative Name"
                  value={(capsule as any).family_rep_name ?? ''}
                  placeholder="Name of the family rep or event subject"
                  onSave={async val => { await updateCapsule({ family_rep_name: val } as any) }}
                />
                <EditField
                  label="Representative Email"
                  value={(capsule as any).family_rep_email ?? ''}
                  type="email"
                  placeholder="Their email address"
                  hint="This person receives the Honouree Reveal and access to the private portal."
                  onSave={async val => { await updateCapsule({ family_rep_email: val } as any) }}
                />
              </SectionCard>

              {/* Upgrade card */}
              <UpgradeCard capsuleName={capsule.honouree_name} />
            </div>
          )}

        </div>

        {/* ═══════════════════════════════════════════════
            BOTTOM NAVIGATION
        ═══════════════════════════════════════════════ */}
        <BottomNav active={activeTab} onChange={setActiveTab} />

      </div>
    </>
  )
}

/* =========================================================
   EMAIL GATE — shown when no email in localStorage
========================================================= */
function EmailGate({ onEmail }: { onEmail: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handle = () => {
    if (!email.includes('@')) return
    setSubmitting(true)
    onEmail(email.trim())
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '40px' }}>
        <span style={{
          fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em',
          background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LEGACY</span>
        <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', marginLeft: '0.1em' }}>CAPSULE</span>
      </div>

      <div style={{
        width: '100%', maxWidth: '340px',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '20px',
        padding: '32px 28px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(226,195,107,0.1)',
          border: '1px solid rgba(226,195,107,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>◈</div>

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '20px', fontWeight: 700,
          color: textPrimary, marginBottom: '8px',
        }}>
          Organiser Access
        </h2>
        <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.65, marginBottom: '24px' }}>
          Enter the email address you used to create this capsule.
        </p>

        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{ ...inputStyle, marginBottom: '12px', textAlign: 'center' }}
          autoFocus
        />

        <button
          onClick={handle}
          disabled={!email.includes('@') || submitting}
          style={{
            width: '100%', padding: '12px',
            borderRadius: '10px', fontSize: '14px', fontWeight: 700,
            background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
            color: '#1a0845', border: 'none',
            cursor: !email.includes('@') ? 'not-allowed' : 'pointer',
            opacity: !email.includes('@') ? 0.55 : 1,
            letterSpacing: '0.04em', transition: 'all 0.2s',
          }}
        >
          Open Dashboard
        </button>
      </div>
    </div>
  )
}
