"use client"

/* ============================================================
   RESELLERS — /resellers
   Tone: entrepreneurial, structured, transparent, serious-minded.
   Language acts as an audience filter from the first line.
   "Growing the network" attracts builders, not passive earners.
   This page ends in an application, not a booking.
   ============================================================ */

import { useState } from "react"
import Link from "next/link"

/* ── Reseller profiles — who this is for ─────────────────── */
const PROFILES = [
  {
    title: "Event planners",
    body:  "You already work with clients who need exactly this. LegacyCapsule becomes part of your service toolkit — and you earn commission on every client you bring to the platform.",
    icon:  "◉",
    color: "#8B9FD4",
  },
  {
    title: "Photographers and videographers",
    body:  "You are at every significant event. Your clients are already investing in documentation. LegacyCapsule extends what you offer without adding to what you deliver.",
    icon:  "◈",
    color: "var(--lc-gold)",
  },
  {
    title: "Religious organisations",
    body:  "Your congregation holds recurring significant events — funerals, ordinations, anniversaries, thanksgivings. You have an established community of families who need this.",
    icon:  "◇",
    color: "#C4956A",
  },
  {
    title: "Community and diaspora organisations",
    body:  "Alumni associations, professional bodies, cultural organisations, diaspora networks. You coordinate people across countries who hold events that deserve preserving.",
    icon:  "◐",
    color: "#7EC8A4",
  },
  {
    title: "Individual connectors",
    body:  "You know people. You understand your community's event culture. You are trusted. That trust is the most powerful asset in this programme — more valuable than any marketing budget.",
    icon:  "◎",
    color: "#B4A0D8",
  },
]

/* ── How it works ─────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Apply and complete training",
    body:  "Submit your application at resellers.revoworldtech.com. On approval, you access the LegacyCapsule training programme — covering the product, client onboarding, pricing, your support responsibilities, commission structure, and the code of conduct. No shortcuts.",
  },
  {
    n: "02",
    title: "Pass the assessment and receive certification",
    body:  "An 85% pass threshold. Maximum three attempts with a 48-hour cooling period between failures. On passing, your unique reseller code is activated and your certificate is issued. Your code is permanent and attached to every client account created through you.",
  },
  {
    n: "03",
    title: "Build your client network",
    body:  "Share your reseller code with clients. Every account created through your code is permanently attributed to you — including all future purchases from that account. You serve as their first point of contact for support. You are their LegacyCapsule connection.",
  },
  {
    n: "04",
    title: "Earn as your network grows",
    body:  "Commission is calculated on confirmed payments from attributed accounts. It moves from accrued to payable after the refund window clears. Payments run monthly once your balance reaches the payout threshold. Your commission rate increases as your attributed network grows.",
  },
]

/* ── Commission tiers ─────────────────────────────────────── */
const TIERS = [
  { name: "Starter",  accounts: "Default on activation",  rate: "Base rate",   benefits: ["Reseller code", "Onboarding support", "Reseller dashboard"] },
  { name: "Active",   accounts: "10 attributed accounts", rate: "Base + 1%",   benefits: ["All Starter benefits", "Reduced payout threshold eligibility"] },
  { name: "Growth",   accounts: "25 accounts · €500 revenue", rate: "Base + 2%", benefits: ["All Active benefits", "Featured in reseller directory"] },
  { name: "Elite",    accounts: "50 accounts · €2,000 revenue", rate: "Base + 3%", benefits: ["All Growth benefits", "Early product access", "Premium support channel"] },
]

/* ── Ecosystem dimension ──────────────────────────────────── */
const ECOSYSTEM_POINTS = [
  "Certify for LegacyCapsule now through the RevoWorldTech reseller portal",
  "Your reseller code works across all products you are certified for",
  "As the RevoWorldTech ecosystem grows, your certified scope can expand",
  "One account. Multiple products. One network you continue building",
]

/* ── Q&A ──────────────────────────────────────────────────── */
const QA = [
  {
    q: "What does the training cover?",
    a: "The full product — what LegacyCapsule does, who it serves, how to onboard a client, the exact pricing structure, what is included at each tier, your support responsibilities to your downline, how commission is calculated, when it is paid, and the code of conduct that governs your participation. Everything you need to represent the product accurately and professionally.",
  },
  {
    q: "What are my responsibilities to clients I bring in?",
    a: "You are their first point of contact for questions and support issues. Basic how-to questions, billing queries, initial complaints — these come to you first. You investigate and attempt resolution before escalating to RevoWorldTech. This is not passive referral. It is a client relationship with accountability.",
  },
  {
    q: "How does commission work if a client gets a refund?",
    a: "Commission on a transaction moves to payable status only after the refund window for that transaction closes. If a refund occurs within the window, the commission is automatically reversed before it ever becomes payable. No chasing, no clawback — the system prevents it at the point of calculation.",
  },
  {
    q: "Can I also be a planner and a reseller?",
    a: "Yes. Many of our resellers are also registered planners who use LegacyCapsule for their own events and refer other clients for commission. These are separate programmes with separate onboarding journeys. One account, independent certifications. You manage your own events through your planner account and earn commission on referrals through your reseller account.",
  },
  {
    q: "What is the RevoWorldTech ecosystem dimension?",
    a: "LegacyCapsule is one product in the RevoWorldTech ecosystem. Your reseller account lives at the ecosystem level — not the product level. Certify for LegacyCapsule now and as other RevoWorldTech products launch, you can expand your certified scope through additional training programmes. One network, growing value.",
  },
]

export default function ResellersPage() {
  const [openQA, setOpenQA] = useState<number | null>(null)
  const [activeTier, setActiveTier] = useState<number>(0)

  return (
    <>
      {/* HERO — entrepreneurial, structured, opportunity weight */}
      <section style={{
        background:    "var(--lc-purple-deep)",
        paddingTop:    "calc(var(--nav-height) + var(--space-20))",
        paddingBottom: "var(--space-24)",
        position:      "relative", overflow:"hidden",
      }}>
        {/* Geometric background — more structured than other sections */}
        <div style={{
          position:"absolute", top:0, right:0, bottom:0,
          width:"40%", opacity:0.03,
          backgroundImage:"repeating-linear-gradient(45deg, var(--lc-gold) 0, var(--lc-gold) 1px, transparent 0, transparent 50%)",
          backgroundSize:"20px 20px",
          pointerEvents:"none",
        }} />
        <div style={{ position:"absolute", top:"10%", right:"10%", width:"400px", height:"400px",
          background:"radial-gradient(circle, rgba(180,160,216,0.08) 0%, transparent 65%)", pointerEvents:"none" }} />

        <div className="container" style={{ position:"relative", maxWidth:"840px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-5)", color:"#B4A0D8" }}>
            Become a reseller
          </div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-6xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.1, marginBottom:"var(--space-6)", letterSpacing:"var(--tracking-tight)",
          }}>
            Earn by growing
            <span style={{ color:"var(--lc-gold)", display:"block" }}>the LegacyCapsule network.</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"clamp(var(--text-base),1.5vw,var(--text-lg))",
            color:"rgba(245,243,238,0.7)", lineHeight:1.75, marginBottom:"var(--space-8)", maxWidth:"620px",
          }}>
            The LegacyCapsule reseller programme is a structured professional certification —
            not a passive referral scheme. You train. You certify. You build a client network
            and serve as their first point of support. Your commission grows as your network grows.
          </p>

          {/* Qualification bar — filter signal */}
          <div className="animate-fade-up delay-300" style={{
            padding:"var(--space-5) var(--space-6)", background:"rgba(180,160,216,0.08)",
            border:"1px solid rgba(180,160,216,0.2)", borderRadius:"var(--radius-lg)",
            marginBottom:"var(--space-10)", maxWidth:"580px",
          }}>
            <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
              color:"#B4A0D8", letterSpacing:"var(--tracking-wider)", textTransform:"uppercase", marginBottom:"var(--space-3)" }}>
              This programme requires
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-2)" }}>
              {["Completion of the LegacyCapsule training programme",
                "85% pass rate on the certification assessment",
                "First-responder support responsibility to your client network",
                "Adherence to the reseller code of conduct"].map((req) => (
                <div key={req} style={{ display:"flex", gap:"var(--space-3)", alignItems:"center" }}>
                  <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#B4A0D8", flexShrink:0 }} />
                  <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.65)" }}>{req}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up delay-400" style={{ display:"flex", gap:"var(--space-4)", flexWrap:"wrap" }}>
            <a href="https://resellers.revoworldtech.com" className="btn-primary btn-primary-lg"
              target="_blank" rel="noopener noreferrer">
              Apply as a Reseller
            </a>
            <Link href="#how-it-works" className="btn-ghost btn-primary-lg">
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Who this is for</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>
              The right people for this programme already exist.
            </h2>
            <p className="type-body-lg" style={{ color:"var(--lc-mid)", maxWidth:"520px", margin:"0 auto" }}>
              The most effective resellers are those with existing relationships in communities
              where significant events happen regularly. If that is you, read on.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:"var(--space-5)" }}>
            {PROFILES.map((p, i) => (
              <div key={i} style={{
                padding:"var(--space-7)", background:"var(--lc-ivory)",
                border:`1px solid ${p.color}22`, borderRadius:"var(--radius-lg)",
                transition:"all var(--transition-base)",
              }}>
                <div style={{
                  width:"40px", height:"40px", borderRadius:"50%",
                  background:`${p.color}15`, border:`1px solid ${p.color}33`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"var(--text-lg)", color:p.color, marginBottom:"var(--space-5)",
                }}>
                  {p.icon}
                </div>
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-3)" }}>{p.title}</h3>
                <p className="type-body" style={{ color:"var(--lc-mid)" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>The process</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>
              From application to active reseller. No ambiguity.
            </h2>
          </div>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.n} style={{
              display:"grid", gridTemplateColumns:"80px 1fr", gap:"var(--space-8)",
              paddingBottom:"var(--space-10)", marginBottom:"var(--space-10)",
              borderBottom: i < HOW_IT_WORKS.length-1 ? "1px solid rgba(45,27,105,0.07)" : "none",
            }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{
                  width:"52px", height:"52px", borderRadius:"50%",
                  background:"linear-gradient(135deg, var(--lc-purple) 0%, var(--lc-purple-deep) 100%)",
                  border:"1px solid rgba(184,150,12,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  boxShadow:"var(--shadow-gold-sm)",
                }}>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-sm)", fontWeight:600, color:"var(--lc-gold)" }}>{step.n}</span>
                </div>
                {i < HOW_IT_WORKS.length-1 && (
                  <div style={{ flex:1, width:"1px", minHeight:"40px", marginTop:"var(--space-3)",
                    background:"linear-gradient(to bottom, rgba(184,150,12,0.4), rgba(184,150,12,0.05))" }} />
                )}
              </div>
              <div style={{ paddingTop:"var(--space-3)" }}>
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-lg),2vw,var(--text-xl))",
                  fontWeight:600, color:"var(--lc-purple)", marginBottom:"var(--space-3)" }}>{step.title}</h3>
                <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMISSION TIERS */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ marginBottom:"var(--space-4)" }}>Commission structure</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-4)" }}>
              Your commission rate grows with your network.
            </h2>
            <p className="type-body-lg" style={{ color:"rgba(245,243,238,0.55)", maxWidth:"480px", margin:"0 auto" }}>
              Four tiers. Automatic progression. No negotiation required — your activity earns the upgrade.
            </p>
          </div>

          {/* Tier tabs */}
          <div style={{ display:"flex", gap:"var(--space-2)", justifyContent:"center", marginBottom:"var(--space-8)", flexWrap:"wrap" }}>
            {TIERS.map((tier, i) => (
              <button key={i} onClick={() => setActiveTier(i)} style={{
                padding:"var(--space-2) var(--space-5)",
                background: activeTier===i ? "var(--lc-gold)" : "rgba(255,255,255,0.06)",
                border:`1px solid ${activeTier===i ? "var(--lc-gold)" : "rgba(255,255,255,0.1)"}`,
                borderRadius:"var(--radius-full)", cursor:"pointer",
                fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", fontWeight:600,
                color: activeTier===i ? "var(--lc-purple-deep)" : "rgba(245,243,238,0.6)",
                transition:"all var(--transition-fast)",
              }}>
                {tier.name}
              </button>
            ))}
          </div>

          {/* Active tier detail */}
          <div style={{ maxWidth:"640px", margin:"0 auto" }}>
            {TIERS.map((tier, i) => activeTier===i && (
              <div key={i} style={{
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(184,150,12,0.2)",
                borderRadius:"var(--radius-xl)", padding:"var(--space-10)",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                  marginBottom:"var(--space-8)", flexWrap:"wrap", gap:"var(--space-4)" }}>
                  <div>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-xs)", fontWeight:600,
                      color:"var(--lc-gold)", letterSpacing:"var(--tracking-widest)", textTransform:"uppercase",
                      marginBottom:"var(--space-2)" }}>{tier.name} Tier</div>
                    <div style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-2xl)", fontWeight:600,
                      color:"var(--lc-ivory)" }}>{tier.rate}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"rgba(245,243,238,0.4)",
                      letterSpacing:"var(--tracking-wider)", textTransform:"uppercase", marginBottom:"var(--space-1)" }}>Threshold</div>
                    <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.7)" }}>{tier.accounts}</div>
                  </div>
                </div>
                <div className="gold-threshold" style={{ marginBottom:"var(--space-8)", opacity:0.3 }} />
                <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
                  {tier.benefits.map((b) => (
                    <div key={b} style={{ display:"flex", gap:"var(--space-3)", alignItems:"center" }}>
                      <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--lc-gold)", flexShrink:0 }} />
                      <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.7)" }}>{b}</span>
                    </div>
                  ))}
                </div>
                {/* Upgrade note */}
                {i > 0 && (
                  <div style={{ marginTop:"var(--space-6)", padding:"var(--space-3) var(--space-4)",
                    background:"rgba(184,150,12,0.08)", border:"1px solid rgba(184,150,12,0.15)",
                    borderRadius:"var(--radius-md)" }}>
                    <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"rgba(184,150,12,0.8)", fontStyle:"italic" }}>
                      Tier upgrades are automatic. Tier downgrades do not occur — once earned, your tier stays.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payout note */}
          <div style={{ textAlign:"center", marginTop:"var(--space-8)" }}>
            <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.4)" }}>
              Commission is paid monthly once your balance reaches the payout threshold. · Exact commission rate confirmed at application.
            </p>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM DIMENSION */}
      <section style={{ padding:"var(--space-20) 0", background:"var(--lc-purple-deep)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-16)", alignItems:"center",
          }}>
            <div>
              <div className="type-event-tag" style={{ marginBottom:"var(--space-4)", color:"#B4A0D8" }}>
                The ecosystem dimension
              </div>
              <h2 className="type-heading-md" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
                LegacyCapsule is one product. Your network is the asset.
              </h2>
              <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.6)", lineHeight:1.75, marginBottom:"var(--space-6)" }}>
                Your reseller account exists at the RevoWorldTech ecosystem level — not the product level.
                Certify for LegacyCapsule now. As the ecosystem grows, your certified scope can expand
                through additional training programmes. One network. Growing value.
              </p>
              <a href="https://resellers.revoworldtech.com" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", fontWeight:600,
                  color:"var(--lc-gold)", letterSpacing:"var(--tracking-wide)" }}>
                View the reseller portal →
              </a>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
              {ECOSYSTEM_POINTS.map((point, i) => (
                <div key={i} style={{
                  display:"flex", gap:"var(--space-4)", alignItems:"flex-start",
                  padding:"var(--space-4) var(--space-5)",
                  background:"rgba(180,160,216,0.05)", border:"1px solid rgba(180,160,216,0.1)",
                  borderRadius:"var(--radius-md)",
                }}>
                  <div style={{ width:"24px", height:"24px", borderRadius:"50%", flexShrink:0,
                    background:"rgba(180,160,216,0.15)", border:"1px solid rgba(180,160,216,0.25)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"var(--font-display)", fontSize:"9px", fontWeight:700, color:"#B4A0D8" }}>
                    {String(i+1).padStart(2,"0")}
                  </div>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.6)", lineHeight:1.6 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Q&A */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"720px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-12)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Programme details</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>No ambiguity. Read before applying.</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
            {QA.map((item, i) => (
              <div key={i} style={{
                background:"var(--lc-white)",
                border:`1px solid ${openQA===i ? "rgba(180,160,216,0.4)" : "rgba(45,27,105,0.08)"}`,
                borderRadius:"var(--radius-lg)", overflow:"hidden",
              }}>
                <button onClick={() => setOpenQA(openQA===i ? null : i)} style={{
                  width:"100%", padding:"var(--space-6)", display:"flex", justifyContent:"space-between",
                  alignItems:"center", gap:"var(--space-4)", cursor:"pointer", background:"none", border:"none", textAlign:"left",
                }}>
                  <span style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:500, color:"var(--lc-charcoal)", lineHeight:1.4 }}>{item.q}</span>
                  <span style={{ color:"#B4A0D8", fontSize:"var(--text-xl)", flexShrink:0,
                    transform:openQA===i?"rotate(45deg)":"rotate(0)", transition:"transform var(--transition-base)", display:"inline-block" }}>+</span>
                </button>
                {openQA===i && (
                  <div style={{ padding:"0 var(--space-6) var(--space-6)", borderTop:"1px solid rgba(180,160,216,0.1)", paddingTop:"var(--space-4)" }}>
                    <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — application, not booking */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple-deep)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(180,160,216,0.08) 0%, transparent 70%)",
          pointerEvents:"none",
        }} />
        <div style={{
          position:"absolute", top:0, right:0, bottom:0, width:"40%", opacity:0.025,
          backgroundImage:"repeating-linear-gradient(45deg, var(--lc-gold) 0, var(--lc-gold) 1px, transparent 0, transparent 50%)",
          backgroundSize:"20px 20px", pointerEvents:"none",
        }} />
        <div className="container" style={{ position:"relative", maxWidth:"580px" }}>
          <div className="type-event-tag" style={{ marginBottom:"var(--space-5)", color:"#B4A0D8" }}>
            Ready to apply?
          </div>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
            Build something real. Earn as it grows.
          </h2>
          <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.6)",
            marginBottom:"var(--space-10)", lineHeight:1.7 }}>
            Applications are reviewed by the team. Not everyone is accepted. The programme works
            because the people in it take it seriously.
          </p>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <a href="https://resellers.revoworldtech.com" target="_blank" rel="noopener noreferrer"
              className="btn-primary btn-primary-lg">
              Apply at resellers.revoworldtech.com
            </a>
          </div>
          <p style={{ marginTop:"var(--space-6)", fontFamily:"var(--font-body)", fontSize:"var(--text-xs)",
            color:"rgba(245,243,238,0.3)", letterSpacing:"var(--tracking-wide)" }}>
            Applications reviewed within 5 working days · Training available immediately on approval
          </p>
        </div>
      </section>    </>
  )
}
