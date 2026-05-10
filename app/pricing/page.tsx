"use client"

/* ============================================================
   PRICING — /pricing
   Package names are configurable via admin — shown as
   [Capture Tier] and [Full Platform Tier] until set.
   Geographic pricing explained transparently, not apologetically.
   Every pricing element links directly to the booking flow.
   No dead ends.
   ============================================================ */

import { useState } from "react"
import Link from "next/link"

/* ── Market toggle ─────────────────────────────────────────── */
type Market = "nigeria" | "international"

/* ── Package names — swap these when admin decides ─────────── */
const PACKAGE_NAMES = {
  capture:      "Capture & Preserve",   /* [Capture Tier]       */
  full:         "Full Platform",         /* [Full Platform Tier] */
}

/* ── Base pricing ──────────────────────────────────────────── */
const PRICING = {
  nigeria: {
    currency:      "₦",
    capture:       "60,000",
    full_base:     "100,000",
    extension:     "25,000",
    extension_note:"per additional 200 guests",
    examples: [
      { guests:"Up to 300",  price:"₦100,000" },
      { guests:"Up to 500",  price:"₦125,000" },
      { guests:"Up to 700",  price:"₦150,000" },
      { guests:"1,000+",     price:"₦200,000" },
    ],
  },
  international: {
    currency:      "€",
    capture:       "75",
    full_base:     "120",
    extension:     "30",
    extension_note:"per additional 200 guests",
    examples: [
      { guests:"Up to 300",  price:"€120" },
      { guests:"Up to 500",  price:"€150" },
      { guests:"Up to 700",  price:"€180" },
      { guests:"1,000+",     price:"€240" },
    ],
  },
}

/* ── Capture tier inclusions ───────────────────────────────── */
const CAPTURE_INCLUDES = [
  "Tribute Collection state — live immediately on booking",
  "Full four-state Capsule model",
  "Honouree profile page with progressive section activation",
  "Tribute wall with worldwide contributor pins",
  "Dynamic world map — expands as contributions arrive",
  "Guestbook layer",
  "WhatsApp share button and shareable link",
  "Multilingual contribution form",
  "Contributor confirmation and approval emails",
  "Auto-layout Event Digital Publication PDF",
  "Two event phases included",
  "12 months active",
]

/* ── Full platform inclusions ──────────────────────────────── */
const FULL_INCLUDES = [
  "Everything in Capture & Preserve",
  "Guest management with tier system (VVIP, VIP, General)",
  "Save the Date and RSVP tracking",
  "Fabric and attire coordination module",
  "Table management and seating chart",
  "Table card generation with context-aware QR",
  "Physical access code system",
  "Usher interface — read-only, no training required",
  "Client portal — configurable view and write access",
  "Multi-planner collaboration with scoped access",
  "D-day photo, video, and tribute capture",
  "Real-time live wall via QR",
  "Live streaming display — three broadcast-ready modes",
  "Publication contributor distribution email",
  "18 months active",
]

/* ── Module add-ons ────────────────────────────────────────── */
const ADDONS = [
  { name:"Fabric and attire coordination",    ng:"₦30,000",  int:"€35",  note:"Up to 300 orders. +₦10,000 / +€12 per additional 200." },
  { name:"Table management and seating",      ng:"₦20,000",  int:"€25",  note:"Up to 300 guests."                },
  { name:"Physical access code system",       ng:"₦20,000",  int:"€25",  note:"Up to 300 guests. +₦8,000 / +€10 per additional 200." },
  { name:"Save the Date and communications",  ng:"₦15,000",  int:"€18",  note:"Flat fee."                        },
  { name:"Table card generation with QR",     ng:"₦10,000",  int:"€12",  note:"Flat fee."                        },
  { name:"Additional event phase",            ng:"₦15,000",  int:"€18",  note:"Per phase."                       },
  { name:"Contracted planner seat",           ng:"₦10,000",  int:"€12",  note:"Per seat per event."              },
]

/* ── Premium add-ons ───────────────────────────────────────── */
const PREMIUM_ADDONS = [
  { name:"Voice tribute feature",             ng:"₦15,000",  int:"€18"  },
  { name:"Video tribute — 30 second",         ng:"₦20,000",  int:"€24"  },
  { name:"Video tribute — 60 second",         ng:"₦28,000",  int:"€33"  },
  { name:"Permanent archive (annual)",        ng:"₦25,000",  int:"€30"  },
  { name:"White-label branding",              ng:"₦35,000",  int:"€40"  },
  { name:"Custom domain",                     ng:"₦15,000",  int:"€18"  },
  { name:"Planner monthly dashboard",         ng:"₦8,000",   int:"€10"  },
  { name:"Publication distribution email",    ng:"₦12,000",  int:"€14",  note:"Included in Full Platform." },
]

/* ── Free tier ─────────────────────────────────────────────── */
const FREE_INCLUDES = [
  "Tribute Collection state live immediately",
  "Up to 20 approved contributions displayed",
  "World map with contributor pins",
  "One event phase",
  "Basic sharing — tribute link and WhatsApp",
  "Powered by LegacyCapsule mark",
]

const FREE_UPGRADES = [
  "More than 20 contributions displayed",
  "Full honouree profile page",
  "Second event phase",
  "Event Digital Publication",
  "Audio or video tributes",
  "Guest coordination modules",
]

/* ── Q&A ───────────────────────────────────────────────────── */
const QA = [
  {
    q: "Why does pricing differ by location?",
    a: "We offer location-based pricing to make LegacyCapsule accessible across markets. All tiers receive the same product and service — the same features, the same quality, the same experience. Pricing reflects local purchasing power, not local product quality.",
  },
  {
    q: "Can I upgrade from a lower tier after booking?",
    a: "Yes. Upgrades are charged as the price difference between tiers only. You are never penalised for starting on a lower tier. All contributions collected in earlier states remain fully visible after upgrading.",
  },
  {
    q: "When does my Capsule expire?",
    a: "Capture & Preserve Capsules are active for 12 months from creation. Full Platform Capsules are active for 18 months. A 30-day grace period applies after expiry. Renewal reminders go out at 60 and 14 days before expiry. The Permanent Archive add-on extends to 10+ years at a guaranteed URL.",
  },
  {
    q: "What is the refund policy?",
    a: "Full refund within 48 hours of purchase if your Capsule has not yet gone live. 50% refund between 48 hours and 7 days if not yet live. No refund once the Capsule is in any live state. Add-ons are non-refundable once activated.",
  },
]

/* ============================================================
   COMPONENT
   ============================================================ */
export default function PricingPage() {
  const [market,  setMarket]  = useState<Market>("nigeria")
  const [openQA,  setOpenQA]  = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const p = PRICING[market]
  const sym = p.currency

  return (
    <>
      {/* HERO */}
      <section style={{
        background:    "var(--lc-purple)",
        paddingTop:    "calc(var(--nav-height) + var(--space-16))",
        paddingBottom: "var(--space-20)",
        position:      "relative", overflow:"hidden", textAlign:"center",
      }}>
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse 70% 80% at 50% 50%, rgba(184,150,12,0.08) 0%, transparent 70%)",
          pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"700px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-4)" }}>
            Pricing
          </div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-5xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.15, marginBottom:"var(--space-5)",
          }}>
            Professional infrastructure.<br />
            <span style={{ color:"var(--lc-gold)" }}>Priced for every market.</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.65)",
            lineHeight:1.75, marginBottom:"var(--space-10)", maxWidth:"520px", margin:"0 auto var(--space-10)",
          }}>
            Location-based pricing ensures LegacyCapsule is accessible worldwide.
            Every market receives the same complete product.
          </p>

          {/* Market toggle */}
          <div className="animate-fade-up delay-300" style={{
            display:"inline-flex", background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.1)", borderRadius:"var(--radius-full)",
            padding:"4px", gap:"4px",
          }}>
            {(["nigeria","international"] as Market[]).map((m) => (
              <button key={m} onClick={() => setMarket(m)} style={{
                padding:"var(--space-2) var(--space-6)", borderRadius:"var(--radius-full)",
                background: market===m ? "var(--lc-gold)" : "transparent",
                color:      market===m ? "var(--lc-purple-deep)" : "rgba(245,243,238,0.6)",
                fontFamily: "var(--font-body)", fontSize:"var(--text-sm)", fontWeight:600,
                cursor:"pointer", border:"none",
                transition:"all var(--transition-fast)",
              }}>
                {m === "nigeria" ? "Nigeria / Africa" : "International (€)"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FREE TIER */}
      <section style={{ padding:"var(--space-16) 0", background:"var(--lc-ivory)" }}>
        <div className="container" style={{ maxWidth:"900px" }}>
          <div style={{
            background:"var(--lc-white)", border:"1px solid rgba(45,27,105,0.1)",
            borderRadius:"var(--radius-xl)", padding:"var(--space-8)",
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-10)", alignItems:"start",
          }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", marginBottom:"var(--space-4)" }}>
                <div style={{
                  padding:"var(--space-1) var(--space-3)", background:"rgba(45,27,105,0.06)",
                  border:"1px solid rgba(45,27,105,0.15)", borderRadius:"var(--radius-full)",
                  fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:"var(--lc-purple)", letterSpacing:"var(--tracking-wide)",
                }}>
                  Free
                </div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-mid)", letterSpacing:"var(--tracking-wide)" }}>
                  No credit card required
                </div>
              </div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-4xl)", fontWeight:600,
                color:"var(--lc-purple)", marginBottom:"var(--space-3)" }}>₦0 / €0</div>
              <p className="type-body" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-6)" }}>
                Start collecting tributes immediately. No payment until you are ready to unlock the full experience.
              </p>
              <Link href="/book?tier=free" className="btn-secondary">Start for Free</Link>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-6)" }}>
              <div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:"var(--lc-mid)", letterSpacing:"var(--tracking-wider)", textTransform:"uppercase",
                  marginBottom:"var(--space-3)" }}>Included</div>
                {FREE_INCLUDES.map((item) => (
                  <div key={item} style={{ display:"flex", gap:"var(--space-2)", alignItems:"flex-start", marginBottom:"var(--space-2)" }}>
                    <span style={{ color:"#7EC8A4", fontSize:"var(--text-sm)", flexShrink:0, marginTop:"2px" }}>✓</span>
                    <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-mid)", lineHeight:1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:"var(--lc-mid)", letterSpacing:"var(--tracking-wider)", textTransform:"uppercase",
                  marginBottom:"var(--space-3)" }}>Upgrade to unlock</div>
                {FREE_UPGRADES.map((item) => (
                  <div key={item} style={{ display:"flex", gap:"var(--space-2)", alignItems:"flex-start", marginBottom:"var(--space-2)" }}>
                    <span style={{ color:"rgba(184,150,12,0.4)", fontSize:"var(--text-sm)", flexShrink:0, marginTop:"2px" }}>◈</span>
                    <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-light)", lineHeight:1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAID TIERS */}
      <section style={{ padding:"var(--space-8) 0 var(--space-24)", background:"var(--lc-ivory)" }}>
        <div className="container" style={{ maxWidth:"900px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-6)" }}>

            {/* CAPTURE & PRESERVE */}
            <div style={{
              background:"var(--lc-white)", border:"1px solid rgba(45,27,105,0.12)",
              borderRadius:"var(--radius-xl)", overflow:"hidden",
              boxShadow:"var(--shadow-card)", display:"flex", flexDirection:"column",
            }}>
              {/* Header */}
              <div style={{ padding:"var(--space-8)", borderBottom:"1px solid rgba(45,27,105,0.06)" }}>
                <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-3)" }}>
                  {PACKAGE_NAMES.capture}
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(var(--text-3xl),4vw,var(--text-4xl))",
                  fontWeight:600, color:"var(--lc-purple)", marginBottom:"var(--space-2)" }}>
                  {sym}{p.capture}
                </div>
                <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"var(--lc-mid)", lineHeight:1.6 }}>
                  Tribute collection and publication — without event coordination tools.
                  Perfect for simpler events or when coordination is handled elsewhere.
                </p>
              </div>
              {/* Inclusions */}
              <div style={{ padding:"var(--space-8)", flex:1 }}>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:"var(--lc-mid)", letterSpacing:"var(--tracking-wider)", textTransform:"uppercase",
                  marginBottom:"var(--space-4)" }}>What's included</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-2)", marginBottom:"var(--space-8)" }}>
                  {CAPTURE_INCLUDES.map((item) => (
                    <div key={item} style={{ display:"flex", gap:"var(--space-3)", alignItems:"flex-start" }}>
                      <span style={{ color:"var(--lc-gold)", fontSize:"var(--text-sm)", flexShrink:0, marginTop:"1px" }}>◈</span>
                      <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"var(--lc-mid)", lineHeight:1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href={`/book?tier=capture&market=${market}`} className="btn-secondary" style={{ width:"100%", textAlign:"center", display:"block" }}>
                  Choose {PACKAGE_NAMES.capture}
                </Link>
              </div>
            </div>

            {/* FULL PLATFORM */}
            <div style={{
              background:"var(--lc-purple)", border:"1px solid rgba(184,150,12,0.25)",
              borderRadius:"var(--radius-xl)", overflow:"hidden",
              boxShadow:"var(--shadow-gold-md), var(--shadow-purple)", display:"flex", flexDirection:"column",
              position:"relative",
            }}>
              {/* Most popular badge */}
              <div style={{
                position:"absolute", top:"var(--space-5)", right:"var(--space-5)",
                padding:"var(--space-1) var(--space-3)", background:"var(--lc-gold)",
                borderRadius:"var(--radius-full)", fontFamily:"var(--font-body)",
                fontSize:"var(--text-xs)", fontWeight:700, color:"var(--lc-purple-deep)",
                letterSpacing:"var(--tracking-wide)",
              }}>
                Most complete
              </div>
              {/* Header */}
              <div style={{ padding:"var(--space-8)", borderBottom:"1px solid rgba(184,150,12,0.1)" }}>
                <div className="type-event-tag" style={{ marginBottom:"var(--space-3)" }}>
                  {PACKAGE_NAMES.full}
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:"clamp(var(--text-3xl),4vw,var(--text-4xl))",
                  fontWeight:600, color:"var(--lc-ivory)", marginBottom:"var(--space-1)" }}>
                  {sym}{p.full_base}
                </div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"rgba(245,243,238,0.5)",
                  marginBottom:"var(--space-3)" }}>base up to 300 guests</div>
                <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.65)", lineHeight:1.6 }}>
                  All three pillars — Coordinate, Capture, and Preserve. The complete LegacyCapsule experience.
                </p>
                {/* Guest extension */}
                <div style={{ marginTop:"var(--space-4)", padding:"var(--space-3) var(--space-4)",
                  background:"rgba(184,150,12,0.08)", border:"1px solid rgba(184,150,12,0.15)",
                  borderRadius:"var(--radius-md)" }}>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"rgba(184,150,12,0.8)" }}>
                    +{sym}{p.extension} {p.extension_note}
                  </p>
                </div>
              </div>
              {/* Examples */}
              <div style={{ padding:"var(--space-6) var(--space-8)", borderBottom:"1px solid rgba(184,150,12,0.1)" }}>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:"rgba(184,150,12,0.6)", letterSpacing:"var(--tracking-wider)", textTransform:"uppercase",
                  marginBottom:"var(--space-3)" }}>Examples by guest count</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-2)" }}>
                  {p.examples.map((ex) => (
                    <div key={ex.guests} style={{ display:"flex", justifyContent:"space-between",
                      padding:"var(--space-2) var(--space-3)", background:"rgba(255,255,255,0.04)",
                      borderRadius:"var(--radius-sm)" }}>
                      <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"rgba(245,243,238,0.5)" }}>{ex.guests}</span>
                      <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:600, color:"var(--lc-gold)" }}>{ex.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Inclusions */}
              <div style={{ padding:"var(--space-8)", flex:1 }}>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:"rgba(245,243,238,0.4)", letterSpacing:"var(--tracking-wider)", textTransform:"uppercase",
                  marginBottom:"var(--space-4)" }}>What's included</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-2)",
                  maxHeight: showAll ? "none" : "240px", overflow:"hidden", position:"relative",
                  marginBottom:"var(--space-2)" }}>
                  {FULL_INCLUDES.map((item) => (
                    <div key={item} style={{ display:"flex", gap:"var(--space-3)", alignItems:"flex-start" }}>
                      <span style={{ color:"var(--lc-gold)", fontSize:"var(--text-sm)", flexShrink:0, marginTop:"1px" }}>◈</span>
                      <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.65)", lineHeight:1.5 }}>{item}</span>
                    </div>
                  ))}
                  {!showAll && (
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"60px",
                      background:"linear-gradient(to top, var(--lc-purple), transparent)" }} />
                  )}
                </div>
                {!showAll && (
                  <button onClick={() => setShowAll(true)} style={{
                    fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:600,
                    color:"rgba(184,150,12,0.7)", cursor:"pointer", background:"none", border:"none",
                    marginBottom:"var(--space-6)", letterSpacing:"var(--tracking-wide)",
                  }}>
                    Show all inclusions ↓
                  </button>
                )}
                <Link href={`/book?tier=full&market=${market}`} className="btn-primary" style={{ width:"100%", textAlign:"center", display:"block" }}>
                  Choose {PACKAGE_NAMES.full}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULE ADD-ONS */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"900px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-12)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Module add-ons</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-3)" }}>
              Independently bookable. Add exactly what you need.
            </h2>
            <p className="type-body" style={{ color:"var(--lc-mid)" }}>
              Already included in Full Platform. Available as add-ons to Capture & Preserve.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-2)" }}>
            {ADDONS.map((addon) => (
              <div key={addon.name} style={{
                display:"grid", gridTemplateColumns:"1fr auto auto",
                alignItems:"center", gap:"var(--space-6)",
                padding:"var(--space-4) var(--space-6)",
                background:"var(--lc-ivory)", borderRadius:"var(--radius-lg)",
                border:"1px solid rgba(45,27,105,0.06)",
              }}>
                <div>
                  <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", fontWeight:600,
                    color:"var(--lc-charcoal)", marginBottom:"var(--space-1)" }}>{addon.name}</div>
                  {addon.note && (
                    <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-light)" }}>{addon.note}</div>
                  )}
                </div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", fontWeight:600,
                  color:"var(--lc-purple)", whiteSpace:"nowrap" }}>
                  {market === "nigeria" ? addon.ng : addon.int}
                </div>
                <Link href={`/book?addon=${encodeURIComponent(addon.name)}&market=${market}`}
                  style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                    color:"var(--lc-gold)", letterSpacing:"var(--tracking-wide)", whiteSpace:"nowrap" }}>
                  Add →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM ADD-ONS */}
      <section style={{ padding:"var(--space-8) 0 var(--space-24)", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"900px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-10)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Premium feature add-ons</div>
            <h2 style={{ fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-xl),2.5vw,var(--text-2xl))",
              fontWeight:600, color:"var(--lc-purple)" }}>Flat-fee additions available on any tier.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:"var(--space-4)" }}>
            {PREMIUM_ADDONS.map((addon) => (
              <div key={addon.name} style={{
                padding:"var(--space-5) var(--space-6)", background:"var(--lc-ivory)",
                border:"1px solid rgba(45,27,105,0.06)", borderRadius:"var(--radius-lg)",
                display:"flex", justifyContent:"space-between", alignItems:"center", gap:"var(--space-4)",
              }}>
                <div>
                  <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", fontWeight:600,
                    color:"var(--lc-charcoal)", marginBottom: addon.note ? "var(--space-1)" : 0 }}>{addon.name}</div>
                  {addon.note && (
                    <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-light)" }}>{addon.note}</div>
                  )}
                </div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", fontWeight:700,
                  color:"var(--lc-gold)", whiteSpace:"nowrap" }}>
                  {market === "nigeria" ? addon.ng : addon.int}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Q&A */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container" style={{ maxWidth:"720px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-12)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Pricing questions</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>Before you book.</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
            {QA.map((item, i) => (
              <div key={i} style={{
                background:"var(--lc-white)",
                border:`1px solid ${openQA===i ? "rgba(184,150,12,0.3)" : "rgba(45,27,105,0.08)"}`,
                borderRadius:"var(--radius-lg)", overflow:"hidden",
              }}>
                <button onClick={() => setOpenQA(openQA===i ? null : i)} style={{
                  width:"100%", padding:"var(--space-6)", display:"flex", justifyContent:"space-between",
                  alignItems:"center", gap:"var(--space-4)", cursor:"pointer", background:"none", border:"none", textAlign:"left",
                }}>
                  <span style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:500,
                    color:"var(--lc-charcoal)", lineHeight:1.4 }}>{item.q}</span>
                  <span style={{ color:"var(--lc-gold)", fontSize:"var(--text-xl)", flexShrink:0,
                    transform:openQA===i?"rotate(45deg)":"rotate(0)", transition:"transform var(--transition-base)", display:"inline-block" }}>+</span>
                </button>
                {openQA===i && (
                  <div style={{ padding:"0 var(--space-6) var(--space-6)", borderTop:"1px solid rgba(184,150,12,0.1)", paddingTop:"var(--space-4)" }}>
                    <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding:"var(--space-20) 0", background:"var(--lc-purple)", textAlign:"center" }}>
        <div className="container" style={{ maxWidth:"540px" }}>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
            Ready to start?
          </h2>
          <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.6)",
            marginBottom:"var(--space-8)", lineHeight:1.7 }}>
            Your Capsule goes live the moment you book. Start with the free tier or choose a paid package — either way, tribute collection begins today.
          </p>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book" className="btn-primary btn-primary-lg">Start Your Capsule</Link>
            <Link href="/examples" className="btn-ghost btn-primary-lg">See Live Examples</Link>
          </div>
        </div>
      </section>    </>
  )
}
