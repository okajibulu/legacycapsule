"use client"

/* ============================================================
   EVENT PROFESSIONALS — /for-planners
   Tone: professional, confident, peer-to-peer.
   This person doesn't need selling on the concept —
   they need to see how LC makes their business better.
   ============================================================ */

import { useState } from "react"
import Link from "next/link"

const BUSINESS_CASES = [
  {
    title: "The publication as your premium deliverable",
    body:  "Every event you manage ends with a beautifully produced Event Digital Publication — carrying every tribute, every face, every coordination detail. This is what you hand your client at the end. This is what justifies your premium rate. Your name is on it.",
    icon:  "📖",
  },
  {
    title: "The dashboard as your transparency tool",
    body:  "Your client portal gives your client live visibility into RSVP status, fabric and attire orders, payments, and seating — without a single phone call to you. Clients who can see what is happening don't need to interrupt you to ask.",
    icon:  "📊",
  },
  {
    title: "Multi-planner collaboration as your capacity tool",
    body:  "Bring in contracted planners with scoped access — they see and act on only their assigned modules. Actions are logged. Nothing falls through the gaps. You scale without losing control.",
    icon:  "🤝",
  },
  {
    title: "Directory listing as your marketing asset",
    body:  "After three completed Capsules, you are eligible for listing in the LegacyCapsule Planner Directory — filterable by location and event type. Clients looking for planners in your region see your profile, your event types, your completed Capsules. Not self-written promotional copy — verified activity.",
    icon:  "🗂️",
  },
]

const PLANNER_FEATURES = [
  { title: "Multi-Capsule dashboard",       body: "All your active Capsules in one view, client-tagged, status-visible. Monthly subscription. The professional's home base." },
  { title: "Client portal configuration",   body: "You control what each client sees and whether they can edit. Full transparency without losing authority." },
  { title: "Contracted planner seats",      body: "Add planners with module-level scoped access. Each seat is a per-event add-on. Everyone sees only what they need." },
  { title: "Publication credit page",       body: "Your profile and contact appear in every publication you produce. Standard for registered planners. Your name travels with every Capsule." },
  { title: "Template library",              body: "Save your most-used configurations as templates. Create a new Capsule like your last one — pre-populated and ready in seconds." },
  { title: "Planner directory listing",     body: "Earned through usage, not purchased. Three completed Capsules opens the listing. Your activity is your credential." },
]

const QA = [
  { q: "How is this different from just booking as a personal organiser?",
    a: "The planner account adds the multi-Capsule dashboard, client portal configuration, contracted planner seat management, publication credit page, and directory listing — the infrastructure for managing multiple clients professionally, not just one event." },
  { q: "What does my client see in their portal?",
    a: "You configure it. Guest list and RSVPs, fabric and attire order status with live payments, seating chart, event programme, financial summaries — each section can be view-only or write-enabled per your preference. You can even grant full co-ownership or limit to specific sections." },
  { q: "Can I white-label LegacyCapsule for my clients?",
    a: "Yes. White-label branding is available as an add-on — your branding on the contribution page, your branding in the publication. The Powered by LegacyCapsule mark moves to a discreet footer position." },
  { q: "How does the directory listing work?",
    a: "After three completed Capsules, your listing appears automatically — showing your business name, geographic location, event types handled, and Capsules completed. No self-written promotional content. No paid placement. Your activity is your credential. Removal is immediate and unilateral if conduct risks the brand." },
]

export default function ForPlannersPage() {
  const [openQA, setOpenQA] = useState<number | null>(null)

  return (
    <>
      {/* HERO — confident, authoritative */}
      <section style={{
        background:    "var(--lc-purple-deep)",
        paddingTop:    "calc(var(--nav-height) + var(--space-20))",
        paddingBottom: "var(--space-24)",
        position:      "relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:0, right:0, width:"500px", height:"500px",
          background:"radial-gradient(circle, rgba(139,159,212,0.1) 0%, transparent 65%)", pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"840px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-5)" }}>
            For event professionals
          </div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-6xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.1, marginBottom:"var(--space-6)", letterSpacing:"var(--tracking-tight)",
          }}>
            Your clients expect the best.
            <span style={{ color:"var(--lc-gold)", display:"block" }}>Now you can deliver it.</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"clamp(var(--text-base),1.5vw,var(--text-lg))",
            color:"rgba(245,243,238,0.7)", lineHeight:1.75, marginBottom:"var(--space-10)", maxWidth:"620px",
          }}>
            LegacyCapsule gives event planners the infrastructure to coordinate every detail,
            capture every voice, and hand clients a premium publication that makes your service
            unforgettable. Your dashboard. Your client portal. Your deliverable.
          </p>
          <div className="animate-fade-up delay-300" style={{ display:"flex", gap:"var(--space-4)", flexWrap:"wrap" }}>
            <Link href="/book?path=professional" className="btn-primary btn-primary-lg">Register as a Planner</Link>
            <Link href="/examples" className="btn-ghost btn-primary-lg">See Live Examples</Link>
          </div>
          {/* Planner add-on note */}
          <div className="animate-fade-up delay-400" style={{
            marginTop:"var(--space-8)", padding:"var(--space-4) var(--space-5)",
            background:"rgba(184,150,12,0.08)", border:"1px solid rgba(184,150,12,0.2)",
            borderRadius:"var(--radius-md)", display:"inline-flex", gap:"var(--space-3)", alignItems:"center",
          }}>
            <span style={{ color:"var(--lc-gold)" }}>◈</span>
            <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.7)" }}>
              Also want to earn commission by referring other clients? Add reseller certification after registration.
            </span>
          </div>
        </div>
      </section>

      {/* YOUR BUSINESS CASE */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Your business case</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>How LegacyCapsule makes your business better.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"var(--space-6)" }}>
            {BUSINESS_CASES.map((item, i) => (
              <div key={i} className="card" style={{ padding:"var(--space-8)" }}>
                <div style={{ fontSize:"var(--text-2xl)", marginBottom:"var(--space-4)" }}>{item.icon}</div>
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-3)", lineHeight:1.35 }}>{item.title}</h3>
                <p className="type-body" style={{ color:"var(--lc-mid)" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANNER FEATURES */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Planner-specific tools</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>Built for the way professionals work.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"var(--space-5)" }}>
            {PLANNER_FEATURES.map((f, i) => (
              <div key={i} style={{
                padding:"var(--space-7)", background:"var(--lc-white)",
                border:"1px solid rgba(45,27,105,0.08)", borderRadius:"var(--radius-lg)",
              }}>
                <div style={{ width:"6px", height:"32px", background:"var(--lc-purple)", borderRadius:"3px", marginBottom:"var(--space-5)" }} />
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-3)" }}>{f.title}</h3>
                <p className="type-body" style={{ color:"var(--lc-mid)" }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALSO A RESELLER? */}
      <section style={{ padding:"var(--space-20) 0", background:"var(--lc-purple)" }}>
        <div className="container" style={{ maxWidth:"800px" }}>
          <div style={{
            display:"grid", gridTemplateColumns:"1fr auto", gap:"var(--space-10)", alignItems:"center",
            background:"rgba(184,150,12,0.08)", border:"1px solid rgba(184,150,12,0.2)",
            borderRadius:"var(--radius-xl)", padding:"var(--space-10)",
          }}>
            <div>
              <div className="type-event-tag" style={{ marginBottom:"var(--space-4)" }}>Planning career + income opportunity</div>
              <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-xl),2.5vw,var(--text-2xl))",
                fontWeight:600, color:"var(--lc-ivory)", marginBottom:"var(--space-4)", lineHeight:1.3 }}>
                Want to also earn by growing the LC network?
              </h3>
              <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.6)", lineHeight:1.7, maxWidth:"480px" }}>
                After registering as a planner, you can apply separately for reseller certification. Train, certify,
                and earn commission by referring clients — on top of your planning practice. Two programmes,
                one account, independent journeys.
              </p>
            </div>
            <div style={{ flexShrink:0 }}>
              <Link href="/resellers" className="btn-primary">Learn About Reselling →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Q&A */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"720px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-12)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Planner questions</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>The specifics that matter to professionals.</h2>
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
                  <span style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:500, color:"var(--lc-charcoal)", lineHeight:1.4 }}>{item.q}</span>
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

      {/* CTA */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple-deep)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(139,159,212,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"580px" }}>
          <div className="type-event-tag" style={{ marginBottom:"var(--space-5)" }}>Register today</div>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
            Your most powerful client deliverable starts here.
          </h2>
          <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.6)", marginBottom:"var(--space-10)", lineHeight:1.7 }}>
            Separate registration flow. Planner dashboard active immediately. Directory listing after three Capsules.
          </p>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book?path=professional" className="btn-primary btn-primary-lg">Register as a Planner</Link>
            <Link href="/pricing" className="btn-ghost btn-primary-lg">See Pricing</Link>
          </div>
        </div>
      </section>    </>
  )
}
