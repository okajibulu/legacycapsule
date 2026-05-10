"use client"

/* ============================================================
   ASPIRING PLANNERS — /start-planning
   Tone: encouraging, forward-looking, mentorship register.
   This section should feel like a door opening, not a product selling.
   Meets people exactly where they are. Removes fear of inexperience.
   ============================================================ */

import { useState } from "react"
import Link from "next/link"

const MILESTONES = [
  {
    n: "First Capsule",
    title: "Your first Capsule is your first portfolio piece",
    body:  "You do not need years of experience to deliver a professional event experience. LegacyCapsule gives you the infrastructure. Your client gets a beautiful result. You get the proof of what you can deliver.",
    badge: "Portfolio Builder",
    color: "#7EC8A4",
  },
  {
    n: "Second Capsule",
    title: "You are building a practice",
    body:  "Two Capsules means two clients. Two event types. Two proof points. You are developing your own style, your own client communication, and your own way of presenting the final publication. This is what a planning practice looks like at the start.",
    badge: "Developing Practice",
    color: "var(--lc-gold)",
  },
  {
    n: "Third Capsule",
    title: "Directory listing unlocked",
    body:  "Three completed Capsules opens your listing in the LegacyCapsule Planner Directory. Filterable by location and event type. Clients looking for planners in your area see your name, your event types, your verified activity. Not self-promotion — proof.",
    badge: "Directory Listed",
    color: "#8B9FD4",
  },
]

const STARTER_KIT = [
  { title: "Full platform access",         body: "Every coordination, capture, and preservation tool is available from your first Capsule. You operate with the same infrastructure as established planners." },
  { title: "Guided setup walkthrough",     body: "Step-by-step guidance through every configuration decision. What each module does, when to use it, how to explain it to your client." },
  { title: "Client-ready materials",       body: "Explainer materials you can share with your first client — showing what LegacyCapsule delivers and what they will receive at the end." },
  { title: "Mentorship connection",        body: "Opt-in connection with an experienced planner in your region. Not a formal programme — a real conversation with someone who has been where you are." },
  { title: "Path to directory",            body: "Your three-Capsule journey toward directory listing is tracked in your dashboard. You always know where you are on the path." },
  { title: "Publication credit page",      body: "Your name appears in every publication you produce, from your very first Capsule. Building your profile before you have a profile to build." },
]

const QA = [
  { q: "I have never organised a professional event. Can I really do this?",
    a:  "Yes. LegacyCapsule was built to be the infrastructure that makes your first professional event look like your tenth. The platform handles the technical complexity. You focus on the relationship with your client and the coordination of the event. Many of our directory-listed planners started exactly where you are." },
  { q: "What type of events should I start with?",
    a:  "Start with what you know. If you have organised family events — a birthday, a funeral, a church service — you already have experience. That context, combined with LegacyCapsule's infrastructure, is enough to deliver a professional result for your first paying client." },
  { q: "How do I find my first client?",
    a:  "Many aspiring planners start with someone they know — a family event, a community occasion, a church service. The first Capsule is often for someone close who trusted you with the responsibility. That first publication is your credential for the next client." },
  { q: "What does the mentorship connection look like?",
    a:  "It is an opt-in introduction — we connect you with an experienced planner in your region who has agreed to be available for a conversation. There is no structured programme or ongoing commitment. One conversation from someone who has navigated the same starting point is often all that is needed." },
]

export default function StartPlanningPage() {
  const [openQA, setOpenQA] = useState<number | null>(null)

  return (
    <>
      {/* HERO — hopeful, forward-looking, green-toned warmth */}
      <section style={{
        background:    "var(--lc-purple)",
        paddingTop:    "calc(var(--nav-height) + var(--space-20))",
        paddingBottom: "var(--space-24)",
        position:      "relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:"-10%", right:"-5%", width:"500px", height:"500px",
          background:"radial-gradient(circle, rgba(126,200,164,0.1) 0%, transparent 65%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"-20%", left:"-10%", width:"400px", height:"400px",
          background:"radial-gradient(circle, rgba(184,150,12,0.07) 0%, transparent 65%)", pointerEvents:"none" }} />

        <div className="container" style={{ position:"relative", maxWidth:"820px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-5)", color:"#7EC8A4" }}>
            For aspiring planners
          </div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-6xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.1, marginBottom:"var(--space-6)", letterSpacing:"var(--tracking-tight)",
          }}>
            You do not need experience
            <span style={{ color:"var(--lc-gold)", display:"block" }}>to begin.</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"clamp(var(--text-base),1.5vw,var(--text-lg))",
            color:"rgba(245,243,238,0.7)", lineHeight:1.75, marginBottom:"var(--space-6)", maxWidth:"600px",
          }}>
            LegacyCapsule gives you the professional infrastructure to deliver an exceptional
            event experience — from your very first client. Your first Capsule is your
            first portfolio piece. That is how your planning career begins.
          </p>

          {/* Milestone preview chips */}
          <div className="animate-fade-up delay-300" style={{
            display:"flex", gap:"var(--space-3)", flexWrap:"wrap", marginBottom:"var(--space-10)",
          }}>
            {["1 Capsule → Portfolio piece", "3 Capsules → Directory listed", "Grow at your own pace"].map((chip) => (
              <div key={chip} style={{
                padding:"var(--space-2) var(--space-4)", background:"rgba(126,200,164,0.1)",
                border:"1px solid rgba(126,200,164,0.25)", borderRadius:"var(--radius-full)",
                fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"#7EC8A4",
                letterSpacing:"var(--tracking-wide)",
              }}>
                {chip}
              </div>
            ))}
          </div>

          <div className="animate-fade-up delay-400" style={{ display:"flex", gap:"var(--space-4)", flexWrap:"wrap" }}>
            <Link href="/book?path=aspiring" className="btn-primary btn-primary-lg">Start Your First Capsule</Link>
            <Link href="/examples" className="btn-ghost btn-primary-lg">See What's Possible</Link>
          </div>
        </div>
      </section>

      {/* YOUR STARTING POINT */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-16)", alignItems:"center" }}>
            <div>
              <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Your starting point</div>
              <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-5)" }}>
                Honest and warm. This is where you are.
              </h2>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-5)" }}>
                Planning is a practice that begins before it has a name. If you have organised
                a family event — a birthday, a church service, a send-off — you have already
                done planning. You just did not call it that.
              </p>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-5)" }}>
                LegacyCapsule gives that work its proper shape. The coordination tools,
                the live capture, the published record — all the infrastructure that makes
                an informal role look professional, because it is.
              </p>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>
                Your first client does not need to know you are starting out.
                They just need to see what you deliver.
              </p>
            </div>
            {/* Visual — path card */}
            <div style={{
              background:"linear-gradient(135deg, var(--lc-purple) 0%, var(--lc-purple-deep) 100%)",
              borderRadius:"var(--radius-xl)", padding:"var(--space-10)",
              border:"1px solid rgba(184,150,12,0.2)", boxShadow:"var(--shadow-purple)",
            }}>
              <div className="type-event-tag" style={{ marginBottom:"var(--space-6)" }}>Your journey</div>
              {["Attend your first event with LegacyCapsule", "Deliver a publication your client treasures",
                "Build your portfolio with real proof", "Reach three Capsules and join the directory",
                "Grow your practice on your own terms"].map((step, i) => (
                <div key={i} style={{ display:"flex", gap:"var(--space-4)", alignItems:"flex-start",
                  marginBottom: i < 4 ? "var(--space-5)" : 0 }}>
                  <div style={{
                    width:"24px", height:"24px", borderRadius:"50%", flexShrink:0,
                    background:"rgba(184,150,12,0.15)", border:"1px solid rgba(184,150,12,0.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"var(--font-display)", fontSize:"9px", fontWeight:700, color:"var(--lc-gold)",
                  }}>
                    {String(i+1).padStart(2,"0")}
                  </div>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"rgba(245,243,238,0.7)", lineHeight:1.6 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* THREE MILESTONE CAPSULES */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Your path to the directory</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>
              Three Capsules. A verified practice.
            </h2>
            <p className="type-body-lg" style={{ color:"var(--lc-mid)", maxWidth:"520px", margin:"0 auto" }}>
              Progress, not gatekeeping. Each Capsule builds on the last. The directory listing is earned, not purchased.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:"var(--space-6)" }}>
            {MILESTONES.map((m, i) => (
              <div key={i} style={{
                background:"var(--lc-white)", borderRadius:"var(--radius-xl)", padding:"var(--space-8)",
                border:`1px solid ${m.color}22`, boxShadow:"var(--shadow-card)", position:"relative", overflow:"hidden",
              }}>
                {/* Colour top bar */}
                <div style={{ height:"3px", background:m.color, borderRadius:"2px 2px 0 0",
                  position:"absolute", top:0, left:0, right:0 }} />
                {/* Badge */}
                <div style={{
                  display:"inline-flex", padding:"var(--space-1) var(--space-3)",
                  background:`${m.color}15`, border:`1px solid ${m.color}33`,
                  borderRadius:"var(--radius-full)", marginBottom:"var(--space-5)",
                }}>
                  <span style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                    color:m.color, letterSpacing:"var(--tracking-wide)" }}>{m.badge}</span>
                </div>
                {/* Number */}
                <div style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-xs)", fontWeight:600,
                  color:m.color, letterSpacing:"var(--tracking-widest)", textTransform:"uppercase",
                  marginBottom:"var(--space-3)" }}>{m.n}</div>
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-xl)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-4)", lineHeight:1.3 }}>{m.title}</h3>
                <p className="type-body" style={{ color:"var(--lc-mid)" }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STARTER KIT */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>The planner starter kit</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>Everything you need to start professionally.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"var(--space-5)" }}>
            {STARTER_KIT.map((item, i) => (
              <div key={i} style={{
                padding:"var(--space-7)", background:"var(--lc-ivory)",
                border:"1px solid rgba(45,27,105,0.08)", borderRadius:"var(--radius-lg)",
                display:"flex", gap:"var(--space-4)", alignItems:"flex-start",
              }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#7EC8A4",
                  marginTop:"8px", flexShrink:0 }} />
                <div>
                  <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:600,
                    color:"var(--lc-charcoal)", marginBottom:"var(--space-2)" }}>{item.title}</h3>
                  <p className="type-body" style={{ color:"var(--lc-mid)" }}>{item.body}</p>
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
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Honest answers</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>The questions we would ask too.</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
            {QA.map((item, i) => (
              <div key={i} style={{
                background:"var(--lc-white)",
                border:`1px solid ${openQA===i ? "rgba(126,200,164,0.4)" : "rgba(45,27,105,0.08)"}`,
                borderRadius:"var(--radius-lg)", overflow:"hidden",
              }}>
                <button onClick={() => setOpenQA(openQA===i ? null : i)} style={{
                  width:"100%", padding:"var(--space-6)", display:"flex", justifyContent:"space-between",
                  alignItems:"center", gap:"var(--space-4)", cursor:"pointer", background:"none", border:"none", textAlign:"left",
                }}>
                  <span style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:500, color:"var(--lc-charcoal)", lineHeight:1.4 }}>{item.q}</span>
                  <span style={{ color:"#7EC8A4", fontSize:"var(--text-xl)", flexShrink:0,
                    transform:openQA===i?"rotate(45deg)":"rotate(0)", transition:"transform var(--transition-base)", display:"inline-block" }}>+</span>
                </button>
                {openQA===i && (
                  <div style={{ padding:"0 var(--space-6) var(--space-6)", borderTop:"1px solid rgba(126,200,164,0.1)", paddingTop:"var(--space-4)" }}>
                    <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(126,200,164,0.07) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"580px" }}>
          <div className="type-event-tag" style={{ marginBottom:"var(--space-5)", color:"#7EC8A4" }}>Your first step</div>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
            Your first Capsule is waiting.
          </h2>
          <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.6)", marginBottom:"var(--space-10)", lineHeight:1.7 }}>
            No experience required. No qualifications to show. Just one event, delivered well, and a record that proves what you can do.
          </p>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book?path=aspiring" className="btn-primary btn-primary-lg">Start Your First Capsule</Link>
            <Link href="/pricing" className="btn-ghost btn-primary-lg">See Pricing</Link>
          </div>
        </div>
      </section>    </>
  )
}
