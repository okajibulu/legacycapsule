/* =========================================================
   app/how-it-works/page.tsx
   Full sequential story — free to paid journey.
   Plain language. No jargon.
========================================================= */
import Link from 'next/link'

export const metadata = {
  title: 'How It Works · LegacyCapsule',
  description: 'See exactly how LegacyCapsule works — from creating your free tribute wall to preserving your event permanently.',
}

const gold = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.12)'
const goldMuted = 'rgba(226,195,107,0.55)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textBody = 'rgba(255,255,255,0.70)'
const textFaint = 'rgba(255,255,255,0.30)'
const cardBg = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(255,255,255,0.07)'

const STEPS = [
  {
    number: '01',
    title: 'You create your capsule — free, in minutes',
    body: 'Tell us who the event is for, what type of occasion it is, and what you want people to say about them. No design skills needed. Your tribute wall is live immediately — with your honouree\'s name, a personalised link, and a world map that will fill with voices as tributes arrive.',
    note: 'No credit card. No commitment. Free forever at the tribute wall level.',
    icon: '◈',
  },
  {
    number: '02',
    title: 'You share the link — voices arrive from anywhere',
    body: 'Share your capsule link via WhatsApp, email, or any channel you use. Anyone — family members in Lagos, friends in London, colleagues in Houston — can open the link and leave a tribute. They type their message, add a photo if they like, and submit. You see it arrive in your dashboard.',
    note: 'No app download. No account needed for contributors. Works on any phone.',
    icon: '◎',
  },
  {
    number: '03',
    title: 'You moderate — only what you approve goes live',
    body: 'Every tribute comes to you first. You read it, and with one tap you approve it to the public wall. If something needs adjusting, you can request a correction from the contributor before approving. You are always in control of what the world sees.',
    note: 'Auto-approval is available but off by default — your call.',
    icon: '◉',
  },
  {
    number: '04',
    title: 'The wall fills — and your event has a living record',
    body: 'As tributes are approved, they appear on the wall in real time. Pins appear on the world map showing where each voice came from. During the event itself, you can display the live wall on a screen — guests see tributes arriving as they happen. After the event, the wall stays live for 90 days on the free tier.',
    note: 'The wall is the gift your guests give to the person being honoured.',
    icon: '◆',
  },
  {
    number: '05',
    title: 'You expand — add what your event needs',
    body: 'From your dashboard, you can add capabilities as you need them. Let guests record voice tributes. Enable video messages. Set up a dignified way for guests to contribute financially to the occasion. Coordinate fabric and attire for your event. Each add-on is priced individually — you only pay for what you actually use.',
    note: 'Every add-on purchased from your dashboard — no phone calls, no back-and-forth.',
    icon: '◐',
  },
  {
    number: '06',
    title: 'The event ends — the legacy continues',
    body: 'After your event, LegacyCapsule compiles everything — every tribute, every voice, every photo — into a beautiful digital publication. This is sent to every contributor who shared their email. The person being honoured has a permanent, shareable record of everyone who showed up for them — not just on the day, but from everywhere in the world.',
    note: 'Events end. Legacies don\'t.',
    icon: '✦',
  },
]

const ADDONS = [
  { name: 'Voice Tributes', desc: 'Guests record a personal voice message. Plays directly in the tribute card. Hear the warmth in someone\'s voice — text cannot replicate it.', available: true },
  { name: 'Video Tributes', desc: 'Guests upload a short video message. Shown with a thumbnail in the tribute wall. Perfect for family members who want to say something more than words allow.', available: true },
  { name: 'Ways to Honour', desc: 'A dignified, private channel for guests who want to contribute financially to the occasion. Your bank details, shown tastefully — not a crowdfunding page. Guests acknowledge their gift through the platform.', available: true },
  { name: 'Digital Publication', desc: 'Every tribute, photo, and voice compiled into a beautifully designed digital keepsake. Distributed to all contributors. The permanent record of your event.', available: true },
  { name: 'Extended Validity', desc: 'Keep your capsule live beyond 90 days. Perfect for milestone birthdays, memorials, and events you want to remember for years.', available: true },
  { name: 'Fabric & Attire Coordination', desc: 'Manage aso-ebi and dress code orders directly through your capsule. Guests order, pay, and track delivery — all in one place. You see everything in real time.', available: false },
  { name: 'Guest Management & RSVP', desc: 'Build your guest list, send Save the Dates, track RSVPs, and manage event phases — all connected to your capsule.', available: false },
  { name: 'Table Management', desc: 'Design your seating plan, assign guests to tables, generate table cards — connected to your confirmed guest list.', available: false },
  { name: 'Access Codes', desc: 'Unique QR codes for every guest tier. Ushers scan at entry. You see check-in in real time. No paper lists.', available: false },
]

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f0a1e 0%, #14083a 40%, #0f0a1e 100%)', fontFamily: "'DM Sans', sans-serif", color: textBody }}>

      {/* Hero */}
      <div style={{ paddingTop: '100px', paddingBottom: '60px', textAlign: 'center', padding: '100px 24px 60px', maxWidth: '680px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', color: goldMuted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600 }}>How It Works</p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 700, color: textPrimary, lineHeight: 1.15, marginBottom: '20px' }}>
          Simple to start.<br />Built to last.
        </h1>
        <p style={{ fontSize: '17px', color: textBody, lineHeight: 1.75, marginBottom: '32px' }}>
          Here is exactly what happens when you create a LegacyCapsule — from the moment you sign up to the day your event becomes a permanent record.
        </p>
        <Link href="/book" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: '12px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '14px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em' }}>
          Start Free — No Card Needed
        </Link>
      </div>

      {/* Steps */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        {STEPS.map((step, i) => (
          <div key={step.number} style={{ display: 'flex', gap: '24px', marginBottom: '48px', alignItems: 'flex-start' }}>
            {/* Number + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: goldFaint, border: `1px solid rgba(226,195,107,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: gold }}>
                {step.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: '1px', flex: 1, minHeight: '40px', background: 'linear-gradient(to bottom, rgba(226,195,107,0.2), transparent)', marginTop: '8px' }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: '10px' }}>
              <p style={{ fontSize: '11px', color: goldMuted, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>Step {step.number}</p>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 700, color: textPrimary, lineHeight: 1.3, marginBottom: '12px' }}>{step.title}</h2>
              <p style={{ fontSize: '15px', color: textBody, lineHeight: 1.8, marginBottom: '12px' }}>{step.body}</p>
              <p style={{ fontSize: '12px', color: goldMuted, fontStyle: 'italic', padding: '8px 12px', borderRadius: '8px', background: goldFaint, border: `1px solid rgba(226,195,107,0.15)`, display: 'inline-block' }}>
                ✦ {step.note}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add-ons section */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', color: goldMuted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>Expand Your Capsule</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: textPrimary, lineHeight: 1.2, marginBottom: '16px' }}>
            Add what your event needs
          </h2>
          <p style={{ fontSize: '15px', color: textBody, lineHeight: 1.75 }}>
            Every event is different. Add capabilities from your dashboard — only what you need, only when you need it. No bundles. No bloated packages.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {ADDONS.map(addon => (
            <div key={addon.name} style={{ padding: '16px 18px', borderRadius: '12px', background: cardBg, border: `1px solid ${addon.available ? 'rgba(226,195,107,0.12)' : cardBorder}`, display: 'flex', gap: '14px', alignItems: 'flex-start', opacity: addon.available ? 1 : 0.6 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: addon.available ? gold : 'rgba(255,255,255,0.2)', marginTop: '6px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: addon.available ? textPrimary : textBody }}>{addon.name}</p>
                  {!addon.available && (
                    <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: textFaint, border: `1px solid rgba(255,255,255,0.1)`, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coming Soon</span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: textBody, lineHeight: 1.65 }}>{addon.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ways to Honour highlight */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(226,195,107,0.05)', border: '1px solid rgba(226,195,107,0.2)', textAlign: 'center' }}>
          <p style={{ fontSize: '24px', marginBottom: '16px' }}>◈</p>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: textPrimary, marginBottom: '12px' }}>A dignified way for guests to contribute</h3>
          <p style={{ fontSize: '14px', color: textBody, lineHeight: 1.8, marginBottom: '16px', maxWidth: '480px', margin: '0 auto 16px' }}>
            Many guests at significant events want to contribute financially — not out of obligation, but out of genuine love and respect. Ways to Honour gives them a private, dignified channel to do so. Your bank details, shown tastefully within the tribute experience. No crowdfunding energy. No awkwardness. Just a graceful option for those who want to give more than words.
          </p>
          <Link href="/book" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            Start Your Capsule Free
          </Link>
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ textAlign: 'center', padding: '0 24px 80px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: textPrimary, marginBottom: '16px' }}>Ready to start?</h2>
        <p style={{ fontSize: '15px', color: textBody, marginBottom: '28px' }}>Your tribute wall is live in minutes. Free. No card needed.</p>
        <Link href="/book" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: '14px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '15px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em', boxShadow: '0 8px 32px rgba(226,195,107,0.25)' }}>
          Create Your Capsule →
        </Link>
        <div style={{ marginTop: '20px' }}>
          <Link href="/" style={{ fontSize: '13px', color: goldMuted, textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>

      <p style={{ textAlign: 'center', padding: '0 0 32px', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        LEGACYCAPSULE · EVENTS END. LEGACIES DON'T.
      </p>
    </div>
  )
}
