"use client"

/* ============================================================
   ABOUT — /about
   The story, cultural intelligence, market positioning.
   Valnex LDA and RevoWorldTech properly presented.
   Matters most for institutional audiences and planners
   evaluating credibility.
   ============================================================ */

import Link from "next/link"

const VALUES = [
  { title:"Glossy and modern",       body:"High-gloss visual finish, generous spacing, sharp typographic hierarchy. Premium at every touchpoint." },
  { title:"Non-technical",           body:"A person with no technical background completes every flow without confusion. Power without burden." },
  { title:"Vibrant not solemn",      body:"Energy calibrated to the event, never defaulting to a grief register. Celebration and commemoration both deserve depth." },
  { title:"Culturally intelligent",  body:"Built for communities that celebrate with depth, across traditions and geographies. Cultural intelligence is not a feature — it is the design foundation." },
  { title:"No-pressure",             body:"The product guides without pressuring. Incomplete sections are absent, not labelled incomplete. Nothing is ever rushed." },
  { title:"Self-service",            body:"LegacyCapsule team handles platform maintenance only. Clients handle everything else — at their own pace, on their own terms." },
]

const ENTITY_STACK = [
  {
    label: "Legal entity",
    name:  "Valnex LDA",
    detail:"Registered in Portugal, European Union. Signs contracts, holds accounts, processes all payments, and files compliance documents. All legal obligations operate under Valnex LDA.",
    color: "#8B9FD4",
  },
  {
    label: "Trading brand",
    name:  "RevoWorldTech",
    detail:"The brand and product ecosystem name. Customer-facing in all marketing and product interfaces. revoworldtech.com introduces the company and all products.",
    color: "var(--lc-gold)",
  },
  {
    label: "Product",
    name:  "LegacyCapsule",
    detail:"Standalone product at legacycapsule.com. The platform serves both marketing pages and the application itself — different routes within the same project.",
    color: "#7EC8A4",
  },
]

const PRODUCTS = [
  { name:"LegacyCapsule",  desc:"Event coordination, capture, and preservation platform.", status:"Live",    color:"#7EC8A4" },
  { name:"Communiva",      desc:"Community management and engagement platform.",           status:"Coming",  color:"#8B9FD4" },
  { name:"SMSProvince",    desc:"SMS gateway and messaging infrastructure.",               status:"Coming",  color:"#C4956A" },
  { name:"CDLS",           desc:"Community digital library system.",                       status:"Coming",  color:"#B4A0D8" },
  { name:"RevoRent",       desc:"Property rental and tenant management platform.",         status:"Coming",  color:"var(--lc-gold)" },
]

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section style={{
        background:    "var(--lc-purple)",
        paddingTop:    "calc(var(--nav-height) + var(--space-20))",
        paddingBottom: "var(--space-24)",
        position:      "relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse 70% 80% at 30% 50%, rgba(184,150,12,0.07) 0%, transparent 70%)",
          pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"820px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-5)" }}>About LegacyCapsule</div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-6xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.1, marginBottom:"var(--space-6)", letterSpacing:"var(--tracking-tight)",
          }}>
            Built for events that deserve
            <span style={{ color:"var(--lc-gold)", display:"block" }}>more than a photograph.</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"clamp(var(--text-base),1.5vw,var(--text-lg))",
            color:"rgba(245,243,238,0.7)", lineHeight:1.75, maxWidth:"640px",
          }}>
            LegacyCapsule exists because significant life events — across every tradition,
            every geography, every community — deserve a permanent record that captures
            every voice, every face, and every moment. Not just the photographer's angle.
            Everyone who was there.
          </p>
        </div>
      </section>

      {/* THE GAP WE FILL */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-16)", alignItems:"start" }}>
            <div>
              <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>The market position</div>
              <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-5)" }}>
                There was no platform built for this.
              </h2>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-5)" }}>
                The existing market for digital tribute and event documentation was dominated
                by generic, solemn products built for Western memorial culture. They shared a
                register — grief-focused, restrained, built for a single event type in a single
                cultural context.
              </p>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-5)" }}>
                The events we were seeing — retirements that spanned a week of celebrations
                across multiple cities, weddings with phases across traditional and church and
                reception, funerals with wakes in Lagos and London and Toronto simultaneously,
                ordinations with congregations scattered across continents — had no adequate tool.
              </p>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>
                LegacyCapsule was built for every significant life event, in every tradition,
                for every community on earth. The depth of cultural understanding in the product
                is the competitive advantage — not a geographic restriction.
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-5)" }}>
              {["Every voice from everywhere — worldwide tribute collection from day one",
                "Every perspective from the room — D-day capture by every guest with a phone",
                "Every coordination detail — fabric, seating, access, multi-planner, in one dashboard",
                "A permanent record — the Event Digital Publication, distributed to everyone who contributed",
                "Built for multi-phase events — wakes across cities, ceremonies across days"].map((point, i) => (
                <div key={i} style={{
                  display:"flex", gap:"var(--space-4)", alignItems:"flex-start",
                  padding:"var(--space-5)", background:"var(--lc-ivory)",
                  border:"1px solid rgba(45,27,105,0.07)", borderRadius:"var(--radius-lg)",
                }}>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"var(--lc-gold)", flexShrink:0, marginTop:"6px" }} />
                  <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"var(--lc-mid)", lineHeight:1.65 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BRAND PRINCIPLES */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>How we build</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>The principles behind every decision.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:"var(--space-5)" }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{
                padding:"var(--space-7)", background:"var(--lc-white)",
                border:"1px solid rgba(45,27,105,0.07)", borderRadius:"var(--radius-lg)",
              }}>
                <div style={{ width:"32px", height:"3px", background:"var(--lc-gold)", borderRadius:"2px", marginBottom:"var(--space-5)" }} />
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-3)" }}>{v.title}</h3>
                <p className="type-body" style={{ color:"var(--lc-mid)" }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEGAL AND BRAND STRUCTURE */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ marginBottom:"var(--space-4)" }}>The structure</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-4)" }}>
              Legal entity. Trading brand. Product.
            </h2>
            <p className="type-body-lg" style={{ color:"rgba(245,243,238,0.55)", maxWidth:"500px", margin:"0 auto" }}>
              Three layers, each with a distinct purpose. Transparent to institutional audiences and planners evaluating credibility.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:"var(--space-5)" }}>
            {ENTITY_STACK.map((entity, i) => (
              <div key={i} style={{
                padding:"var(--space-8)", background:"rgba(255,255,255,0.04)",
                border:`1px solid ${entity.color}33`, borderRadius:"var(--radius-xl)",
              }}>
                <div style={{ width:"32px", height:"3px", background:entity.color, borderRadius:"2px", marginBottom:"var(--space-5)" }} />
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:entity.color, letterSpacing:"var(--tracking-widest)", textTransform:"uppercase",
                  marginBottom:"var(--space-2)" }}>{entity.label}</div>
                <div style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-2xl)", fontWeight:600,
                  color:"var(--lc-ivory)", marginBottom:"var(--space-4)" }}>{entity.name}</div>
                <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.55)", lineHeight:1.7 }}>
                  {entity.detail}
                </p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:"var(--space-10)" }}>
            <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.35)", lineHeight:1.7 }}>
              LegacyCapsule is a product of RevoWorldTech. RevoWorldTech is a trading name of Valnex LDA,<br />
              registered in Portugal, European Union. All contracts, payments, and legal obligations operate under Valnex LDA.
            </p>
          </div>
        </div>
      </section>

      {/* REVOWORLD TECH ECOSYSTEM */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple-deep)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ marginBottom:"var(--space-4)", color:"rgba(184,150,12,0.7)" }}>The ecosystem</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-4)" }}>
              LegacyCapsule is the first product in a growing ecosystem.
            </h2>
            <p className="type-body-lg" style={{ color:"rgba(245,243,238,0.5)", maxWidth:"520px", margin:"0 auto" }}>
              RevoWorldTech builds infrastructure for communities. Each product serves a different function — all connected by a shared identity and reseller network.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:"var(--space-4)" }}>
            {PRODUCTS.map((prod, i) => (
              <div key={i} style={{
                padding:"var(--space-6)", background:"rgba(255,255,255,0.03)",
                border:`1px solid ${prod.color}20`, borderRadius:"var(--radius-lg)",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"var(--space-3)" }}>
                  <div style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:600, color:"var(--lc-ivory)" }}>
                    {prod.name}
                  </div>
                  <div style={{
                    padding:"2px var(--space-2)", borderRadius:"var(--radius-full)",
                    background: prod.status === "Live" ? `${prod.color}20` : "rgba(255,255,255,0.05)",
                    border:`1px solid ${prod.status === "Live" ? prod.color : "rgba(255,255,255,0.1)"}33`,
                    fontFamily:"var(--font-body)", fontSize:"9px", fontWeight:700,
                    color: prod.status === "Live" ? prod.color : "rgba(245,243,238,0.3)",
                    letterSpacing:"var(--tracking-wide)", whiteSpace:"nowrap",
                  }}>
                    {prod.status}
                  </div>
                </div>
                <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"rgba(245,243,238,0.45)", lineHeight:1.6 }}>
                  {prod.desc}
                </p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:"var(--space-10)" }}>
            <a href="https://revoworldtech.com" target="_blank" rel="noopener noreferrer"
              style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", fontWeight:600,
                color:"var(--lc-gold)", letterSpacing:"var(--tracking-wide)" }}>
              Visit revoworldtech.com →
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"var(--space-20) 0", background:"var(--lc-ivory)", textAlign:"center" }}>
        <div className="container" style={{ maxWidth:"540px" }}>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-5)" }}>
            Ready to create your Capsule?
          </h2>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book" className="btn-primary btn-primary-lg">Start Your Capsule</Link>
            <Link href="/examples" className="btn-secondary btn-primary-lg">See Live Examples</Link>
          </div>
        </div>
      </section>    </>
  )
}
