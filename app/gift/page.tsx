"use client"

/* ============================================================
   GIFTING — /gift
   Tone: generous, celebratory, warm, outward-facing.
   The visitor is thinking entirely about someone else.
   Goal: make gifting a Capsule feel as natural as any other gift.
   ============================================================ */

import { useState } from "react"
import Link from "next/link"

const GIFT_SCENARIOS = [
  {
    id:      "managed",
    sub:     "You handle everything",
    title:   "The Fully Managed Gift",
    desc:    "You set up the Capsule, coordinate the event, gather the tributes, and present the recipient with the finished publication. The most complete gift — you give the experience as well as the record.",
    perfect: "Perfect if you are attending the event and want to take full responsibility for the Capsule experience.",
    cta:     "Gift this way →",
    href:    "/book?path=gift&type=managed",
    accent:  "#C4956A",
    icon:    "◈",
  },
  {
    id:      "handover",
    sub:     "You start it, they finish it",
    title:   "The Handed-Over Gift",
    desc:    "You create the Capsule and book the package. Then you hand it over to the honouree or their organiser, fully set up and ready. They coordinate from there. You gave them the platform.",
    perfect: "Perfect if you want to give a meaningful, practical gift to someone organising their own event.",
    cta:     "Gift this way →",
    href:    "/book?path=gift&type=handover",
    accent:  "var(--lc-gold)",
    icon:    "◇",
  },
  {
    id:      "voucher",
    sub:     "For any future event",
    title:   "The Gift Voucher",
    desc:    "A beautiful gift voucher in your chosen denomination. The recipient redeems it when their event arrives — tomorrow or next year. The value never expires. LegacyCapsule is ready when they are.",
    perfect: "Perfect when the event is not yet confirmed or you are not involved in organising it.",
    cta:     "Buy a Voucher →",
    href:    "/gift/voucher",
    accent:  "#8B9FD4",
    icon:    "◉",
  },
]

const GROUP_STEPS = [
  { n:"01", title:"One person starts the group gift",   body:"You initiate the collection, set the target amount, and get a shareable link. The platform handles all contributions." },
  { n:"02", title:"Contributors pay their share",       body:"Each contributor pays their portion through a secure link. The platform tracks every contribution live." },
  { n:"03", title:"Target reached — Capsule created",   body:"Once the target is reached, the Capsule is created automatically. Everyone who contributed is listed. The Capsule is handed to whoever is organising the event." },
]

const QA = [
  { q:"Can I gift this if I am not organising the event?",
    a:"Yes — the Gift Voucher scenario is exactly for this. The recipient redeems it when their event arrives. You do not need to be involved in the event itself." },
  { q:"How does the Gift Reveal Card work?",
    a:"When you complete a gift booking, LegacyCapsule generates a beautifully designed digital reveal card. Share it via WhatsApp, email, or print it. The moment of presentation is as beautiful as the gift itself." },
  { q:"How does a group gift work if contributors are in different countries?",
    a:"Each contributor pays in their local currency through secure payment links. The platform consolidates everything. Geography is not a barrier — it is part of the design." },
  { q:"What if the target amount is not reached?",
    a:"Contributors are refunded in full. No one is charged until the target is reached and confirmed. You can choose to extend the collection period or adjust the target." },
]

export default function GiftPage() {
  const [openQA, setOpenQA] = useState<number | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <>
      {/* HERO */}
      <section style={{
        background:"var(--lc-purple-deep)", paddingTop:"calc(var(--nav-height) + var(--space-20))",
        paddingBottom:"var(--space-24)", position:"relative", overflow:"hidden", textAlign:"center",
      }}>
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
          width:"700px", height:"500px",
          background:"radial-gradient(ellipse, rgba(184,150,12,0.14) 0%, transparent 65%)",
          pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"820px" }}>
          <div className="type-event-tag animate-fade-up" style={{ marginBottom:"var(--space-5)" }}>Gift a Capsule</div>
          <h1 className="animate-fade-up delay-100" style={{
            fontFamily:"var(--font-heading)", fontSize:"clamp(var(--text-3xl),5vw,var(--text-6xl))",
            fontWeight:600, color:"var(--lc-ivory)", lineHeight:1.1,
            marginBottom:"var(--space-6)", letterSpacing:"var(--tracking-tight)",
          }}>
            Give something that lasts
            <span style={{ color:"var(--lc-gold)", display:"block" }}>long after the day is over.</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{
            fontFamily:"var(--font-body)", fontSize:"clamp(var(--text-base),1.5vw,var(--text-lg))",
            color:"rgba(245,243,238,0.7)", lineHeight:1.75, marginBottom:"var(--space-10)",
            maxWidth:"580px", margin:"0 auto var(--space-10)",
          }}>
            A LegacyCapsule gift preserves every voice, every face, and every moment of
            someone's most significant event — in a beautifully produced record they will
            return to for the rest of their lives.
          </p>
          <div className="animate-fade-up delay-300"
            style={{ display:"flex", gap:"var(--space-4)", flexWrap:"wrap", justifyContent:"center" }}>
            <Link href="#scenarios" className="btn-primary btn-primary-lg">Choose How to Gift</Link>
            <Link href="/examples" className="btn-ghost btn-primary-lg">See a Live Capsule</Link>
          </div>
        </div>
      </section>

      {/* GIFT REVEAL CARD */}
      <section style={{ padding:"var(--space-20) 0", background:"var(--lc-white)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-16)", alignItems:"center" }}>
            <div>
              <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>
                The Gift Reveal Card
              </div>
              <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-5)" }}>
                The presentation is as beautiful as the gift itself.
              </h2>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-5)" }}>
                When you complete a gift booking, LegacyCapsule generates a beautifully designed
                digital reveal card showing exactly what you have given. Share it via WhatsApp,
                email, or print it for the moment of presentation.
              </p>
              <p className="type-body-lg" style={{ color:"var(--lc-mid)" }}>
                The reveal card is not an afterthought. It is designed to be the moment —
                the gift within the gift, before the Capsule itself is even experienced.
              </p>
            </div>
            {/* Card mock */}
            <div style={{
              background:"linear-gradient(135deg, var(--lc-purple) 0%, var(--lc-purple-deep) 100%)",
              borderRadius:"var(--radius-xl)", padding:"var(--space-10)", textAlign:"center",
              border:"1px solid rgba(184,150,12,0.25)",
              boxShadow:"var(--shadow-gold-md), var(--shadow-deep)", position:"relative", overflow:"hidden",
            }}>
              {[{t:"16px",l:"16px"},{t:"16px",r:"16px"},{b:"16px",l:"16px"},{b:"16px",r:"16px"}].map((pos, i) => (
                <div key={i} style={{
                  position:"absolute", ...pos, width:"20px", height:"20px",
                  border:"1px solid rgba(184,150,12,0.4)", borderRadius:"2px",
                }} />
              ))}
              <div className="gold-rule" style={{ marginBottom:"var(--space-6)" }}>
                <div className="gold-rule-diamond" />
              </div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"var(--text-xs)",
                color:"rgba(184,150,12,0.7)", letterSpacing:"var(--tracking-ceremony)",
                textTransform:"uppercase", marginBottom:"var(--space-4)" }}>A Gift for You</div>
              <div style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-2xl)", fontWeight:600,
                color:"var(--lc-ivory)", marginBottom:"var(--space-3)", fontStyle:"italic" }}>
                LegacyCapsule
              </div>
              <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)",
                color:"rgba(245,243,238,0.55)", lineHeight:1.6, marginBottom:"var(--space-6)",
                maxWidth:"240px", margin:"0 auto var(--space-6)" }}>
                A complete preservation of your most significant event — every voice, every face, forever.
              </div>
              <div className="gold-rule" style={{ marginBottom:"var(--space-4)" }}>
                <div className="gold-rule-diamond" />
              </div>
              <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)",
                color:"rgba(184,150,12,0.5)", letterSpacing:"var(--tracking-wider)" }}>
                Gifted with love
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE GIFT SCENARIOS */}
      <section id="scenarios" style={{ padding:"var(--space-24) 0", background:"var(--lc-ivory)" }}>
        <div className="container">
          <div style={{ textAlign:"center", marginBottom:"var(--space-16)" }}>
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Three ways to give</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>
              Choose how you want to gift this.
            </h2>
            <p className="type-body-lg" style={{ color:"var(--lc-mid)", maxWidth:"480px", margin:"0 auto" }}>
              There is no wrong way. Every scenario ends with something beautiful preserved forever.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"var(--space-6)" }}>
            {GIFT_SCENARIOS.map((s) => (
              <div key={s.id}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered===s.id ? "var(--lc-white)" : "rgba(255,255,255,0.6)",
                  border:`1px solid ${hovered===s.id ? s.accent : "rgba(45,27,105,0.1)"}`,
                  borderRadius:"var(--radius-xl)", padding:"var(--space-8)",
                  transition:"all var(--transition-base)",
                  transform: hovered===s.id ? "translateY(-4px)" : "translateY(0)",
                  boxShadow: hovered===s.id ? "var(--shadow-card-hover)" : "var(--shadow-card)",
                  display:"flex", flexDirection:"column",
                }}>
                <div style={{
                  width:"48px", height:"48px", borderRadius:"50%",
                  background:`${s.accent === "var(--lc-gold)" ? "rgba(184,150,12" : "rgba(196,149,106"}, 0.1)`,
                  border:`1px solid ${s.accent}33`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"var(--text-lg)", color:s.accent, marginBottom:"var(--space-5)",
                  transition:"all var(--transition-base)",
                  transform: hovered===s.id ? "scale(1.1)" : "scale(1)",
                }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:600,
                  color:s.accent, letterSpacing:"var(--tracking-wider)", textTransform:"uppercase",
                  marginBottom:"var(--space-2)" }}>{s.sub}</div>
                <h3 style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-xl)", fontWeight:600,
                  color:"var(--lc-charcoal)", marginBottom:"var(--space-4)", lineHeight:1.3 }}>{s.title}</h3>
                <p className="type-body" style={{ color:"var(--lc-mid)", marginBottom:"var(--space-4)", flex:1 }}>{s.desc}</p>
                <div style={{
                  padding:"var(--space-3) var(--space-4)", background:"var(--lc-ivory)",
                  borderRadius:"var(--radius-md)", marginBottom:"var(--space-6)",
                  borderLeft:`3px solid ${s.accent}`,
                }}>
                  <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", color:"var(--lc-mid)",
                    fontStyle:"italic", lineHeight:1.6 }}>{s.perfect}</p>
                </div>
                <Link href={s.href} style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-xs)", fontWeight:700,
                  color:s.accent, letterSpacing:"var(--tracking-wide)", textTransform:"uppercase" }}>
                  {s.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROUP GIFT */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple)" }}>
        <div className="container" style={{ maxWidth:"860px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-16)", alignItems:"start" }}>
            <div>
              <div className="type-event-tag" style={{ marginBottom:"var(--space-4)" }}>The Group Gift</div>
              <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
                Give together. One beautiful gift from everyone.
              </h2>
              <p className="type-body-lg" style={{ color:"rgba(245,243,238,0.65)", marginBottom:"var(--space-8)" }}>
                Pool contributions from friends, family, and colleagues across any number of countries.
                Everyone contributes their share. One person initiates. The platform handles everything else.
              </p>
              <Link href="/book?path=gift&type=group" className="btn-primary">Start a Group Gift</Link>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-6)" }}>
              {GROUP_STEPS.map((step, i) => (
                <div key={i} style={{ display:"flex", gap:"var(--space-5)", alignItems:"flex-start" }}>
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"50%", flexShrink:0,
                    background:"rgba(184,150,12,0.15)", border:"1px solid rgba(184,150,12,0.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <span style={{ fontFamily:"var(--font-display)", fontSize:"9px", fontWeight:700, color:"var(--lc-gold)" }}>
                      {step.n}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily:"var(--font-heading)", fontSize:"var(--text-lg)", fontWeight:500,
                      color:"var(--lc-ivory)", marginBottom:"var(--space-2)" }}>{step.title}</div>
                    <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-sm)",
                      color:"rgba(245,243,238,0.55)", lineHeight:1.65 }}>{step.body}</p>
                  </div>
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
            <div className="type-event-tag" style={{ color:"var(--lc-purple)", marginBottom:"var(--space-4)" }}>Before you give</div>
            <h2 className="type-heading-lg" style={{ color:"var(--lc-purple)" }}>Questions answered.</h2>
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
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"var(--space-24) 0", background:"var(--lc-purple-deep)",
        textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse 50% 60% at 50% 50%, rgba(184,150,12,0.1) 0%, transparent 70%)",
          pointerEvents:"none" }} />
        <div className="container" style={{ position:"relative", maxWidth:"580px" }}>
          <div className="type-event-tag" style={{ marginBottom:"var(--space-5)" }}>Give something that lasts</div>
          <h2 className="type-heading-lg" style={{ color:"var(--lc-ivory)", marginBottom:"var(--space-5)" }}>
            The most meaningful gift you can give.
          </h2>
          <p style={{ fontFamily:"var(--font-body)", fontSize:"var(--text-md)", color:"rgba(245,243,238,0.6)",
            marginBottom:"var(--space-10)", lineHeight:1.7 }}>
            Flowers fade. Cards are lost. A LegacyCapsule lasts forever —
            in the voices of everyone who matters.
          </p>
          <div style={{ display:"flex", gap:"var(--space-4)", justifyContent:"center", flexWrap:"wrap" }}>
            <Link href="/book?path=gift" className="btn-primary btn-primary-lg">Gift a Capsule</Link>
            <Link href="/gift/voucher" className="btn-ghost btn-primary-lg">Buy a Voucher</Link>
          </div>
        </div>
      </section>    </>
  )
}
