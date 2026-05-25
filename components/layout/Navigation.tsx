"use client"

/* ============================================================
   NAVIGATION — LegacyCapsule v3
   Session-aware. Hidden on app pages.
   Shows contextual "← Back to [Name]'s Wall" when user
   navigated from a tribute wall.
   ============================================================ */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavProps {
  variant?: "transparent" | "solid"
}

const HIDDEN_ROUTES = ['/for/', '/manage/', '/signin', '/dashboard', '/auth/']
const LS_EMAIL = 'lc_visitor_email'
const LS_LAST_CAPSULE = 'lc_last_capsule' // { slug, name }

export default function Navigation({ variant = "transparent" }: NavProps) {
  const [scrolled, setScrolled]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [signedIn, setSignedIn]       = useState(false)
  const [userEmail, setUserEmail]     = useState('')
  const [lastCapsule, setLastCapsule] = useState<{ slug: string; name: string } | null>(null)
  const pathname = usePathname()

  const isHidden = HIDDEN_ROUTES.some(route => pathname?.startsWith(route))

  const handleScroll = useCallback(() => setScrolled(window.scrollY > 20), [])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  useEffect(() => {
    const email = localStorage.getItem(LS_EMAIL)
    if (email) { setSignedIn(true); setUserEmail(email) }
    else { setSignedIn(false); setUserEmail('') }

    // Read last visited capsule for contextual back link
    try {
      const raw = localStorage.getItem(LS_LAST_CAPSULE)
      if (raw) setLastCapsule(JSON.parse(raw))
    } catch { setLastCapsule(null) }
  }, [pathname])

  const handleSignOut = () => {
    localStorage.removeItem(LS_EMAIL)
    setSignedIn(false); setUserEmail('')
    setMenuOpen(false)
    window.location.href = '/'
  }

  if (isHidden) return null

  const isSolid = variant === "solid" || scrolled

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "var(--nav-height, 64px)", transition: "all 0.4s ease",
        background: isSolid ? "rgba(26,8,69,0.97)" : "transparent",
        backdropFilter: isSolid ? "blur(20px)" : "none",
        borderBottom: isSolid ? "1px solid rgba(226,195,107,0.15)" : "none",
        boxShadow: isSolid ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto", height: "100%", padding: "0 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <span style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "0.16em", background: "linear-gradient(135deg, #E2C36B, #C9A84E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LEGACY</span>
            <span style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", marginLeft: "0.12em" }}>CAPSULE</span>
          </Link>

          {/* Desktop nav */}
          <div className="lc-nav-desktop" style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            {/* Contextual back link */}
            {lastCapsule && (
              <Link href={`/for/${lastCapsule.slug}`} style={{
                fontSize: "13px", color: "rgba(226,195,107,0.65)",
                textDecoration: "none", letterSpacing: "0.02em", transition: "color 0.2s",
                display: "flex", alignItems: "center", gap: "6px",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E2C36B")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(226,195,107,0.65)")}
              >
                <span style={{ fontSize: "11px" }}>←</span>
                {lastCapsule.name}&apos;s Wall
              </Link>
            )}
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} style={{
                fontSize: "14px", fontWeight: 500, color: "rgba(245,243,238,0.75)",
                letterSpacing: "0.02em", textDecoration: "none", transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#E2C36B")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,243,238,0.75)")}
              >{link.label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {signedIn ? (
              <>
                <Link href="/dashboard" className="lc-nav-desktop" style={{ fontSize: "14px", color: "rgba(245,243,238,0.70)", textDecoration: "none", letterSpacing: "0.02em", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2C36B")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,243,238,0.70)")}
                >My Capsules</Link>
                <button onClick={handleSignOut} className="lc-nav-desktop" style={{ padding: "9px 20px", borderRadius: "24px", border: "1px solid rgba(226,195,107,0.25)", background: "transparent", color: "rgba(226,195,107,0.75)", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em", cursor: "pointer" }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/signin" className="lc-nav-desktop" style={{ fontSize: "14px", color: "rgba(245,243,238,0.60)", textDecoration: "none", letterSpacing: "0.02em", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E2C36B")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,243,238,0.60)")}
                >Sign In</Link>
                <Link href="/book" className="lc-nav-desktop" style={{ padding: "9px 20px", borderRadius: "24px", background: "linear-gradient(135deg, #E2C36B, #C9A84E)", color: "#1a0845", fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(226,195,107,0.25)" }}>Start Your Capsule</Link>
              </>
            )}

            {/* Hamburger */}
            <button className="lc-nav-mobile" onClick={() => setMenuOpen(!menuOpen)} style={{ width: "40px", height: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", cursor: "pointer", background: "none", border: "none", padding: "4px" }} aria-label="Toggle menu">
              {[0, 1, 2].map(i => (
                <span key={i} style={{ display: "block", width: "22px", height: "1.5px", background: "#E2C36B", borderRadius: "2px", transition: "all 0.3s ease", transformOrigin: "center", transform: menuOpen ? i === 0 ? "rotate(45deg) translate(4.5px, 4.5px)" : i === 1 ? "scaleX(0)" : "rotate(-45deg) translate(4.5px, -4.5px)" : "none", opacity: menuOpen && i === 1 ? 0 : 1 }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "#0f0a1e", transform: menuOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column", padding: "calc(64px + 24px) 24px 32px", overflowY: "auto" }}>
        <div style={{ height: "1px", marginBottom: "32px", background: "linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {/* Back to wall — mobile */}
          {lastCapsule && (
            <Link href={`/for/${lastCapsule.slug}`} onClick={() => setMenuOpen(false)} style={{ fontSize: "18px", fontWeight: 500, color: "rgba(226,195,107,0.75)", padding: "12px 0", borderBottom: "1px solid rgba(226,195,107,0.08)", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>←</span> {lastCapsule.name}&apos;s Wall
            </Link>
          )}
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{ fontSize: "20px", fontWeight: 500, fontFamily: "'Playfair Display', Georgia, serif", color: "rgba(255,255,255,0.90)", padding: "14px 0", borderBottom: "1px solid rgba(226,195,107,0.08)", textDecoration: "none" }}>{link.label}</Link>
          ))}
          {signedIn && (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: "20px", fontWeight: 500, fontFamily: "'Playfair Display', Georgia, serif", color: "rgba(255,255,255,0.90)", padding: "14px 0", borderBottom: "1px solid rgba(226,195,107,0.08)", textDecoration: "none" }}>My Capsules</Link>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "32px" }}>
          {signedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{ padding: "16px", borderRadius: "14px", textAlign: "center", background: "linear-gradient(135deg, #E2C36B, #C9A84E)", color: "#1a0845", fontSize: "16px", fontWeight: 700, letterSpacing: "0.04em", textDecoration: "none" }}>My Capsules</Link>
              <button onClick={handleSignOut} style={{ padding: "15px", borderRadius: "14px", border: "1px solid rgba(226,195,107,0.25)", background: "transparent", color: "rgba(226,195,107,0.75)", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/book" onClick={() => setMenuOpen(false)} style={{ padding: "16px", borderRadius: "14px", textAlign: "center", background: "linear-gradient(135deg, #E2C36B, #C9A84E)", color: "#1a0845", fontSize: "16px", fontWeight: 700, letterSpacing: "0.04em", textDecoration: "none" }}>Start Your Capsule</Link>
              <Link href="/signin" onClick={() => setMenuOpen(false)} style={{ padding: "15px", borderRadius: "14px", textAlign: "center", border: "1px solid rgba(226,195,107,0.25)", background: "transparent", color: "rgba(226,195,107,0.75)", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
            </>
          )}
        </div>
        {signedIn && <p style={{ marginTop: "16px", textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.22)" }}>Signed in as {userEmail}</p>}
        <p style={{ marginTop: "16px", textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.14)", letterSpacing: "0.12em", textTransform: "uppercase" }}>A product of RevoWorldTech · Valnex LDA</p>
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
