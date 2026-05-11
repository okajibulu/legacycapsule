"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import LogoCapsule from "@/components/LogoCapsule"

// ── EVENT TYPES ───────────────────────────────────────────
const EVENT_TYPES = [
  { key: "retirement",   label: "Retirement",            emoji: "🎓" },
  { key: "memorial",     label: "Memorial & Funeral",    emoji: "🕊️" },
  { key: "wedding",      label: "Wedding",               emoji: "💍" },
  { key: "birthday",     label: "Milestone Birthday",    emoji: "🎂" },
  { key: "anniversary",  label: "Anniversary",           emoji: "💛" },
  { key: "graduation",   label: "Graduation",            emoji: "🎓" },
  { key: "ordination",   label: "Ordination",            emoji: "✝️" },
  { key: "chieftaincy",  label: "Chieftaincy",           emoji: "👑" },
  { key: "award",        label: "Award Ceremony",        emoji: "🏆" },
  { key: "thanksgiving", label: "Thanksgiving Service",  emoji: "🙏" },
  { key: "conference",   label: "Conference",            emoji: "🎤" },
  { key: "other",        label: "Other Event",           emoji: "✨" },
]

// ── PACKAGES ─────────────────────────────────────────────
const PACKAGES = [
  {
    key:   "capture_preserve",
    label: "Capture & Preserve",
    desc:  "Tribute collection and Event Digital Publication",
    eur:   75,
    ngn:   60000,
  },
  {
    key:   "full_platform",
    label: "Full Platform",
    desc:  "All three pillars — Coordinate, Capture and Preserve",
    eur:   120,
    ngn:   100000,
  },
]

function getHonoureelabel(eventType: string): string {
  switch (eventType) {
    case "wedding":     return "Names of the couple"
    case "memorial":    return "In memory of"
    case "funeral":     return "In memory of"
    case "birthday":    return "Who is this celebration for"
    case "graduation":  return "Graduate's full name"
    case "ordination":  return "Ordinand's full name"
    case "chieftaincy": return "Title holder's full name"
    case "conference":  return "Conference or organisation name"
    default:            return "Name of the person being celebrated"
  }
}

// ── SLUG GENERATOR ────────────────────────────────────────
function generateSlug(honoreeName: string, eventType: string): string {
  const name = honoreeName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
  const year = new Date().getFullYear()
  return `${name}-${eventType}-${year}`
}

export default function BookPage() {
  const router = useRouter()

  // ── SCREEN STATE ─────────────────────────────────────────
  const [screen, setScreen] = useState(1)

  // ── FORM STATE ───────────────────────────────────────────
  const [visitorType,  setVisitorType]  = useState("")
  const [eventType,    setEventType]    = useState("")
  const [packageKey,   setPackageKey]   = useState("")
  const [guestCount,   setGuestCount]   = useState(300)
  const [honoreeName,  setHonoreeName]  = useState("")
  const [eventTag,     setEventTag]     = useState("")
  const [eventDate,    setEventDate]    = useState("")
  const [organizerEmail, setOrganizerEmail] = useState("")
  const [customSlug,   setCustomSlug]   = useState("")
  const [slugEdited,   setSlugEdited]   = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")

  // Auto-generate slug when name or event type changes
  const getSlug = () => {
    if (slugEdited) return customSlug
    if (honoreeName && eventType) return generateSlug(honoreeName, eventType)
    return ""
  }

  // Calculate total price
  const getTotal = () => {
    const pkg = PACKAGES.find(p => p.key === packageKey)
    if (!pkg) return { eur: 0, ngn: 0 }
    let eur = pkg.eur
    let ngn = pkg.ngn
    if (packageKey === "full_platform" && guestCount > 300) {
      const blocks = Math.ceil((guestCount - 300) / 200)
      eur += blocks * 30
      ngn += blocks * 25000
    }
    return { eur, ngn }
  }

  // ── CREATE CAPSULE ────────────────────────────────────────
const createCapsule = async () => {
  setLoading(true)
  setError("")

  const slug = getSlug()

  if (!slug || !honoreeName || !organizerEmail) {
    setError("Please fill in all required fields")
    setLoading(false)
    return
  }

  // Email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizerEmail)) {
    setError("Please enter a valid email address")
    setLoading(false)
    return
  }

  // Create community first
  const { data: community, error: commErr } = await supabase
    .from("communities")
    .insert({
      name:           honoreeName,
      slug:           slug + "-org",
      community_type: "event",
    })
    .select()
    .single()

  if (commErr) {
    setError("This Capsule URL is already taken — please customise it")
    setLoading(false)
    return
  }

  // Create capsule in pending_verification state
  const { data: capsule, error: capErr } = await supabase
    .from("capsules")
    .insert({
      community_id:    community.id,
      slug,
      honouree_name:   honoreeName,
      event_type:      eventType,
      event_tag:       eventTag || `CELEBRATING ${honoreeName.toUpperCase()}`,
      event_date:      eventDate || null,
      page_state:      "pending_verification",
      organiser_email: organizerEmail,
      theme:           "classic",
    })
    .select()
    .single()

  if (capErr) {
    setError("Could not create capsule. Please try again.")
    setLoading(false)
    return
  }

  // Send verification email
  await fetch("/api/email/verify-organiser", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email:       organizerEmail,
      capsuleId:   capsule.id,
      capsuleSlug: slug,
      honoreeName,
    }),
  })

  setLoading(false)
  setScreen(5)
}

  // ── STYLES ───────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:        "100%",
    padding:      "10px 14px",
    borderRadius: "10px",
    border:       "1px solid rgba(234,179,8,0.4)",
    background:   "rgba(255,255,255,0.08)",
    color:        "white",
    fontSize:     "14px",
    outline:      "none",
    WebkitTextFillColor: "white",
    WebkitBoxShadow:     "0 0 0px 1000px rgba(26,13,46,0.95) inset",
  }

  const btnPrimary = "w-full py-3 rounded-xl bg-gradient-to-b from-yellow-400 to-yellow-500 " +
    "text-purple-950 font-bold text-sm hover:from-yellow-300 transition-all"

  const btnSecondary = "w-full py-3 rounded-xl border border-yellow-400/30 " +
    "text-yellow-300/70 text-sm hover:border-yellow-400/60 hover:text-yellow-200 transition-all"

  // ── PROGRESS BAR ─────────────────────────────────────────
  const Progress = () => (
  <div className="space-y-3 mb-6">
    <div className="flex justify-between items-center">
      <a href="/" style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "12px",
        color:         "rgba(184,150,12,0.7)",
        textDecoration:"none",
        display:       "flex",
        alignItems:    "center",
        gap:           "4px",
      }}>
        ← Home
      </a>
      <p style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "10px",
        color:         "rgba(255,255,255,0.3)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}>
        LegacyCapsule
      </p>
    </div>
    <div className="flex gap-1.5">
      {[1,2,3,4].map(n => (
        <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300
          ${n <= screen ? "bg-yellow-400" : "bg-white/15"}`} />
      ))}
    </div>
        </div>

  )

  // ── SCREEN 1 — VISITOR TYPE ───────────────────────────────
if (screen === 1) return (
  <main style={{
    minHeight:      "100vh",
    background:     "linear-gradient(160deg, #0D0820 0%, #1A0F3E 50%, #0D0820 100%)",
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    padding:        "3rem 1.5rem",
    position:       "relative",
    overflow:       "hidden",
  }}>

    {/* Subtle background glow */}
    <div style={{
      position:      "absolute",
      top:           "30%",
      left:          "50%",
      transform:     "translate(-50%, -50%)",
      width:         "500px",
      height:        "500px",
      background:    "radial-gradient(circle, rgba(184,150,12,0.06) 0%, transparent 70%)",
      pointerEvents: "none",
    }} />

    <div style={{ width: "100%", maxWidth: "420px", position: "relative" }}>

      {/* Home link */}
      <div style={{ marginBottom: "2.5rem" }}>
        <a href="/" style={{
          fontFamily:    "var(--font-body)",
          fontSize:      "12px",
          color:         "rgba(184,150,12,0.7)",
          textDecoration:"none",
          letterSpacing: "0.05em",
          display:       "inline-flex",
          alignItems:    "center",
          gap:           "6px",
          transition:    "color 150ms ease",
        }}>
          ← Back to Home
        </a>
      </div>

      {/* LC Logo — centred */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
        <LogoCapsule size="md" />
      </div>

      {/* Gold rule */}
      <div style={{
        height:     "1px",
        background: "linear-gradient(90deg, transparent, rgba(184,150,12,0.5), transparent)",
        marginBottom: "2.5rem",
      }} />

      {/* Progress bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "2.5rem" }}>
        {[1,2,3,4].map(n => (
          <div key={n} style={{
            flex:         1,
            height:       "3px",
            borderRadius: "2px",
            background:   n <= screen
              ? "linear-gradient(90deg, #D4AE2A, #B8960C)"
              : "rgba(255,255,255,0.1)",
            transition:   "all 300ms ease",
            boxShadow:    n <= screen ? "0 0 6px rgba(184,150,12,0.4)" : "none",
          }} />
        ))}
      </div>

      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <p style={{
          fontFamily:    "var(--font-body)",
          fontSize:      "10px",
          fontWeight:    700,
          color:         "var(--lc-gold)",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          marginBottom:  "1rem",
          opacity:       0.8,
        }}>
          Step 1 of 4
        </p>
        <h1 style={{
          fontFamily:   "var(--font-heading)",
          fontSize:     "clamp(1.8rem, 5vw, 2.4rem)",
          fontWeight:   600,
          color:        "#FEFCE8",
          lineHeight:   1.2,
          marginBottom: "0.75rem",
          letterSpacing:"-0.01em",
        }}>
          How can we help?
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize:   "14px",
          color:      "rgba(254,252,232,0.45)",
          lineHeight: 1.6,
        }}>
          Choose your role to get started
        </p>
      </div>

      {/* Option buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "2rem" }}>
        {[
          {
            key:   "personal",
            label: "Personal Organiser",
            desc:  "I am arranging an event for someone I love",
            icon:  "🤍",
          },
          {
            key:   "professional",
            label: "Event Professional",
            desc:  "I use LegacyCapsule as part of my event services",
            icon:  "✦",
          },
          {
            key:   "gifter",
            label: "Gift a Capsule",
            desc:  "I want to give this experience as a gift",
            icon:  "🎁",
          },
        ].map(opt => (
          <button key={opt.key}
            onClick={() => { setVisitorType(opt.key); setScreen(2) }}
            style={{
              width:         "100%",
              textAlign:     "left",
              padding:       "22px 24px",
              borderRadius:  "16px",
              border:        visitorType === opt.key
                ? "1px solid rgba(184,150,12,0.7)"
                : "1px solid rgba(184,150,12,0.2)",
              background:    visitorType === opt.key
                ? "rgba(184,150,12,0.08)"
                : "rgba(255,255,255,0.03)",
              cursor:        "pointer",
              transition:    "all 200ms ease",
              boxShadow:     visitorType === opt.key
                ? "0 0 20px rgba(184,150,12,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
                : "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = "1px solid rgba(184,150,12,0.5)"
              e.currentTarget.style.background = "rgba(184,150,12,0.06)"
            }}
            onMouseLeave={e => {
              if (visitorType !== opt.key) {
                e.currentTarget.style.border = "1px solid rgba(184,150,12,0.2)"
                e.currentTarget.style.background = "rgba(255,255,255,0.03)"
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <span style={{ fontSize: "20px", marginTop: "2px", flexShrink: 0 }}>
                {opt.icon}
              </span>
              <div>
                <p style={{
                  fontFamily:   "var(--font-body)",
                  fontSize:     "15px",
                  fontWeight:   700,
                  color:        "#FEFCE8",
                  marginBottom: "6px",
                  letterSpacing:"0.01em",
                }}>
                  {opt.label}
                </p>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "13px",
                  color:      "rgba(254,252,232,0.4)",
                  lineHeight: 1.55,
                }}>
                  {opt.desc}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom gold rule */}
      <div style={{
        height:     "1px",
        background: "linear-gradient(90deg, transparent, rgba(184,150,12,0.3), transparent)",
        marginBottom: "1.5rem",
      }} />

      {/* Footer attribution */}
      <p style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "10px",
        color:         "rgba(255,255,255,0.15)",
        textAlign:     "center",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}>
        VALNEX, UNIPESSOAL LDA · RevoWorldTech
      </p>

    </div>
  </main>
)
  // ── SCREEN 2 — EVENT TYPE ─────────────────────────────────
  if (screen === 2) return (
    <main className="min-h-screen bg-[#0a0010] px-4 py-8">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] text-yellow-400/60 tracking-widest uppercase">
            LegacyCapsule
          </p>
          <h1 className="text-2xl font-bold text-yellow-100">
            What is the occasion?
          </h1>
        </div>
        <Progress />
        <div className="grid grid-cols-2 gap-3">
          {EVENT_TYPES.map(et => (
            <button key={et.key}
              onClick={() => { setEventType(et.key); setScreen(3) }}
              className={`flex flex-col items-center justify-center px-3 py-4 rounded-xl border transition-all duration-150
                ${eventType === et.key
                  ? "border-yellow-400/60 bg-yellow-400/10"
                  : "border-white/10 bg-white/4 hover:border-yellow-400/30"
                }`}>
<div style={{ textAlign: "center", width: "100%" }}>
  <p className="text-2xl mb-2">{et.emoji}</p>
  <p className="text-xs font-medium text-yellow-100 tracking-wide">{et.label}</p>
</div>
            </button>
          ))}
        </div>
        <button onClick={() => setScreen(1)} className={btnSecondary}>
          ← Back
        </button>
      </div>
    </main>
  )

  // ── SCREEN 3 — PACKAGE ────────────────────────────────────
  if (screen === 3) return (
    <main className="min-h-screen bg-[#0a0010] px-4 py-8">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] text-yellow-400/60 tracking-widest uppercase">
            LegacyCapsule
          </p>
          <h1 className="text-2xl font-bold text-yellow-100">
            Choose your package
          </h1>
        </div>
        <Progress />
        <div className="space-y-3">
          {PACKAGES.map(pkg => (
            <button key={pkg.key}
              onClick={() => setPackageKey(pkg.key)}
              className={`w-full text-left px-5 py-5 rounded-xl border transition-all duration-150                ${packageKey === pkg.key
                  ? "border-yellow-400/60 bg-yellow-400/10"
                  : "border-white/10 bg-white/4 hover:border-yellow-400/30"
                }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-100">{pkg.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{pkg.desc}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-sm font-bold text-yellow-300">€{pkg.eur}</p>
                  <p className="text-[10px] text-white/40">₦{pkg.ngn.toLocaleString()}</p>
                </div>
              </div>
            </button>
          ))}

          {packageKey === "full_platform" && (
            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase tracking-widest">
                Expected guest count
              </label>
              <input
                type="number"
                value={guestCount}
                min={1}
                onChange={e => setGuestCount(parseInt(e.target.value) || 300)}
                style={inputStyle}
              />
              {guestCount > 300 && (
                <p className="text-xs text-yellow-400/70">
                  +{Math.ceil((guestCount - 300) / 200)} guest extension block(s)
                </p>
              )}
            </div>
          )}
        </div>

        {packageKey && (
          <div className="px-4 py-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5">
            <div className="flex justify-between">
              <p className="text-sm text-white/60">Total</p>
              <div className="text-right">
                <p className="text-sm font-bold text-yellow-300">€{getTotal().eur}</p>
                <p className="text-[10px] text-white/40">₦{getTotal().ngn.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => { if (packageKey) setScreen(4) }}
          className={btnPrimary + (!packageKey ? " opacity-40 cursor-not-allowed" : "")}>
          Continue →
        </button>
        <button onClick={() => setScreen(2)} className={btnSecondary}>← Back</button>
      </div>
    </main>
  )
// ── SCREEN 5 — CHECK YOUR EMAIL ───────────────────────────
if (screen === 5) return (
  <main className="min-h-screen bg-[#0a0010] flex items-center justify-center px-4">
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="text-6xl">📬</div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-yellow-100">
          Check your email
        </h1>
        <p className="text-sm text-white/50 leading-relaxed">
          We sent a verification link to
        </p>
        <p className="text-sm font-semibold text-yellow-300">
          {organizerEmail}
        </p>
        <p className="text-sm text-white/50 leading-relaxed">
          Click the link in the email to activate your Capsule. 
          Check your spam folder if you do not see it within 
          a few minutes.
        </p>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
      <p className="text-xs text-white/25">
        LegacyCapsule · Every event. Preserved.
      </p>
    </div>
  </main>
)

  // ── SCREEN 4 — DETAILS & CONFIRM ──────────────────────────
  return (
    <main className="min-h-screen bg-[#0a0010] px-4 py-8">
      <div className="w-full max-w-sm mx-auto space-y-5">
        <div className="text-center space-y-1">
          <p className="text-[10px] text-yellow-400/60 tracking-widest uppercase">
            LegacyCapsule
          </p>
          <h1 className="text-2xl font-bold text-yellow-100">
            Your Capsule details
          </h1>
        </div>
        <Progress />

        <div className="space-y-3">

          {/* Honouree name */}
<div className="space-y-1">
  <label className="text-[10px] text-white/40 uppercase tracking-widest">
    {getHonoureelabel(eventType)} *
  </label>
  <input
    type="text"
    placeholder={
  eventType === "wedding"
    ? "e.g. James Whitfield & Elena Fontaine"
    : eventType === "conference"
    ? "e.g. Global Leadership Summit 2026"
    : eventType === "chieftaincy"
    ? "e.g. Chief James Alexander Whitfield"
    : eventType === "ordination"
    ? "e.g. Reverend James Alexander Whitfield"
    : eventType === "memorial" || eventType === "funeral"
    ? "e.g. James Alexander Whitfield"
    : eventType === "graduation"
    ? "e.g. Dr. James Alexander Whitfield"
    : "e.g. James Alexander Whitfield"
}
    value={honoreeName}
    maxLength={80}
    onChange={e => {
      setHonoreeName(e.target.value)
      if (!slugEdited) setCustomSlug(generateSlug(e.target.value, eventType))
    }}
    style={inputStyle}
  />
  <p className="text-[10px] text-white/25 text-right">{honoreeName.length}/80</p>
</div>

          {/* Event tag */}
<div className="space-y-1">
  <label className="text-[10px] text-white/40 uppercase tracking-widest">
    Event tag line
  </label>
  <input
    type="text"
    placeholder="e.g. Celebrating a Remarkable Journey"
    value={eventTag}
    maxLength={80}
    onChange={e => setEventTag(e.target.value)}
    style={inputStyle}
  />
  <p className="text-[10px] text-white/25 text-right">{eventTag.length}/80</p>
</div>

          {/* Event date */}
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest">
              Event date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Organizer email */}
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest">
              Your email *
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={organizerEmail}
              onChange={e => setOrganizerEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Slug */}
<div className="space-y-1">
  <label className="text-[10px] text-white/40 uppercase tracking-widest">
    Capsule URL
  </label>
  <p className="text-[10px] text-white/30 leading-relaxed">
    This is the unique web address for your Capsule. 
    Contributors will use this link to leave their tributes.
  </p>

  {/* Live preview */}
  <div className="px-3 py-2 rounded-lg bg-yellow-400/5 border border-yellow-400/15">
    <p className="text-[10px] text-white/30 mb-0.5">Your Capsule will be at:</p>
    <p className="text-xs text-yellow-300 break-all">
      itslegacycapsule.com/capsule/
      <span className="font-bold">
        {getSlug() || "your-capsule-url"}
      </span>
      {" "}
      <span className="text-yellow-400/40">?</span>
    </p>
  </div>

  {/* Editable slug ending */}
  <div className="space-y-1">
    <p className="text-[10px] text-white/25">
      Customise the ending if needed:
    </p>
    <input
      type="text"
      value={getSlug()}
      maxLength={60}
      onChange={e => { setCustomSlug(e.target.value); setSlugEdited(true) }}
      style={{ ...inputStyle, fontSize: "12px" }}
    />
    <p className="text-[10px] text-white/25 text-right">
      {getSlug().length}/60
    </p>
  </div>
</div>

        </div>

        {/* Summary */}
        <div className="px-4 py-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Package</span>
            <span className="text-yellow-100">
              {PACKAGES.find(p => p.key === packageKey)?.label}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Event type</span>
            <span className="text-yellow-100 capitalize">{eventType}</span>
          </div>
          <div className="flex justify-between text-sm font-bold mt-1">
            <span className="text-white/60">Total</span>
            <span className="text-yellow-300">€{getTotal().eur}</span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <button onClick={createCapsule} disabled={loading}
          className={btnPrimary + (loading ? " opacity-50 cursor-not-allowed" : "")}>
          {loading ? "Creating your Capsule…" : "Create Capsule →"}
        </button>

        <p className="text-[10px] text-white/25 text-center">
          Payment integration coming — capsule created immediately for now
        </p>

        <button onClick={() => setScreen(3)} className={btnSecondary}>← Back</button>
      </div>
    </main>
  )
}