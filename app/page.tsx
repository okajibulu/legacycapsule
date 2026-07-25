"use client"

/* ============================================================
   HOMEPAGE — LegacyCapsule
   Sections:
   1. Hero — animated world map, tagline, dual CTA
   2. Emotional promise — one paragraph
   3. Three pillars — visual
   4. Event type showcase — rotating
   5. Social proof strip
   6. Audience routing — 5 cards (3+2 grid)
   7. How it works — 3 steps
   8. Final CTA
   ============================================================ */

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import AnimatedWorldMap from "@/components/AnimatedWorldMap"

/* ============================================================
   ANIMATED WORLD MAP — Canvas implementation
   Gold pulses from multiple world cities, narrative arc:
   West Africa → UK → North America → rest of world
   ============================================================ */

const ROTATING_LINES = [
  'Bring Family & Friends Together',
  'Collect Tributes From Anywhere',
  'Capture Stories That Would Otherwise Be Lost',
  'Worldwide Tribute Collection',
  'Live World Map of Your Guests',
  'Every Memory Has A Place',
  'Guest Video Moments — Captured Live',
  'Turn Memories Into A Lasting Publication',
  'Live Tribute Wall On Event Day',
  'Celebrate Life\'s Most Meaningful Moments',
  'Full Guest List & RSVP Management',
  'Regular & VIP Guest Tiers',
  'Access Codes & Table Seating Plans',
  'Fabric & Attire Coordination',
  'Publication Shared With Every Guest',
  'Permanent Digital Memory Archive',
]

// ============================================================
// HOMEPAGE LIVE DATA
// ============================================================
function useHomepageData() {
  const [stats,    setStats]    = useState<Record<string, string>>({})
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/homepage/stats')
      .then(r => r.json())
      .then(d => {
        if (d.stats)    setStats(d.stats)
        if (d.featured) setFeatured(d.featured)
      })
      .catch(() => {}) // silent -- homepage must never break
  }, [])

  return { stats, featured }
}

function RotatingEventType() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent((c) => (c + 1) % ROTATING_LINES.length)
        setVisible(true)
      }, 400)
    }, 4200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      textAlign:     "center",
      opacity:       visible ? 1 : 0,
      transform:     visible ? "translateY(0)" : "translateY(-8px)",
      transition:    "all 0.4s ease",
      minHeight:     "1.4em",
      display:       "flex",
      alignItems:    "center",
      justifyContent: "center",
    }}>
      <p style={{
        fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
        fontStyle: 'italic',
        fontWeight: 600,
        fontSize: 'clamp(1.1rem, 2.6vw, 1.6rem)',
        letterSpacing: '0.02em',
        color: '#D4AE2A',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: 'rgba(184,150,12,0.6)', marginRight: '0.5em' }}>✦</span>
        {ROTATING_LINES[current]}
      </p>
    </div>
  )
}

/* ============================================================
   AUDIENCE ROUTING CARDS
   ============================================================ */

const ROUTING_CARDS = [
  /* Row 1 — For an upcoming event */
  {
    id:       "personal",
    href:     "/for-you",
    headline: "I have an event to organise",
    sub:      "For families and individuals creating a Capsule for someone special",
    icon:     "◇",
    color:    "#C4956A",
    bg:       "rgba(196, 149, 106, 0.06)",
    border:   "rgba(196, 149, 106, 0.2)",
    cta:      "Start Your Capsule →",
    mood:     "warm",
  },
  {
    id:       "gift",
    href:     "/gift",
    headline: "I want to gift this to someone",
    sub:      "Give a preserved memory — for an event you're attending or a moment worth capturing",
    icon:     "◈",
    color:    "var(--lc-gold)",
    bg:       "rgba(184, 150, 12, 0.06)",
    border:   "rgba(184, 150, 12, 0.25)",
    cta:      "Gift a Capsule →",
    mood:     "generous",
  },
  {
    id:       "professional",
    href:     "/for-planners",
    headline: "I plan events for clients",
    sub:      "Elevate your service and deliver a premium publication your clients will treasure",
    icon:     "◉",
    color:    "#8B9FD4",
    bg:       "rgba(139, 159, 212, 0.06)",
    border:   "rgba(139, 159, 212, 0.2)",
    cta:      "Explore Planner Features →",
    mood:     "professional",
  },
  /* Row 2 — For your planning journey */
  {
    id:       "aspiring",
    href:     "/start-planning",
    headline: "I want to start planning events",
    sub:      "Your first Capsule is your first portfolio piece — no experience needed to begin",
    icon:     "◐",
    color:    "#7EC8A4",
    bg:       "rgba(126, 200, 164, 0.06)",
    border:   "rgba(126, 200, 164, 0.2)",
    cta:      "Begin Your Journey →",
    mood:     "aspiring",
  },
  {
    id:       "reseller",
    href:     "/resellers",
    headline: "I want to earn by growing the LC network",
    sub:      "Apply to become a certified LegacyCapsule reseller — train, certify, and build your client network",
    icon:     "◎",
    color:    "#B4A0D8",
    bg:       "rgba(180, 160, 216, 0.06)",
    border:   "rgba(180, 160, 216, 0.2)",
    cta:      "Apply as a Reseller →",
    mood:     "entrepreneurial",
  },
]

function RoutingCard({ card, index }: { card: typeof ROUTING_CARDS[0]; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={card.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       "block",
        background:    hovered ? card.bg : "rgba(255,255,255,0.02)",
        border:        `1px solid ${hovered ? card.border : "rgba(255,255,255,0.06)"}`,
        borderRadius:  "var(--radius-lg)",
        padding:       "var(--space-8)",
        transition:    "all var(--transition-base)",
        transform:     hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow:     hovered
          ? `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${card.border}`
          : "0 2px 8px rgba(0,0,0,0.15)",
        animationDelay: `${index * 80}ms`,
        cursor:         "pointer",
        textDecoration: "none",
      }}
      className="animate-fade-up"
    >
      {/* Icon */}
      <div style={{
        width:          "44px",
        height:         "44px",
        borderRadius:   "50%",
        background:     `${card.bg}`,
        border:         `1px solid ${card.border}`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       "var(--text-lg)",
        color:          card.color,
        marginBottom:   "var(--space-5)",
        transition:     "all var(--transition-base)",
        transform:      hovered ? "scale(1.1)" : "scale(1)",
        boxShadow:      hovered ? `0 0 16px ${card.bg}` : "none",
      }}>
        {card.icon}
      </div>

      {/* Headline */}
      <div style={{
        fontFamily:   "var(--font-heading)",
        fontSize:     "clamp(var(--text-lg), 2vw, var(--text-xl))",
        fontWeight:   600,
        color:        "var(--lc-ivory)",
        lineHeight:   1.3,
        marginBottom: "var(--space-3)",
      }}>
        {card.headline}
      </div>

      {/* Sub */}
      <div style={{
        fontFamily: "var(--font-body)",
        fontSize:   "var(--text-sm)",
        color:      "rgba(245,243,238,0.55)",
        lineHeight: 1.65,
        marginBottom: "var(--space-6)",
      }}>
        {card.sub}
      </div>

      {/* CTA */}
      <div style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "var(--text-xs)",
        fontWeight:    600,
        color:         hovered ? card.color : "rgba(245,243,238,0.35)",
        letterSpacing: "var(--tracking-wide)",
        transition:    "color var(--transition-fast)",
      }}>
        {card.cta}
      </div>
    </Link>
  )
}

/* ============================================================
   THREE PILLARS
   ============================================================ */
const PILLARS = [
  {
    label:    "PLAN",
    headline: "Plan & coordinate every event detail",
    body:     "Guest invitations, RSVP management, VIP coordination, Access codes, seating plans, attire/fabric coordination & event communications - all in one place.",
    color:    "#8B9FD4",
    number:   "01",
  },
  {
    label:    "CAPTURE",
    headline: "Capture every memory from friends & family",
    body:     "Collect worldwide tributes, stories, photos, videos & live event moments from event d-day guests and family members.",
    color:    "var(--lc-gold)",
    number:   "02",
  },
  {
    label:    "PRESERVE",
    headline: "A permanent record, beautifully made",
    body:     "The Event Premium Digital Publication — a curated commemorative documentation of all moments & memories, generated & sent to every contributor.",
    color:    "#7EC8A4",
    number:   "03",
  },
]

/* ============================================================
   SOCIAL PROOF STRIP
   ============================================================ */
// STATS are populated dynamically from /api/homepage/stats
// Default values shown before fetch completes
const STATS_DEFAULT = [
  { key: "tributes", label: "Tributes Collected" },
  { key: "capsules", label: "Events Preserved"  },
  { key: "static1",  label: "Free to Start"     },
]

/* ============================================================
   HOW IT WORKS STEPS
   ============================================================ */
const STEPS = [
  {
    number: "01",
    title:  "Create your Capsule",
    body:   "Set up in minutes. Add a photo, the event details, and context. Share your link or QR code to start gathering voices from anywhere in the world — before the event happens. Your tribute wall goes live immediately.",
    cta:    null,
  },
  {
    number: "02",
    title:  "Coordinate and Capture",
    body:   "Manage guests, seating, fabric and attire orders, and access control from one dashboard. On the day, share your QR code — guests upload photos, videos, messages, and tributes instantly. Everything in one structured space.",
    cta:    null,
  },
  {
    number: "03",
    title:  "Preserve forever",
    body:   "Turn everything into the LegacyCapsule Event Digital Publication — a beautifully structured commemorative document. Download, share, and send to guests and loved ones. Yours to keep, forever.",
    cta:    "See a live example →",
  },
]

/* ============================================================
   MAIN PAGE COMPONENT
   ============================================================ */
export default function HomePage() {
  const { stats, featured } = useHomepageData()

  return (
    <>

      {/* ── SECTION 1: HERO ─────────────────────────────── */}
{/* ── SECTION 1: HERO ── */}
<section style={{
  position:  "relative",
  height:    "100vh",
  minHeight: "680px",
  overflow:  "hidden",
  background: "#0f0a1e",
}}>

  {/* Real world map — full background */}
  <div style={{ position: "absolute", inset: 0 }}>
    <AnimatedWorldMap mode="hero" showOverlay={false} className="w-full h-full" />
  </div>

  {/* Radial gloss sheen — centre glow */}
  <div style={{
    position:      "absolute",
    inset:         0,
    background:    "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(184,150,12,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  }} />

  {/* Bottom fade to next section */}
  <div style={{
    position:      "absolute",
    bottom:        0,
    left:          0,
    right:         0,
    height:        "30%",
background: "linear-gradient(to top, var(--lc-ivory) 0%, transparent 100%)",    pointerEvents: "none",
  }} />

  {/* Hero content — centred */}
  <div style={{
    position:       "absolute",
    inset:          0,
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    textAlign:      "center",
    padding:        "0 1.5rem",
    paddingTop:     "var(--nav-height)",
    transform:      "translateY(-3vh)",
  }}>

    {/* Hero text block */}
    <div className="flex flex-col items-center text-center z-20 px-6 pointer-events-none"
      style={{ gap: '1.08rem' }}>

      {/* Gold label */}
      <p style={{
        fontFamily: 'var(--font-accent, "Cormorant SC", serif)',
        fontSize: '12px',
        letterSpacing: '0.35em',
        color: '#D4AE2A',
        textTransform: 'uppercase',
        opacity: 1,
        textShadow: '0 1px 10px rgba(0,0,0,0.95), 0 0 28px rgba(0,0,0,0.8)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45em',
      }}>
        <span style={{ color: '#B8960C', fontSize: '14px' }}>•</span>
        PLAN
     <span style={{ color: '#B8960C', fontSize: '14px' }}>•</span>
         CAPTURE
        <span style={{ color: '#B8960C', fontSize: '14px' }}>•</span>
          PRESERVE
        <span style={{ color: '#B8960C', fontSize: '14px' }}>•</span>
      </p>

{/* Main headline */}

<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15em' }}>
  <span style={{
    fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
    fontSize: 'clamp(2.6rem, 6vw, 5rem)',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.74)',
    letterSpacing: '0.02em',
    lineHeight: 1.05,
    textShadow: '0 2px 12px rgba(0,0,0,0.9)',
  }}>
    Events end.
  </span><span style={{
fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
fontSize: 'clamp(2.6rem, 6vw, 5rem)',
fontWeight: 700,
letterSpacing: '0.02em',
lineHeight: 1.05,
textShadow: '0 0 40px rgba(184,150,12,0.35), 0 2px 12px rgba(0,0,0,0.9)',
}}>
<span style={{ color: '#D4AE2A' }}>Legacies</span>
<span style={{ color: '#FFFFFF' }}> don't.</span>
</span>

</div>{/* Hero explanation */}

<p style={{
  fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  fontSize: 'clamp(0.95rem, 1.7vw, 1.08rem)',
  color: 'rgba(255,255,255,0.82)',
  fontWeight: 400,
  letterSpacing: '0.01em',
  maxWidth: '620px',
  lineHeight: 1.8,
  margin: '18px auto 0',
  textAlign: 'center',
}}>
  From planning of events to preserving the memories they create, 
  LegacyCapsule gives the edge your premium event deserves.
</p>{/* Rotating capability / outcome line */}

<div style={{
  height: '2.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '18px',
}}>
  <RotatingEventType />
</div>





      {/* CTAs — pointer-events-auto so they remain clickable */}
      <div style={{ display: 'flex', gap: '1rem', pointerEvents: 'auto', marginTop: '0.5rem' }}>
        <Link href="/book" className="btn-primary btn-primary-lg"
          style={{ pointerEvents: "auto" }}>
          Start Your Capsule
        </Link>
        <Link href="/#showcase"
          style={{
            display:       "inline-flex",
            alignItems:    "center",
            justifyContent:"center",
            padding:       "12px 28px",
            background:    "rgba(255,255,255,0.06)",
            backdropFilter:"blur(12px)",
            color:         "rgba(254,252,232,0.85)",
            fontFamily:    "var(--font-body)",
            fontSize:      "var(--text-base)",
            fontWeight:    600,
            letterSpacing: "var(--tracking-wide)",
            borderRadius:  "var(--radius-full)",
            border:        "1px solid rgba(184,150,12,0.35)",
            textDecoration:"none",
            transition:    "all var(--transition-fast)",
            pointerEvents: "auto",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(184,150,12,0.12)"
            e.currentTarget.style.borderColor = "rgba(184,150,12,0.6)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)"
            e.currentTarget.style.borderColor = "rgba(184,150,12,0.35)"
          }}
        >
          See It In Action
        </Link>
      </div>

      <p style={{
        fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
        fontSize: '10px',
        letterSpacing: '0.2em',
        padding: '0 1.0rem',
        color: 'rgba(255,255,255,0.75)',
        textTransform: 'uppercase',
        textAlign: 'center',
        margin: 0,
      }}>
        FOR EVENT PROFESSIONALS & FAMILIES
        <span style={{
          color: '#B8960C',
          fontSize: '18px',
          lineHeight: '1',
          verticalAlign: 'middle',
          margin: '0 0.6em',
        }}>·</span>
        <span style={{ color: '#D4AE2A' }}>
          YOUR TRIBUTE WALL LIVE IN MINUTES FOR FREE
        </span>
      </p>

    </div>

    {/* Scroll indicator */}
    <div style={{
      position:  "absolute",
      bottom:    "2rem",
      left:      "50%",
      transform: "translateX(-50%)",
      display:   "flex",
      flexDirection: "column",
      alignItems:"center",
      gap:       "0.5rem",
    }}>
      <p style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "0.6rem",
        color:         "rgba(184,150,12,0.5)",
        letterSpacing: "var(--tracking-ceremony)",
        textTransform: "uppercase",
      }}>
        Scroll
      </p>
      <svg width="16" height="24" viewBox="0 0 16 24" fill="none"
        style={{ animation: "scrollBounce 2s ease-in-out infinite" }}>
        <path d="M8 0 L8 16 M2 10 L8 16 L14 10"
          stroke="rgba(184,150,12,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

  </div>
</section>

      {/* ── SECTION 2: EMOTIONAL PROMISE ────────────────── */}
      <section className="section-white" style={{ padding: "var(--space-24) 0" }}>
        <div className="container" style={{ maxWidth: "var(--max-width-prose)", textAlign: "center" }}>
          <div className="gold-rule" style={{ marginBottom: "var(--space-8)" }}>
            <div className="gold-rule-diamond" />
          </div>
          <p style={{
            fontFamily:   "var(--font-heading)",
            fontSize:     "clamp(var(--text-xl), 2.0vw, var(--text-3xl))",
            fontWeight:   300,
            fontStyle:    "italic",
            color:        "var(--lc-charcoal)",
            lineHeight:   1.55,
            letterSpacing: "-0.01em",
          }}>
            LegacyCapsule serves as a one-stop centre to help event organisers deliver a premium event. By providing various coordinative services, in addition to 
            capturing every voice, every story and every meaningful moment of friends and family members - transforming the event into a lasting legacy through a beautiful digital publication sent to everyone at the end of the event.
          </p>
          <div className="gold-rule" style={{ marginTop: "var(--space-8)" }}>
            <div className="gold-rule-diamond" />
          </div>
        </div>
      </section>

      {/* ── SECTION 3: THREE PILLARS ────────────────────── */}
      <section className="section-ivory" style={{ padding: "var(--space-24) 0" }}>
        <div className="container">

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: "var(--space-16)" }}>
            <div className="type-event-tag" style={{ marginBottom: "var(--space-4)", color: "var(--lc-purple)" }}>
              The Three Pillars
            </div>
            <h2 className="type-heading-xl" style={{ color: "var(--lc-purple)", maxWidth: "600px", margin: "0 auto" }}>
              One platform. Every dimension of your event.
            </h2>
          </div>

          {/* Pillars grid */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:                 "var(--space-6)",
          }}>
            {PILLARS.map((pillar, i) => (
              <div
                key={pillar.label}
                className="card animate-fade-up"
                style={{
                  padding:       "var(--space-10)",
                  background:    "var(--lc-white)",
                  animationDelay: `${i * 150}ms`,
                  position:      "relative",
                  overflow:      "hidden",
                }}
              >
                {/* Number watermark */}
                <div style={{
                  position:      "absolute",
                  top:           "var(--space-4)",
                  right:         "var(--space-6)",
                  fontFamily:    "var(--font-display)",
                  fontSize:      "var(--text-7xl)",
                  fontWeight:    700,
                  color:         "rgba(45,27,105,0.04)",
                  lineHeight:    1,
                  pointerEvents: "none",
                }}>
                  {pillar.number}
                </div>

                {/* Colour accent line */}
                <div style={{
                  width:        "32px",
                  height:       "3px",
                  background:   pillar.color,
                  borderRadius: "2px",
                  marginBottom: "var(--space-6)",
                }} />

                <div className="type-event-tag" style={{ color: pillar.color, marginBottom: "var(--space-3)" }}>
                  {pillar.label}
                </div>

                <h3 className="type-heading-sm" style={{ color: "var(--lc-charcoal)", marginBottom: "var(--space-4)" }}>
                  {pillar.headline}
                </h3>

                <p className="type-body" style={{ color: "var(--lc-mid)" }}>
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: EVENT TYPES SHOWCASE ─────────────── */}
      <section style={{
        padding:    "var(--space-16) 0",
        background: "var(--lc-purple)",
        overflow:   "hidden",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div className="type-event-tag" style={{ marginBottom: "var(--space-4)" }}>
            Built for every occasion
          </div>
          <div style={{ marginBottom: "var(--space-2)" }}>
            <RotatingEventType />
          </div>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize:   "var(--text-sm)",
            color:      "rgba(245,243,238,0.45)",
            marginTop:  "var(--space-4)",
          }}>
            Retirement · Wedding · Graduation · Memorial · Ordination · Chieftaincy · Award · Anniversary · and more
          </p>
        </div>
      </section>

      {/* ── SECTION 5: SOCIAL PROOF ─────────────────────── */}
      <section style={{
        padding:    "var(--space-16) 0",
        background: "var(--lc-purple-deep)",
        borderTop:  "1px solid rgba(184,150,12,0.15)",
        borderBottom: "1px solid rgba(184,150,12,0.15)",
      }}>
        <div className="container">
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap:                 "var(--space-8)",
            textAlign:           "center",
          }}>
            {STATS_DEFAULT.map((stat) => {
              const value = stat.key === 'static1'
                ? 'FREE'
                : stats[stat.key] ?? '...'
              return (
                <div key={stat.label}>
                  <div style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "clamp(var(--text-2xl), 3vw, var(--text-4xl))",
                    fontWeight:    200,
                    color:         "var(--lc-gold)",
                    letterSpacing: "var(--tracking-tight)",
                    marginBottom:  "var(--space-2)",
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontFamily:    "var(--font-body)",
                    fontSize:      "var(--text-xs)",
                    color:         "rgba(245,243,238,0.5)",
                    letterSpacing: "var(--tracking-widest)",
                    textTransform: "uppercase",
                  }}>
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: AUDIENCE ROUTING ─────────────────── */}
      <section className="section-deep" style={{ padding: "var(--space-24) 0" }}>
        <div className="container">

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: "var(--space-16)" }}>
            <div className="type-event-tag" style={{ marginBottom: "var(--space-4)" }}>
              Find your path
            </div>
            <h2 className="type-heading-xl" style={{ color: "var(--lc-ivory)", maxWidth: "540px", margin: "0 auto var(--space-4)" }}>
              LegacyCapsule is built for you
            </h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize:   "var(--text-md)",
              color:      "rgba(245,243,238,0.5)",
              maxWidth:   "460px",
              margin:     "0 auto",
            }}>
              Tell us where you are and we'll show you exactly what matters to you.
            </p>
          </div>

          {/* Row 1 label */}
          <div style={{
            fontFamily:    "var(--font-body)",
            fontSize:      "var(--text-xs)",
            fontWeight:    600,
            color:         "rgba(184,150,12,0.6)",
            letterSpacing: "var(--tracking-widest)",
            textTransform: "uppercase",
            marginBottom:  "var(--space-5)",
            display:       "flex",
            alignItems:    "center",
            gap:           "var(--space-4)",
          }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(184,150,12,0.15)" }} />
            For an upcoming event
            <div style={{ flex: 1, height: "1px", background: "rgba(184,150,12,0.15)" }} />
          </div>

          {/* Row 1 — 3 cards */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap:                 "var(--space-5)",
            marginBottom:        "var(--space-10)",
          }}>
            {ROUTING_CARDS.slice(0, 3).map((card, i) => (
              <RoutingCard key={card.id} card={card} index={i} />
            ))}
          </div>

          {/* Row 2 label */}
          <div style={{
            fontFamily:    "var(--font-body)",
            fontSize:      "var(--text-xs)",
            fontWeight:    600,
            color:         "rgba(184,150,12,0.6)",
            letterSpacing: "var(--tracking-widest)",
            textTransform: "uppercase",
            marginBottom:  "var(--space-5)",
            display:       "flex",
            alignItems:    "center",
            gap:           "var(--space-4)",
          }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(184,150,12,0.15)" }} />
            For your planning journey
            <div style={{ flex: 1, height: "1px", background: "rgba(184,150,12,0.15)" }} />
          </div>

          {/* Row 2 — 2 cards, centred */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap:                 "var(--space-5)",
            maxWidth:            "720px",
            margin:              "0 auto",
          }}>
            {ROUTING_CARDS.slice(3).map((card, i) => (
              <RoutingCard key={card.id} card={card} index={i + 3} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: HOW IT WORKS ─────────────────────── */}
      <section className="section-white" style={{ padding: "var(--space-24) 0" }}>
        <div className="container">

          <div style={{ textAlign: "center", marginBottom: "var(--space-16)" }}>
            <div className="type-event-tag" style={{ color: "var(--lc-purple)", marginBottom: "var(--space-4)" }}>
              How It Works
            </div>
            <h2 className="type-heading-xl" style={{ color: "var(--lc-purple)" }}>
              Three steps. One complete record.
            </h2>
          </div>

          <div style={{
            display:   "flex",
            flexDirection: "column",
            gap:       "var(--space-1)",
            maxWidth:  "860px",
            margin:    "0 auto",
          }}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                style={{
                  display:       "grid",
                  gridTemplateColumns: "80px 1fr",
                  gap:           "var(--space-8)",
                  padding:       "var(--space-10) 0",
                  borderBottom:  i < STEPS.length - 1 ? "1px solid rgba(45,27,105,0.08)" : "none",
                  alignItems:    "start",
                }}
              >
                {/* Step number */}
                <div>
                  <div style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "var(--text-4xl)",
                    fontWeight:    600,
                    color:         "rgba(45,27,105,0.12)",
                    lineHeight:    1,
                  }}>
                    {step.number}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width:        "1px",
                      height:       "40px",
                      background:   "linear-gradient(to bottom, rgba(184,150,12,0.3), transparent)",
                      margin:       "var(--space-3) auto 0",
                    }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ paddingTop: "4px" }}>
                  <h3 style={{
                    fontFamily:   "var(--font-heading)",
                    fontSize:     "clamp(var(--text-xl), 2vw, var(--text-2xl))",
                    fontWeight:   600,
                    color:        "var(--lc-purple)",
                    marginBottom: "var(--space-3)",
                  }}>
                    {step.title}
                  </h3>
                  <p className="type-body-lg" style={{ color: "var(--lc-mid)", marginBottom: step.cta ? "var(--space-5)" : 0 }}>
                    {step.body}
                  </p>
                  {step.cta && (
                    <Link href="/#showcase" style={{
                      fontFamily:    "var(--font-body)",
                      fontSize:      "var(--text-sm)",
                      fontWeight:    600,
                      color:         "var(--lc-gold)",
                      letterSpacing: "var(--tracking-wide)",
                      transition:    "opacity var(--transition-fast)",
                    }}>
                      {step.cta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: SHOWCASE ─────────────────────────── */}
      <section id="showcase" style={{
        padding:    "var(--space-24) 0",
        background: "var(--lc-purple-deep)",
        borderTop:  "1px solid rgba(184,150,12,0.12)",
      }}>
        <div className="container">

          <div style={{ textAlign: "center", marginBottom: "var(--space-16)" }}>
            <div className="type-event-tag" style={{ marginBottom: "var(--space-4)" }}>
              Events We Have Hosted
            </div>
            <h2 className="type-heading-xl" style={{ color: "var(--lc-ivory)", maxWidth: "600px", margin: "0 auto var(--space-4)" }}>
              Real events. Real stories. Real legacies.
            </h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize:   "var(--text-md)",
              color:      "rgba(245,243,238,0.45)",
              maxWidth:   "480px",
              margin:     "0 auto",
              lineHeight: 1.7,
            }}>
              LegacyCapsule is grateful to have been trusted to preserve the following events.
            </p>
          </div>

          {featured.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-16)" }}>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize:   "var(--text-sm)",
                color:      "rgba(245,243,238,0.25)",
                fontStyle:  "italic",
              }}>
                Our first showcased events are coming soon.
              </p>
            </div>
          ) : (
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap:                 "var(--space-5)",
            }}>
              {featured.map((cap: any) => {
                const year = cap.event_date ? new Date(cap.event_date).getFullYear() : null
                return (
                  <div key={cap.slug} style={{
                    borderRadius: "14px",
                    overflow:     "hidden",
                    border:       "1px solid rgba(184,150,12,0.15)",
                    background:   "rgba(255,255,255,0.03)",
                  }}>
                    {/* Event image */}
                    <div style={{
                      height:     "160px",
                      background: cap.hero_image_url
                        ? `url(${cap.hero_image_url}) center/cover no-repeat`
                        : "linear-gradient(135deg, rgba(45,27,105,0.8), rgba(15,10,30,0.9))",
                      position:   "relative",
                    }}>
                      {/* Event type badge */}
                      <div style={{
                        position:      "absolute",
                        top:           "10px",
                        left:          "10px",
                        padding:       "3px 10px",
                        borderRadius:  "20px",
                        background:    "rgba(15,10,30,0.75)",
                        backdropFilter: "blur(8px)",
                        fontSize:      "9px",
                        fontWeight:    700,
                        color:         "rgba(226,195,107,0.8)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}>
                        {cap.event_type}
                      </div>
                    </div>

                    {/* Card content */}
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{
                        fontFamily:   "var(--font-heading)",
                        fontSize:     "var(--text-md)",
                        fontWeight:   700,
                        color:        "rgba(245,243,238,0.9)",
                        margin:       "0 0 4px",
                        lineHeight:   1.3,
                      }}>
                        {cap.honouree_name}
                      </p>
                      {cap.event_tag && (
                        <p style={{
                          fontFamily: "var(--font-body)",
                          fontSize:   "var(--text-xs)",
                          color:      "rgba(184,150,12,0.65)",
                          margin:     "0 0 10px",
                        }}>
                          {cap.event_tag}
                        </p>
                      )}
                      <div style={{
                        display:    "flex",
                        gap:        "12px",
                        alignItems: "center",
                        flexWrap:   "wrap",
                      }}>
                        {cap.tribute_count > 0 && (
                          <span style={{
                            fontSize:   "10px",
                            color:      "rgba(245,243,238,0.35)",
                            fontFamily: "var(--font-body)",
                          }}>
                            {cap.tribute_count} tribute{cap.tribute_count !== 1 ? "s" : ""}
                          </span>
                        )}
                        {cap.city && (
                          <span style={{
                            fontSize:   "10px",
                            color:      "rgba(245,243,238,0.35)",
                            fontFamily: "var(--font-body)",
                          }}>
                            {cap.city}
                          </span>
                        )}
                        {year && (
                          <span style={{
                            fontSize:   "10px",
                            color:      "rgba(245,243,238,0.35)",
                            fontFamily: "var(--font-body)",
                          }}>
                            {year}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 9: FINAL CTA ────────────────────────── */}
      <section style={{
        padding:    "var(--space-32) 0",
        background: "var(--lc-purple)",
        position:   "relative",
        overflow:   "hidden",
        textAlign:  "center",
      }}>
        {/* Background glow */}
        <div style={{
          position:      "absolute",
          top:           "50%",
          left:          "50%",
          transform:     "translate(-50%, -50%)",
          width:         "600px",
          height:        "400px",
          background:    "radial-gradient(ellipse, rgba(184,150,12,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="container" style={{ position: "relative" }}>
          <div className="type-event-tag" style={{ marginBottom: "var(--space-6)" }}>
            Begin today
          </div>
          <h2
            className="type-heading-xl"
            style={{
              color:        "var(--lc-ivory)",
              marginBottom: "var(--space-5)",
              maxWidth:     "600px",
              margin:       "0 auto var(--space-5)",
            }}
          >
            Your Capsule goes live the moment you book.
          </h2>
          <p style={{
            fontFamily:   "var(--font-body)",
            fontSize:     "var(--text-md)",
            color:        "rgba(245,243,238,0.6)",
            maxWidth:     "480px",
            margin:       "0 auto var(--space-10)",
            lineHeight:   1.7,
          }}>
            One photo. A name. A holding message. Tribute collection begins immediately.
            The rest follows when you are ready.
          </p>

          <div style={{
            display:        "flex",
            gap:            "var(--space-4)",
            justifyContent: "center",
            flexWrap:       "wrap",
            marginBottom:   "var(--space-8)",
          }}>
            <Link href="/book" className="btn-primary btn-primary-lg">
              Start Your Capsule
            </Link>
            <Link href="/pricing" className="btn-ghost btn-primary-lg">
              View Pricing
            </Link>
          </div>

          <div style={{
            fontFamily:    "var(--font-body)",
            fontSize:      "var(--text-xs)",
            color:         "rgba(245,243,238,0.3)",
            letterSpacing: "var(--tracking-wider)",
          }}>
            Free tier available · No credit card required to begin
          </div>

          {/* Gold threshold */}
          <div className="gold-threshold" style={{ marginTop: "var(--space-16)", opacity: 0.3 }} />
        </div>
      </section>

      {/* Global animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(-8px); }
        }
        .section-deep {
          background: var(--lc-purple-deep);
        }
      `}</style>
    </>
  )
}







