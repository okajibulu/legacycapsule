"use client"

/* ============================================================
   FOOTER — LegacyCapsule
   ============================================================ */

import Link from "next/link"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background:   "var(--lc-purple-deep)",
      color:        "var(--lc-ivory)",
      paddingTop:   "var(--space-16)",
      paddingBottom: "var(--space-8)",
      position:     "relative",
      overflow:     "hidden",
    }}>

      {/* Background texture */}
      <div style={{
        position:   "absolute",
        inset:      0,
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(184,150,12,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="container" style={{ position: "relative" }}>

        {/* ── Top row ──────────────────────────────────── */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap:                 "var(--space-12)",
          paddingBottom:       "var(--space-12)",
          borderBottom:        "1px solid rgba(184,150,12,0.15)",
        }}>

          {/* Brand column */}
          <div style={{ gridColumn: "span 1" }}>
            <div style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "var(--text-lg)",
              fontWeight:    600,
              color:         "var(--lc-ivory)",
              marginBottom:  "var(--space-3)",
            }}>
              Legacy<span style={{ color: "var(--lc-gold)" }}>Capsule</span>
            </div>
            <div style={{
              fontFamily:    "var(--font-body)",
              fontSize:      "var(--text-xs)",
              color:         "rgba(245,243,238,0.4)",
              letterSpacing: "var(--tracking-widest)",
              textTransform: "uppercase",
              marginBottom:  "var(--space-5)",
            }}>
              Every event. Preserved.
            </div>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize:   "var(--text-sm)",
              color:      "rgba(245,243,238,0.55)",
              lineHeight: 1.7,
              maxWidth:   "260px",
            }}>
              The complete platform for capturing and preserving every voice and moment of life's most significant events.
            </p>

            {/* Ecosystem note */}
            <div style={{
              marginTop:     "var(--space-6)",
              fontFamily:    "var(--font-body)",
              fontSize:      "var(--text-xs)",
              color:         "rgba(245,243,238,0.3)",
              lineHeight:    1.6,
            }}>
              A product of RevoWorldTech<br />
              RevoWorldTech is a trading name of<br />
              Valnex LDA, registered in Portugal, EU
            </div>
          </div>

          {/* For you */}
          <FooterColumn title="Who It's For" links={FOR_LINKS} />

          {/* Product */}
          <FooterColumn title="Product" links={PRODUCT_LINKS} />

          {/* Company */}
          <FooterColumn title="Company" links={COMPANY_LINKS} />

        </div>

        {/* ── Gold threshold ───────────────────────────── */}
        <div className="gold-threshold" style={{ margin: "var(--space-6) 0" }} />

        {/* ── Bottom row ───────────────────────────────── */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            "var(--space-4)",
        }}>
          <div style={{
            fontFamily: "var(--font-body)",
            fontSize:   "var(--text-xs)",
            color:      "rgba(245,243,238,0.3)",
          }}>
            © {year} Valnex LDA. All rights reserved.
          </div>

          <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily:    "var(--font-body)",
                  fontSize:      "var(--text-xs)",
                  color:         "rgba(245,243,238,0.35)",
                  letterSpacing: "var(--tracking-wide)",
                  transition:    "color var(--transition-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lc-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,243,238,0.35)")}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Powered by */}
          <div style={{
            fontFamily:    "var(--font-body)",
            fontSize:      "var(--text-xs)",
            color:         "rgba(184,150,12,0.4)",
            letterSpacing: "var(--tracking-wide)",
          }}>
            Powered by RevoWorldTech
          </div>
        </div>

      </div>
    </footer>
  )
}

/* ── Sub-component ──────────────────────────────────────────── */
function FooterColumn({ title, links }: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <div style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "var(--text-xs)",
        fontWeight:    700,
        color:         "var(--lc-gold)",
        letterSpacing: "var(--tracking-widest)",
        textTransform: "uppercase",
        marginBottom:  "var(--space-5)",
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontFamily:  "var(--font-body)",
              fontSize:    "var(--text-sm)",
              color:       "rgba(245,243,238,0.55)",
              transition:  "color var(--transition-fast)",
              lineHeight:  1.4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lc-ivory)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,243,238,0.55)")}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ── Data ───────────────────────────────────────────────────── */
const FOR_LINKS = [
  { href: "/for-you",           label: "Personal Organisers"   },
  { href: "/gift",              label: "Gift a Capsule"        },
  { href: "/for-planners",      label: "Event Professionals"   },
  { href: "/start-planning",    label: "Aspiring Planners"     },
  { href: "/resellers",         label: "Become a Reseller"     },
]

const PRODUCT_LINKS = [
  { href: "/how-it-works",      label: "How It Works"          },
  { href: "/event-types",       label: "Event Types"           },
  { href: "/examples",          label: "Live Examples"         },
  { href: "/pricing",           label: "Pricing"               },
  { href: "/help",              label: "Help & Guidance"       },
]

const COMPANY_LINKS = [
  { href: "/about",             label: "About LegacyCapsule"   },
  { href: "/resellers",         label: "Reseller Programme"    },
  { href: "https://revoworldtech.com", label: "RevoWorldTech"  },
  { href: "/contact",           label: "Contact"               },
]

const LEGAL_LINKS = [
  { href: "/legal/privacy",     label: "Privacy Policy"        },
  { href: "/legal/terms",       label: "Terms of Service"      },
  { href: "/legal/cookies",     label: "Cookie Policy"         },
  { href: "/legal/refunds",     label: "Refund Policy"         },
]

