"use client"

/* ============================================================
   NAVIGATION — LegacyCapsule
   Mobile-first. Clean on all screen sizes.
   Transparent on load → solid on scroll.
   ============================================================ */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import LogoCapsule from "@/components/LogoCapsule"

interface NavProps {
  variant?: "transparent" | "solid"
}

export default function Navigation({ variant = "transparent" }: NavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const isSolid = variant === "solid" || scrolled

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "var(--nav-height, 64px)",
        transition: "all 0.4s ease",
        background: isSolid ? "rgba(26,8,69,0.97)" : "transparent",
        backdropFilter: isSolid ? "blur(20px)" : "none",
        borderBottom: isSolid ? "1px solid rgba(226,195,107,0.15)" : "none",
        boxShadow: isSolid ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          height: "100%", padding: "0 16px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <span style={{
              fontSize: "13px", fontWeight: 800, letterSpacing: "0.18em",
              background: "linear-gradient(135deg, #E2C36B, #C9A84E)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>LEGACY</span>
            <span style={{
              fontSize: "13px", fontWeight: 800, letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.35)", marginLeft: "0.12em",
            }}>CAPSULE</span>
          </Link>

          {/* Desktop nav links — hidden on mobile */}
          <div className="lc-nav-desktop" style={{
            display: "flex", alignItems: "center", gap: "32px",
          }}>
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} style={{
                fontSize: "14px", fontWeight: 500,
                color: "rgba(245,243,238,0.75)", letterSpacing: "0.02em",
                textDecoration: "none", transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E2C36B")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,243,238,0.75)")}
              >{link.label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            {/* Sign in — desktop only */}
            <Link href="/signin" className="lc-nav-desktop" style={{
              fontSize: "14px", color: "rgba(245,243,238,0.60)",
              textDecoration: "none", letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#E2C36B")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,243,238,0.60)")}
            >Sign In</Link>

            {/* CTA — desktop only */}
            <Link href="/book" className="lc-nav-desktop" style={{
              padding: "9px 20px", borderRadius: "24px",
              background: "linear-gradient(135deg, #E2C36B, #C9A84E)",
              color: "#1a0845", fontSize: "13px", fontWeight: 700,
              letterSpacing: "0.04em", textDecoration: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(226,195,107,0.25)",
            }}>Start Your Capsule</Link>

            {/* Hamburger — mobile only */}
            <button
              className="lc-nav-mobile"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: "40px", height: "40px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "5px", cursor: "pointer",
                background: "none", border: "none", padding: "4px",
              }}
              aria-label="Toggle menu"
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: "block", width: "22px", height: "1.5px",
                  background: "#E2C36B", borderRadius: "2px",
                  transition: "all 0.3s ease",
                  transformOrigin: "center",
                  transform: menuOpen
                    ? i === 0 ? "rotate(45deg) translate(4.5px, 4.5px)"
                    : i === 1 ? "scaleX(0)"
                    : "rotate(-45deg) translate(4.5px, -4.5px)"
                    : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile fullscreen menu */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 99,
        background: "#0f0a1e",
        transform: menuOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        padding: "calc(64px + 24px) 24px 32px",
        overflowY: "auto",
      }}>
        {/* Gold top rule */}
        <div style={{
          height: "1px", marginBottom: "32px",
          background: "linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)",
        }} />

        {/* Nav links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {NAV_LINKS.map((link, i) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{
              fontSize: "26px", fontWeight: 500,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "rgba(255,255,255,0.90)", padding: "14px 0",
              borderBottom: "1px solid rgba(226,195,107,0.08)",
              textDecoration: "none", transition: "color 0.2s",
              animationDelay: `${i * 50}ms`,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#E2C36B")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.90)")}
            >{link.label}</Link>
          ))}
        </div>

        {/* Mobile CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "32px" }}>
          <Link href="/book" onClick={() => setMenuOpen(false)} style={{
            padding: "16px", borderRadius: "14px", textAlign: "center",
            background: "linear-gradient(135deg, #E2C36B, #C9A84E)",
            color: "#1a0845", fontSize: "16px", fontWeight: 700,
            letterSpacing: "0.04em", textDecoration: "none",
          }}>Start Your Capsule</Link>
          <Link href="/signin" onClick={() => setMenuOpen(false)} style={{
            padding: "15px", borderRadius: "14px", textAlign: "center",
            border: "1px solid rgba(226,195,107,0.25)",
            background: "transparent",
            color: "rgba(226,195,107,0.75)", fontSize: "15px", fontWeight: 600,
            textDecoration: "none",
          }}>Sign In</Link>
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: "24px", textAlign: "center",
          fontSize: "10px", color: "rgba(255,255,255,0.18)",
          letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          A product of RevoWorldTech · Valnex LDA
        </p>
      </div>

      <style>{`
        .lc-nav-desktop { display: none !important; }
        .lc-nav-mobile  { display: flex !important; }
        @media (min-width: 1024px) {
          .lc-nav-desktop { display: flex !important; }
          .lc-nav-mobile  { display: none !important; }
        }
      `}</style>
    </>
  )
}

const NAV_LINKS = [
  { href: "/examples", label: "Examples" },
  { href: "/help",     label: "Help"     },
]
