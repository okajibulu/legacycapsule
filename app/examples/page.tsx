"use client"

/* ============================================================
   LIVE EXAMPLES — /examples
   The most powerful conversion tool on the site.
   Visitors stop reading and start experiencing.
   Each example has a persistent Start Your Own Capsule prompt.
   Peak desire moment — give them the action.
   ============================================================ */

import { useState } from "react"
import Link from "next/link"

/* ── Example Capsules ───────────────────────────────────────── */
const EXAMPLES = [
  {
    id:         "retirement",
    type:       "Retirement",
    name:       "Professor Adeyemi Okonkwo",
    tag:        "Celebrating a Remarkable Journey",
    desc:       "38 years of service. 14 countries of contribution. A live example of a full retirement Capsule — tribute wall, world map, honouree profile, and Event Digital Publication.",
    from:       "Lagos, London, Toronto, New York",
    tributes:   124,
    countries:  18,
    href:       "/for/professor-okonkwo-demo",
    color:      "#8B9FD4",
    accent:     "var(--lc-gold)",
    tag_color:  "var(--lc-gold)",
  },
  {
    id:         "wedding",
    type:       "Wedding",
    name:       "Tunde & Amara Adeyemi",
    tag:        "Two Becoming One",
    desc:       "A multi-phase wedding Capsule — traditional, church, and reception. Shows D-day photo capture, worldwide tributes, and the wedding publication.",
    from:       "Abuja, London, Houston",
    tributes:   89,
    countries:  12,
    href:       "/for/tunde-amara-demo",
    color:      "#C4956A",
    accent:     "#C4956A",
    tag_color:  "#C4956A",
  },
  {
    id:         "memorial",
    type:       "Memorial",
    name:       "Chief Emmanuel Obinna",
    tag:        "A Life Fully Lived",
    desc:       "A memorial Capsule spanning wakes across three cities and a burial service. Legacy questions, family narrative, and congregation tribute sections.",
    from:       "Enugu, London, Atlanta",
    tributes:   156,
    countries:  9,
    href:       "/for/chief-obinna-demo",
    color:      "#7EC8A4",
    accent:     "#7EC8A4",
    tag_color:  "#7EC8A4",
  },
  {
    id:         "birthday",
    type:       "Milestone Birthday",
    name:       "Mama Grace Nwosu",
    tag:        "Eighty Years of Grace",
    desc:       "An 80th birthday Capsule — life timeline, worldwide messages from family across the diaspora, D-day celebration capture, and a beautiful publication.",
    from:       "Port Harcourt, Manchester, Dubai",
    tributes:   203,
    countries:  14,
    href:       "/for/mama-grace-demo",
    color:      "var(--lc-gold)",
    accent:     "var(--lc-gold)",
    tag_color:  "var(--lc-gold)",
  },
  {
    id:         "ordination",
    type:       "Ordination",
    name:       "Rev. Dr. Samuel Obiechina",
    tag:        "Called and Consecrated",
    desc:       "An ordination Capsule — congregation tributes organised by role, faith journey sections, worldwide messages from the global church community.",
    from:       "Onitsha, Birmingham, Melbourne",
    tributes:   78,
    countries:  7,
    href:       "/for/rev-obiechina-demo",
    color:      "#B4A0D8",
    accent:     "#B4A0D8",
    tag_color:  "#B4A0D8",
  },
  {
    id:         "graduation",
    type:       "Graduation",
    name:       "Dr. Chisom Eze",
    tag:        "The Journey and the Achievement",
    desc:       "A PhD graduation Capsule — academic journey timeline, peer and faculty tributes, family messages from across three continents, celebration capture.",
    from:       "Ibadan, Edinburgh, Boston",
    tributes:   67,
    countries:  11,
    href:       "/for/chisom-eze-demo",
    color:      "#C4956A",
    accent:     "#C4956A",
    tag_color:  "#C4956A",
  },
]

/* ── Filter options ─────────────────────────────────────────── */
const FILTERS = ["All", "Retirement", "Wedding", "Memorial", "Milestone Birthday", "Ordination", "Graduation"]

export default function ExamplesPage() {
  const [activeFilter, setActiveFilter] = useState("All")
  const [hoveredCard,  setHoveredCard]  = useState<string | null>(null)

  const filtered = activeFilter === "All"
    ? EXAMPLES
    : EXAMPLES.filter(e => e.type === activeFilter)

  return (
    <>

      {/* HERO */}
      <section style={{
        background:    "var(--lc-purple-deep)",
        paddingTop:    "calc(var(--nav-height) + var(--space-16))",
        paddingBottom: "var(--space-20)",
        textAlign:     "center", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse 70% 80% at 50% 50%, rgba(184,150,12,0.08) 0%, transparent 70%)",
          pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"700px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-4)" }}>Live examples</div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-5xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.15, marginBottom:"var(--space-5)",
          }}>
            Stop reading. Start experiencing.
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.65)",
            lineHeight:1.75, marginBottom:"var(--space-8)", maxWidth:"520px", margin:"0 auto var(--space-8)",
          }}>
            These are real demonstration Capsules — not screenshots, not mockups.
            Live pages you can explore exactly as a contributor would experience them.
          </p>
          <div className="animate-fade-up delay-300" style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book" className="btn-primary">Start Your Own Capsule</Link>
            <Link href="/pricing" className="btn-ghost">View Pricing</Link>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section style={{
        background:"var(--lc-white)", padding:"var(--space-5) 0",
        borderBottom:"1px solid rgba(45,27,105,0.08)",
        position:"sticky", top:"var(--nav-height)", zIndex:50,
      }}>
        <div className="container">
          <div style={{ display:"flex", gap:"var(--space-2)", flexWrap:"wrap", justifyContent:"center" }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-full)", cursor:"pointer",
                background: activeFilter===f ? "var(--lc-purple)" : "transparent",
                border:`1px solid ${activeFilter===f ? "var(--lc-purple)" : "rgba(45,27,105,0.15)"}`,
                fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:600,
                color: activeFilter===f ? "var(--lc-ivory)" : "var(--lc-mid)",
                transition:"all var(--transition-fast)",
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLE CARDS */}
      <section style={{ padding:"var(--space-16) 0 var(--space-24)", background:"var(--lc-ivory)" }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"var(--space-6)" }}>
            {filtered.map((ex) => (
              <div
                key={ex.id}
                onMouseEnter={() => setHoveredCard(ex.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background:"var(--lc-white)", borderRadius:"var(--radius-xl)",
                  border:`1px solid ${hoveredCard===ex.id ? `${ex.color}40` : "rgba(45,27,105,0.08)"}`,
                  overflow:"hidden", transition:"all var(--transition-base)",
                  transform: hoveredCard===ex.id ? "translateY(-4px)" : "translateY(0)",
                  boxShadow: hoveredCard===ex.id ? "var(--shadow-card-hover)" : "var(--shadow-card)",
                  display:"flex", flexDirection:"column",
                }}
              >
                {/* Card header — purple with gold frame mock */}
                <div style={{
                  background:"linear-gradient(135deg, var(--lc-purple) 0%, var(--lc-purple-deep) 100%)",
                  padding:"var(--space-8)", position:"relative", overflow:"hidden",
                }}>
                  {/* Type badge */}
                  <div style={{
                    position:"absolute", top:"var(--space-4)", right:"var(--space-4)",
                    padding:"2px var(--space-3)", background:`${ex.color}20`,
                    border:`1px solid ${ex.color}40`, borderRadius:"var(--radius-full)",
                    fontFamily:"var(--font-body)", fontSize:"9px", fontWeight:700,
                    color:ex.color, letterSpacing:"var(--tracking-wide)",
                  }}>
                    {ex.type}
                  </div>

                  {/* Photo placeholder */}
                  <div style={{
                    width:"64px", height:"64px", borderRadius:"50%",
                    background:`${ex.color}20`,
                    border:`3px solid ${ex.color}`,
                    boxShadow:`0 0 0 2px rgba(0,0,0,0.3), 0 0 16px ${ex.color}40`,
                    marginBottom:"var(--space-4)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"var(--font-display)", fontSize:"var(--text-lg)", color:ex.color,
                  }}>
                    ◈
                  </div>

                  <div style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-xl)", fontWeight:600,
                    color:"var(--lc-ivory)", marginBottom:"var(--space-1)" }}>
                    {ex.name}
                  </div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"9px", fontWeight:500,
                    color:ex.tag_color, letterSpacing:"var(--tracking-ceremony)", textTransform:"uppercase" }}>
                    {ex.tag}
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding:"var(--space-6)", flex:1, display:"flex", flexDirection:"column" }}>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"var(--lc-mid)",
                    lineHeight:1.65, marginBottom:"var(--space-5)", flex:1 }}>{ex.desc}</p>

                  {/* Stats */}
                  <div style={{ display:"flex", gap:"var(--space-6)", marginBottom:"var(--space-6)",
                    padding:"var(--space-4) var(--space-4)", background:"var(--lc-ivory)", borderRadius:"var(--radius-md)" }}>
                    <div>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-xl)", fontWeight:600, color:"var(--lc-purple)" }}>{ex.tributes}</div>
                      <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-light)" }}>tributes</div>
                    </div>
                    <div style={{ width:"1px", background:"rgba(45,27,105,0.1)" }} />
                    <div>
                      <div style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-xl)", fontWeight:600, color:"var(--lc-purple)" }}>{ex.countries}</div>
                      <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-light)" }}>countries</div>
                    </div>
                    <div style={{ width:"1px", background:"rgba(45,27,105,0.1)" }} />
                    <div>
                      <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-mid)", lineHeight:1.5 }}>{ex.from}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:"var(--space-3)" }}>
                    <Link href={ex.href} style={{
                      flex:1, textAlign:"center", padding:"var(--space-3)",
                      background:"var(--lc-purple)", color:"var(--lc-ivory)",
                      borderRadius:"var(--radius-md)", fontFamily:"var(--font-body)",
                      fontSize:"var(--text-xs)", fontWeight:600, letterSpacing:"var(--tracking-wide)",
                      textTransform:"uppercase", transition:"all var(--transition-fast)",
                    }}>
                      View Live Capsule
                    </Link>
                    <Link href={`/book?event=${ex.id}`} style={{
                      flex:1, textAlign:"center", padding:"var(--space-3)",
                      background:`${ex.color}15`, color:ex.color,
                      border:`1px solid ${ex.color}40`,
                      borderRadius:"var(--radius-md)", fontFamily:"var(--font-body)",
                      fontSize:"var(--text-xs)", fontWeight:600, letterSpacing:"var(--tracking-wide)",
                      textTransform:"uppercase", transition:"all var(--transition-fast)",
                    }}>
                      Start Similar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSISTENT CTA — peak desire moment */}
      <section style={{
        padding:"var(--space-20) 0", background:"var(--lc-purple)", textAlign:"center",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(184,150,12,0.1) 0%, transparent 70%)",
          pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"580px" }}>
          <div className="type-event-tag" style={{ marginBottom:"var(--space-5)" }}>Ready to create yours?</div>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
            Your Capsule goes live today.
          </h2>
          <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.6)",
            marginBottom:"var(--space-8)", lineHeight:1.7 }}>
            One photo. A name. A message. Tribute collection begins immediately.
            The full Capsule follows when you are ready.
          </p>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book" className="btn-primary btn-primary-lg">Start Your Capsule</Link>
            <Link href="/pricing" className="btn-ghost btn-primary-lg">View Pricing</Link>
          </div>
        </div>
      </section>    </>
  )
}



