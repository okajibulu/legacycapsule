"use client"

/* ============================================================
   PERSONAL ORGANISER — /for-you
   Tone: warm, intimate, human. A steady hand on the shoulder.
   ============================================================ */

import { useState } from "react"
import Link from "next/link"

const EVENT_TYPES = [
  { name:"Retirement",           desc:"Honour a lifetime of service"                },
  { name:"Wedding",              desc:"Every phase, every voice, preserved"          },
  { name:"Milestone Birthday",   desc:"A life celebrated by everyone who loves them" },
  { name:"Memorial & Funeral",   desc:"A permanent record of a life fully lived"     },
  { name:"Graduation",           desc:"The journey and the achievement"              },
  { name:"Anniversary",          desc:"Years of love, in the voices of many"         },
  { name:"Thanksgiving Service", desc:"Faith, gratitude, community"                 },
  { name:"Ordination",           desc:"A calling witnessed and preserved"            },
  { name:"Chieftaincy",          desc:"Heritage, lineage, community leadership"      },
  { name:"Award Ceremony",       desc:"Achievement honoured by peers"                },
  { name:"Community Gathering",  desc:"Voices from across a shared journey"          },
  { name:"Any Special Event",    desc:"If it matters, it deserves preserving"        },
]

const STEPS = [
  {
    n:"01", title:"You create the Capsule today",
    body:"Add the honouree's photo, their name, and a short holding message. That is all you need. Your Capsule link goes live immediately — before biography, before gallery, before anything else is ready. People can start leaving tributes the moment you share the link.",
    aside:"Collection begins the same day you book. Not a day of tribute time is lost.",
  },
  {
    n:"02", title:"You share the link with everyone who matters",
    body:"Send it via WhatsApp, email, or any channel. Contributors from Lagos, London, Toronto, and Sydney all reach the same beautifully designed page. They leave their message, their photo, their city. You see every contribution in your dashboard — and you decide what appears publicly.",
    aside:"No app download required for contributors. One link. Every device. Everywhere.",
  },
  {
    n:"03", title:"On the day, guests contribute from their phones",
    body:"Your QR code — on table cards, a display board, or projected on screen — lets guests upload photos, videos, and tributes directly from the event. The room becomes part of the record. Everything flows into the same Capsule, organised and ready.",
    aside:"D-day capture closes at 6am the morning after. Every perspective from the room, gathered.",
  },
  {
    n:"04", title:"Weeks later, everyone receives the Publication",
    body:"When you are ready — after the honeymoon, after the dust settles, when all the late tributes are in — you compile the Event Digital Publication. Every tribute, every face, every moment. Each contributor receives a personalised copy with their page number. They share it. The event lives on.",
    aside:"No deadline. You compile when you are ready. The Capsule waits.",
  },
]

const FEATURES = [
  { icon:"🌍", title:"Worldwide tribute collection",   body:"Everyone who matters — wherever they are — can leave their words, voice, or video. The world map expands as contributions arrive from new countries." },
  { icon:"📋", title:"Guest coordination",             body:"Manage RSVPs, seating, fabric and attire orders, and access codes from one dashboard. Everything visible, everything tracked." },
  { icon:"📸", title:"D-day live capture",             body:"Every guest with a phone becomes a contributor. Photos, videos, and tributes from the room — flowing into your Capsule in real time." },
  { icon:"📖", title:"The Event Digital Publication",  body:"A beautifully produced commemorative document — every tribute, every face, every detail. Distributed to contributors. Accessible forever." },
  { icon:"👗", title:"Fabric and attire coordination", body:"Manage every order, every payment instalment, every dispatch to every custodian. Cut-off enforced automatically." },
  { icon:"🛡️", title:"Your Capsule, your control",    body:"Every contribution is reviewed before it appears publicly. You decide what the world sees. Nothing appears without your approval." },
]

const QA = [
  { q:"Do I need technical experience?",
    a:"None at all. If you can send a WhatsApp message, you can run a LegacyCapsule. Setup takes minutes, guided step by step, no jargon." },
  { q:"What if I am not ready to fill in all the details yet?",
    a:"Your Capsule goes live immediately with just a photo, a name, and a holding message. Sections that are not ready simply do not appear publicly. Nothing is ever shown as incomplete." },
  { q:"Can people outside my country contribute?",
    a:"Yes. LegacyCapsule is designed for worldwide contribution from day one. Contributors in any country reach the same page, on any device. The world map grows as contributions arrive from new countries." },
  { q:"What happens after the event?",
    a:"Collection continues for as long as you want. Late tributes, honeymoon photos, reflections that arrive weeks later — all welcome. You compile the Publication when you decide everything is in. There is no platform deadline." },
]

export default function ForYouPage() {
  const [openQA, setOpenQA] = useState<number | null>(null)

  return (
    <>
      {/* HERO */}
      <section style={{
        background:"var(--lc-purple)", paddingTop:"calc(var(--nav-height) + var(--space-20))",
        paddingBottom:"var(--space-24)", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:"-20%", right:"-10%", width:"600px", height:"600px",
          background:"radial-gradient(circle, rgba(196,149,106,0.12) 0%, transparent 65%)", pointerEvents:"none" }} />

        <div className="container" style={{ position:"relative", maxWidth:"820px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-5)" }}>
            For families and individuals
          </div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-6xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.1,
            marginBottom:"var(--space-6)", letterSpacing:"var(--tracking-tight)",
          }}>
            You are organising something<br />
            <span style={{ color:"var(--lc-gold)" }}>that matters deeply.</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"clamp(var(--text-base),1.5vw,var(--text-lg))",
            color:"rgba(245,243,238,0.7)", lineHeight:1.75, marginBottom:"var(--space-10)", maxWidth:"600px",
          }}>
            LegacyCapsule gives you the power to gather every voice, coordinate every detail,
            and produce a permanent record — without needing any technical experience.
            Everything follows at your pace. Nothing is ever rushed.
          </p>
          <div className="animate-fade-up delay-300" style={{ display:"flex", gap:"var(--space-4)", flexWrap:"wrap" }}>
            <Link href="/book?path=personal" className="btn-primary btn-primary-lg">Start Your Capsule</Link>
            <Link href="/examples" className="btn-ghost btn-primary-lg">See a Live Example</Link>
          </div>
          <div className="animate-fade-up delay-400" style={{
            marginTop:"var(--space-6)", fontFamily:"var(--font-body)", fontSize:"var(--text-xs)",
            color:"rgba(245,243,238,0.35)", letterSpacing:"var(--tracking-wider)",
          }}>
            Free to start · No technical experience required · Live in minutes
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>How it works for you</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>A story, not a checklist.</h2>
          </div>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{
              display:"grid", gridTemplateColumns:"72px 1fr", gap:"var(--space-8)",
              paddingBottom:"var(--space-10)", marginBottom:"var(--space-10)",
              borderBottom: i < STEPS.length-1 ? "1px solid rgba(45,27,105,0.07)" : "none",
            }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{
                  width:"48px", height:"48px", borderRadius:"50%", background:"var(--lc-purple)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                }}>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-sm)", fontWeight:600, color:"var(--lc-gold)" }}>
                    {step.n}
                  </span>
                </div>
                {i < STEPS.length-1 && (
                  <div style={{ flex:1, width:"1px", minHeight:"40px", marginTop:"var(--space-3)",
                    background:"linear-gradient(to bottom, rgba(184,150,12,0.4), rgba(184,150,12,0.05))" }} />
                )}
              </div>
              <div style={{ paddingTop:"var(--space-2)" }}>
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-lg),2vw,var(--text-2xl))",
                  fontWeight:600, color:"var(--lc-purple)", marginBottom:"var(--space-3)" }}>{step.title}</h3>
                <p className="type-body-lg" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-4)" }}>{step.body}</p>
                <div style={{
                  display:"flex", alignItems:"flex-start", gap:"var(--space-3)",
                  padding:"var(--space-3) var(--space-4)", background:"var(--lc-gold-light)",
                  borderLeft:"3px solid var(--lc-gold)", borderRadius:"0 var(--radius-sm) var(--radius-sm) 0",
                }}>
                  <span style={{ color:"var(--lc-gold)", fontSize:"var(--text-sm)", flexShrink:0 }}>◈</span>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)", color:"var(--lc-charcoal)",
                    fontStyle:"italic", lineHeight:1.6 }}>{step.aside}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENT TYPES */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-12)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Every occasion</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>Which event are you organising?</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"var(--space-4)" }}>
            {EVENT_TYPES.map((type) => (
              <Link key={type.name}
                href={`/book?path=personal&event=${encodeURIComponent(type.name)}`}
                className="card"
                style={{ padding:"var(--space-6)", display:"block", textDecoration:"none" }}>
                <div style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-base)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-1)" }}>{type.name}</div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-mid)", lineHeight:1.5 }}>
                  {type.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-white)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>What's included</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>Everything you need. Nothing you don't.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"var(--space-6)" }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ padding:"var(--space-8)" }}>
                <div style={{ fontSize:"var(--text-2xl)", marginBottom:"var(--space-4)" }}>{f.icon}</div>
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-3)" }}>{f.title}</h3>
                <p className="type-body" style={{ color:"var(--lc-mid)" }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Q&A */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container" style={{ maxWidth:"720px" }}>
          <div style={{ textAlign:"center", marginBottom:"var(--space-12)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Questions answered</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>The things most people ask first.</h2>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
            {QA.map((item, i) => (
              <div key={i} style={{
                background:"var(--lc-white)",
                border:`1px solid ${openQA===i ? "rgba(184,150,12,0.3)" : "rgba(45,27,105,0.08)"}`,
                borderRadius:"var(--radius-lg)", overflow:"hidden",
                transition:"border-color var(--transition-fast)",
              }}>
                <button onClick={() => setOpenQA(openQA===i ? null : i)} style={{
                  width:"100%", padding:"var(--space-6)", display:"flex", justifyContent:"space-between",
                  alignItems:"center", gap:"var(--space-4)", cursor:"pointer", background:"none",
                  border:"none", textAlign:"left",
                }}>
                  <span style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:500,
                    color:"var(--lc-charcoal)", lineHeight:1.4 }}>{item.q}</span>
                  <span style={{ color:"var(--lc-gold)", fontSize:"var(--text-xl)", flexShrink:0,
                    transform:openQA===i ? "rotate(45deg)" : "rotate(0)",
                    transition:"transform var(--transition-base)", display:"inline-block" }}>+</span>
                </button>
                {openQA===i && (
                  <div style={{ padding:"0 var(--space-6) var(--space-6)",
                    borderTop:"1px solid rgba(184,150,12,0.1)", paddingTop:"var(--space-4)" }}>
                    <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:"var(--space-8)" }}>
            <Link href="/help" style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)",
              color:"var(--lc-gold)", fontWeight:600, letterSpacing:"var(--tracking-wide)" }}>
              More answers in our Help Centre →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple)",
        textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(196,149,106,0.08) 0%, transparent 70%)",
          pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"600px" }}>
          <div className="type-event-tag" style={{ marginBottom:"var(--space-5)" }}>Ready when you are</div>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
            Your Capsule goes live today.
          </h2>
          <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.6)",
            marginBottom:"var(--space-10)", lineHeight:1.7 }}>
            One photo. A name. A message. That is all you need to start.
            Everything else follows at your pace.
          </p>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book?path=personal" className="btn-primary btn-primary-lg">Start Your Capsule</Link>
            <Link href="/pricing" className="btn-ghost btn-primary-lg">See Pricing</Link>
          </div>
        </div>
      </section>    </>
  )
}

