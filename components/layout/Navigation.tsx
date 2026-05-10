"use client"

/* ============================================================
   NAVIGATION — LegacyCapsule
   Persistent across all marketing pages.
   Transparent on load → solid on scroll.
   Quick access bar appears after hero scrolls out.
   ============================================================ */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import LogoCapsule from "@/components/LogoCapsule"

/* ── Types ─────────────────────────────────────────────────── */
interface NavProps {
  variant?: "transparent" | "solid"
}

/* ── Component ─────────────────────────────────────────────── */
export default function Navigation({ variant = "transparent" }: NavProps) {
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [quickBar, setQuickBar]     = useState(false)

  /* Scroll behaviour */
  const handleScroll = useCallback(() => {
    const y = window.scrollY
    setScrolled(y > 20)
    setQuickBar(y > window.innerHeight * 1.50)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const isSolid = variant === "solid" || scrolled

  return (
    <>
      {/* ── Main Navigation ──────────────────────────────── */}
      <nav
        style={{
          position:   "fixed",
          top:        0,
          left:       0,
          right:      0,
          zIndex:     100,
          height:     "var(--nav-height)",
          transition: "all var(--transition-slow)",
          background: isSolid
            ? "rgba(26, 15, 62, 0.97)"
            : "transparent",
          backdropFilter: isSolid ? "blur(20px)" : "none",
          borderBottom: isSolid
            ? "1px solid rgba(184, 150, 12, 0.2)"
            : "none",
          boxShadow: isSolid
            ? "0 4px 24px rgba(0,0,0,0.3)"
            : "none",
        }}
      >
        <div
          className="container"
          style={{
            height:         "100%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
          }}
        >
          {/* ── Logo ───────────────────────────────────── */}
<Link href="/" style={{ display: "flex", alignItems: "center" }}>
  <LogoCapsule size="sm" />
</Link>

          {/* ── Primary Nav Links — Desktop ─────────────── */}
          <div style={{
            display:    "flex",
            alignItems: "center",
            gap:        "var(--space-8)",
          }} className="nav-desktop">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>

          {/* ── CTA + Menu ─────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            {/* Sign in — desktop only */}
            <Link
              href="/signin"
              className="nav-desktop"
              style={{
                fontFamily:    "var(--font-body)",
                fontSize:      "var(--text-sm)",
                color:         "rgba(245,243,238,0.65)",
                letterSpacing: "var(--tracking-wide)",
                transition:    "color var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lc-gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,243,238,0.65)")}
            >
              Sign In
            </Link>

            {/* Primary CTA */}
<Link href="/book" className="btn-primary" style={{
  padding:       "10px 20px",
  fontSize:      "var(--text-xs)",
  textAlign:     "center",
  whiteSpace:    "nowrap",
  minWidth:      "120px",
  display:       "inline-flex",
  alignItems:    "center",
  justifyContent:"center",
}}>
  Start Your Capsule
</Link>

            {/* Hamburger — mobile */}
            <button
              className="nav-mobile"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width:          "40px",
                height:         "40px",
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                gap:            "5px",
                cursor:         "pointer",
              }}
              aria-label="Toggle menu"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display:         "block",
                    width:           "22px",
                    height:          "1.5px",
                    background:      "var(--lc-ivory)",
                    transition:      "all var(--transition-base)",
                    transformOrigin: "center",
                    transform: menuOpen
                      ? i === 0 ? "rotate(45deg) translate(4px, 4px)"
                      : i === 1 ? "scaleX(0)"
                      : "rotate(-45deg) translate(4px, -4px)"
                      : "none",
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ──────────────────────────────────── */}
      <div
        style={{
          position:        "fixed",
          top:             0,
          left:            0,
          right:           0,
          bottom:          0,
          zIndex:          99,
          background:      "var(--lc-purple-deep)",
          transform:       menuOpen ? "translateX(0)" : "translateX(100%)",
          transition:      "transform var(--transition-slow)",
          display:         "flex",
          flexDirection:   "column",
          padding:         "calc(var(--nav-height) + var(--space-8)) var(--space-8) var(--space-8)",
          overflowY:       "auto",
        }}
      >
        {/* Gold threshold */}
        <div className="gold-threshold" style={{ marginBottom: "var(--space-8)" }} />

        {/* Nav links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily:    "var(--font-heading)",
                fontSize:      "var(--text-2xl)",
                fontWeight:    500,
                color:         "var(--lc-ivory)",
                padding:       "var(--space-4) 0",
                borderBottom:  "1px solid rgba(184,150,12,0.1)",
                transition:    "color var(--transition-fast)",
                animationDelay: `${i * 50}ms`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lc-gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--lc-ivory)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile CTAs */}
        <div style={{ marginTop: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <Link href="/book" className="btn-primary btn-primary-lg" onClick={() => setMenuOpen(false)}
            style={{ textAlign: "center" }}>
            Start Your Capsule
          </Link>
          <Link href="/signin" className="btn-ghost" onClick={() => setMenuOpen(false)}
            style={{ textAlign: "center" }}>
            Sign In
          </Link>
        </div>

        {/* Ecosystem note */}
        <div style={{
          marginTop:     "auto",
          paddingTop:    "var(--space-8)",
          fontFamily:    "var(--font-body)",
          fontSize:      "var(--text-xs)",
          color:         "rgba(245,243,238,0.3)",
          letterSpacing: "var(--tracking-wider)",
          textTransform: "uppercase",
        }}>
          A product of RevoWorldTech · Valnex LDA
        </div>
      </div>

      {/* ── Quick Access Bar — appears after hero ────────── */}
      <div
        style={{
          position:       "fixed",
          top:            "var(--nav-height)",
          left:           0,
          right:          0,
          zIndex:         98,
          height:         "44px",
          background:     "rgba(45, 27, 105, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom:   "1px solid rgba(184,150,12,0.15)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "var(--space-6)",
transform:      quickBar ? "translateY(0)" : "translateY(-44px)",
opacity:        quickBar ? 1 : 0,
visibility:     quickBar ? "visible" : "hidden",
transition:     "all var(--transition-slow)",
          overflow:       "hidden",
        }}
        className="nav-desktop"
      >
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontFamily:    "var(--font-body)",
              fontSize:      "var(--text-xs)",
              fontWeight:    600,
              color:         "rgba(245,243,238,0.65)",
              letterSpacing: "var(--tracking-wider)",
              textTransform: "uppercase",
              transition:    "color var(--transition-fast)",
              whiteSpace:    "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lc-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,243,238,0.65)")}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/book" style={{
          fontFamily:    "var(--font-body)",
          fontSize:      "var(--text-xs)",
          fontWeight:    700,
          color:         "var(--lc-gold)",
          letterSpacing: "var(--tracking-wider)",
          textTransform: "uppercase",
          padding:       "4px 12px",
          border:        "1px solid rgba(184,150,12,0.4)",
          borderRadius:  "var(--radius-sm)",
          transition:    "all var(--transition-fast)",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--lc-gold)"
            e.currentTarget.style.color = "var(--lc-purple-deep)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = "var(--lc-gold)"
          }}
        >
          Book Now
        </Link>
      </div>

      {/* ── CSS for desktop/mobile visibility ───────────── */}
      <style>{`
        .nav-desktop { display: none; }
        .nav-mobile  { display: flex; }
        @media (min-width: 1024px) {
          .nav-desktop { display: flex; }
          .nav-mobile  { display: none; }
        }
      `}</style>
    </>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "var(--text-sm)",
        fontWeight:    500,
        color:         "rgba(245,243,238,0.75)",
        letterSpacing: "var(--tracking-wide)",
        transition:    "color var(--transition-fast)",
        position:      "relative",
        paddingBottom: "2px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lc-gold)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,243,238,0.75)")}
    >
      {label}
    </Link>
  )
}

function LogoMark() {
  return (
    <div style={{
      width:        "36px",
      height:       "36px",
      borderRadius: "50%",
      background:   "linear-gradient(135deg, var(--lc-gold) 0%, var(--lc-gold-bright) 100%)",
      display:      "flex",
      alignItems:   "center",
      justifyContent: "center",
      boxShadow:    "var(--shadow-gold-sm)",
      flexShrink:   0,
    }}>
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize:   "var(--text-sm)",
        fontWeight: 700,
        color:      "var(--lc-purple-deep)",
      }}>
        LC
      </span>
    </div>
  )
}

/* ── Data ───────────────────────────────────────────────────── */
const NAV_LINKS = [
  { href: "/examples",  label: "Examples" },
  { href: "/pricing",   label: "Pricing"  },
  { href: "/for-you",   label: "For You"  },
  { href: "/help",      label: "Help"     },
]

const QUICK_LINKS = [
  { href: "/pricing",  label: "Pricing"       },
  { href: "/examples", label: "See Examples"  },
  { href: "/help",     label: "Help"          },
  { href: "/signin",   label: "Sign In"       },
]
