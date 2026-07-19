/* =========================================================
   FILE PATH: app/help/page.tsx — Knowledgebase v2
   
   UPDATED: Claude Sonnet 4.6 · July 2026
   - Added all premium and free services as full sections
   - Added ?section=[id] query param for deep linking
   - Added ?ref=booking|dashboard context banner
   - "Close this tab" button when opened from platform
   - All anchor IDs aligned with service keys
   - Search works across all content
========================================================= */
'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// ─────────────────────────────────────────────────────────
// SECTION 1 — Design tokens
// ─────────────────────────────────────────────────────────

const gold       = '#E2C36B'
const goldFaint  = 'rgba(226,195,107,0.10)'
const goldMuted  = 'rgba(226,195,107,0.55)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textBody   = 'rgba(255,255,255,0.70)'
const textFaint  = 'rgba(255,255,255,0.30)'
const cardBg     = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(255,255,255,0.07)'

// ─────────────────────────────────────────────────────────
// SECTION 2 — Knowledge base sections
// All free services + all premium add-ons documented here.
// IDs match service keys used in ServicesTab and booking flow.
// ─────────────────────────────────────────────────────────

const SECTIONS = [

  // ── Always free ──────────────────────────────────────────────────────────

  {
    id: 'getting-started',
    icon: '◈',
    title: 'Getting Started',
    subtitle: 'Everything you need to go live',
    badge: null,
    articles: [
      { q: 'How do I create a capsule?', a: 'Go to itslegacycapsule.com/book and follow the steps. Tell us who the event is for, what type of occasion it is, and give your capsule a name. Your tribute wall is ready immediately — no payment required. The whole process takes under three minutes.' },
      { q: 'Do I need to create an account?', a: 'No account is required to create a free capsule. You verify your email address during the process, and that email becomes your access key. To return to your dashboard, go to /signin and enter your email — we send you a 4-character code each time.' },
      { q: 'How do I share my capsule with guests?', a: 'Once your capsule is set up, your dashboard shows a shareable link in the format itslegacycapsule.com/for/[your-name]. Share it via WhatsApp, email, or any channel you use. No app download required for guests.' },
      { q: 'What does the free tier include?', a: 'The free tier includes a live tribute wall, a world map showing where voices came from, a profile canvas for your honouree, Community Memories & Stories room, a Family Rep portal, and 90 days of active tribute collection. No credit card required.' },
      { q: 'Can contributors leave tributes from outside Nigeria?', a: 'Yes. Anyone anywhere in the world with the link can leave a tribute. No account, no app, no payment. The world map shows where every voice came from.' },
      { q: 'When does my capsule go live?', a: 'Your capsule comes to life when the first tribute arrives. Until then, it is set up and waiting — the link is shareable but no content shows yet. This means you can set everything up at your own pace before sharing with guests.' },
    ]
  },

  {
    id: 'tribute_wall',
    icon: '◎',
    title: 'Tribute Wall',
    subtitle: 'The live collection of voices for your event',
    badge: 'Always Free',
    articles: [
      { q: 'What is the tribute wall?', a: 'The tribute wall is a live page where guests leave written tributes, photos, voice recordings, and video messages for the person being honoured. It updates in real time as you approve submissions. It can be displayed on a screen during the event itself.' },
      { q: 'How does moderation work?', a: 'Every tribute comes to you first. From your dashboard, you read each submission and approve or decline it with one tap. Only approved tributes appear on the public wall. If a tribute needs adjustment, you can request a correction from the contributor before approving.' },
      { q: 'Can I display the wall during my event?', a: 'Yes. Open itslegacycapsule.com/for/[your-name]/display on any screen at your venue. Approved tributes animate onto the screen in real time as your guests submit them. Share the display link with your AV team in advance.' },
      { q: 'Can contributors edit their tribute after submitting?', a: 'Contributors receive an edit link in their submission confirmation email. After editing, the tribute returns to your moderation queue for re-approval before going live again.' },
      { q: 'What is the tribute character limit?', a: 'Tributes are limited to 500 characters — personal, concise, and meaningful. For longer stories, memories, and photos, contributors can use the Community Memories & Stories room within the same capsule.' },
      { q: 'What happens after 90 days on the free tier?', a: 'Your capsule becomes read-only. The wall stays visible but no new tributes can be submitted. You can extend your capsule from your dashboard using Extended Validity.' },
    ]
  },

  {
    id: 'community_stories',
    icon: '◇',
    title: 'Community Memories & Stories',
    subtitle: 'A dedicated room for longer stories and memories',
    badge: 'Always Free',
    articles: [
      { q: 'What is the Community Memories & Stories room?', a: 'It is a dedicated space within your capsule where contributors share longer stories, memories, and lessons — not just brief tributes. Stories are organised by topic, making it easy to read what different groups of people remember about the honouree.' },
      { q: 'How is it different from the tribute wall?', a: 'The tribute wall is for concise personal messages — up to 500 characters. The Community Memories & Stories room is for longer, richer content — stories, memories, photos, and reflections that go deeper than a tribute allows.' },
      { q: 'Who can see it?', a: 'Anyone with your capsule link can access the Community Memories & Stories room. Stories go through the same moderation process as tributes — you approve each one before it appears.' },
      { q: 'Is it included in the Digital Publication?', a: 'Yes. When you generate a publication, Community Memories & Stories are automatically organised into chapters by topic and included as a dedicated section of the publication.' },
      { q: 'Is it free?', a: 'Yes. Community Memories & Stories is included in every capsule at no cost — free and pre-booked alike.' },
    ]
  },

  {
    id: 'profile',
    icon: '◐',
    title: 'Honouree Profile',
    subtitle: 'A full canvas for the person being celebrated',
    badge: 'Always Free',
    articles: [
      { q: 'What is the honouree profile?', a: 'The honouree profile is a dedicated page within your capsule where you share the story of the person being celebrated. Add a biography, milestones, a featured photo, a gallery, and more. Think of it as a beautifully designed portrait page — permanent and shareable.' },
      { q: 'How do I edit the profile?', a: 'From your manage dashboard, go to the Profile tab. Add, edit, and reorder sections — biography, milestones, gallery. Changes go live immediately.' },
      { q: 'Can I add multiple photos?', a: 'Yes. The profile supports a featured hero photo, a full gallery, and photos submitted by contributors. All photos are stored securely.' },
      { q: 'Is the profile public?', a: 'Yes. The honouree profile is publicly accessible to anyone with the capsule link.' },
    ]
  },

  {
    id: 'family_rep_portal',
    icon: '◑',
    title: 'Family Rep Portal',
    subtitle: 'Private access for the family representative',
    badge: 'Always Free',
    articles: [
      { q: 'What is the Family Rep Portal?', a: 'A private, token-gated portal for the family representative of the honouree. They can view all tributes, acknowledgements, and expressions of support — without needing access to the full organiser dashboard.' },
      { q: 'How does the family representative access it?', a: 'The organiser generates a secure link from the dashboard and shares it with the family representative. The link expires after a set period for security.' },
      { q: 'What can the family representative see?', a: 'Approved tributes, Gift of Honour acknowledgements, contributor details, and summary statistics. They cannot approve, decline, or edit content — that remains with the organiser.' },
    ]
  },

  // ── Premium add-ons ───────────────────────────────────────────────────────

  {
    id: 'publication',
    icon: '◎',
    title: 'Digital Publication',
    subtitle: 'A beautifully compiled keepsake — sent to everyone who contributed',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is the Digital Publication?', a: 'The Digital Publication transforms your capsule into a beautifully designed PDF — every tribute, photo, story, and profile laid out like a commemorative record. You control the arrangement and the design. When ready, one click distributes it to every contributor who left their email.' },
      { q: 'What is included in the publication?', a: 'The publication includes your honouree profile, all approved tributes, Community Memories & Stories organised by topic chapter, event phase photographs, D-Day guest captures, and a who-attended section. You choose which sections to include and in what order.' },
      { q: 'Can I design it myself?', a: 'You choose from five professional themes — Classic, Soft, Romantic, Vibrant, and Spiritual — each with its own typography, colour palette, and section styling. Within your theme, you arrange sections using the Publication Editor and choose which content to feature prominently.' },
      { q: 'How is it distributed?', a: 'Once you are satisfied with the publication, one click sends it to every contributor who provided their email address. Each recipient gets a personal copy with a permanent access link. No printing, no postage, no design fees.' },
      { q: 'Does it include Programme Exports?', a: 'Yes. When Digital Publication is active, the Programme Exports tool is unlocked — you can copy selected tributes and Community Stories to your clipboard, formatted for use in a printed programme booklet.' },
      { q: 'Does it work on mobile?', a: 'The publication is designed as a PDF-quality document best viewed on a tablet or desktop. On mobile, contributors receive a link they can open at any time.' },
    ]
  },

  {
    id: 'ways_to_honour',
    icon: '✦',
    title: 'Gift of Honour',
    subtitle: 'A dignified, private channel for guests to express financial support',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is Gift of Honour?', a: 'Gift of Honour is a private, tasteful section of your capsule where guests can see your bank details and contribute financially to the occasion. It is not a crowdfunding page. It is a graceful, optional channel for guests who want to give more than words — built into the tribute experience naturally.' },
      { q: 'How do I set it up?', a: 'From your manage dashboard, go to Services and activate Gift of Honour. Then add your bank account details — account name, bank, and account number. You can add multiple accounts for different banks or currencies.' },
      { q: 'How do guests use it?', a: 'Guests visiting your capsule see the Gift of Honour section with your account details. They make a bank transfer directly, then acknowledge their gesture on the platform. You receive a notification. The acknowledgement is recorded for your reference.' },
      { q: 'Does LegacyCapsule handle the money?', a: 'No. LegacyCapsule never touches any financial flow between you and your guests. All transfers go directly between your guest and your bank account. We provide only the display mechanism and the acknowledgement record.' },
      { q: 'Are amounts shown publicly?', a: 'Never. Amounts are completely private. Only the family representative and organiser can see acknowledgement records. The public tribute wall shows only that a Gift of Honour section exists.' },
      { q: 'Can I add a reference guide?', a: 'Yes. Add a reference guide — for example "Please use your name as reference" — which appears alongside your account details to help you reconcile incoming transfers.' },
    ]
  },

  {
    id: 'audio_tributes',
    icon: '◉',
    title: 'Voice Tributes',
    subtitle: 'Hear the voices of the people who showed up',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What are Voice Tributes?', a: 'Voice Tributes allow contributors to record a personal audio message directly in the browser — no app download needed. The recording appears in their tribute card on the wall. Hearing a familiar voice adds a dimension that text cannot replicate.' },
      { q: 'How does a contributor record?', a: 'On your tribute wall, contributors see an option to record a voice message. They tap the microphone icon, record up to 30 seconds, preview it, and submit. It works on any smartphone or computer with a microphone.' },
      { q: 'Is there a time limit?', a: 'Voice tributes are limited to 30 seconds — long enough for a meaningful personal message, short enough to remain focused.' },
      { q: 'Do contributors need to pay?', a: 'No. Once Voice Tributes are activated on your capsule, all contributors can use them at no additional cost. You pay once to unlock the feature for your event.' },
    ]
  },

  {
    id: 'video_tributes',
    icon: '▶',
    title: 'Video Tributes',
    subtitle: 'See the faces of the people who showed up',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What are Video Tributes?', a: 'Video Tributes allow contributors to upload a short video message from their phone or computer. The video appears in their tribute card with a thumbnail and play button. Perfect for family members who want to say something more than words allow.' },
      { q: 'How does a contributor submit a video?', a: 'On your tribute wall, contributors see an option to attach a video to their tribute. They select or record a video on their device and upload it. It appears in their tribute card after your approval.' },
      { q: 'Is there a file size limit?', a: 'Videos are limited to 30 seconds maximum. This covers the vast majority of meaningful tribute messages while keeping the wall fast and accessible for all visitors.' },
      { q: 'Do contributors need to pay?', a: 'No. Once Video Tributes are activated on your capsule, all contributors can use them at no additional cost.' },
    ]
  },

  {
    id: 'guest_management',
    icon: '◈',
    title: 'Guest Management & Seating',
    subtitle: 'Your full event guest coordination system',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is Guest Management & Seating?', a: 'A complete guest coordination system built into your capsule. Manage your guest list, collect RSVPs, assign tables, track dietary requirements, and coordinate seating — all from your dashboard. Includes printable table cards with context-aware QR codes.' },
      { q: 'What does it include?', a: 'Guest list management, RSVP tracking, table assignment, seating chart, dietary requirements, tier designation (VVIP, VIP, General, etc.), and printable table cards. Table card QR codes link directly to the tribute wall before the event, and to the D-Day upload portal on the event day.' },
      { q: 'Does it include Access Codes?', a: 'Guest Management & Seating and Access Codes are separate services. Guest Management covers your guest list and seating coordination. Access Codes covers event-day entry verification and check-in. Many organisers use both together for a complete event management experience.' },
      { q: 'How many guests can I add?', a: 'There is no hard guest limit. Performance is optimised for events of up to 500 guests. For larger events, contact us.' },
    ]
  },

  {
    id: 'access_codes',
    icon: '◉',
    title: 'Access Code System',
    subtitle: 'Unique entry codes, usher check-in, and live arrival metrics',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is the Access Code System?', a: 'The Access Code System generates a unique QR code and numeric code for each guest. Ushers scan or type codes at the entrance to verify entry. The organiser sees live arrival metrics on their dashboard throughout the event.' },
      { q: 'How do guests receive their codes?', a: 'Codes are emailed to each guest from your dashboard with one click. Each email contains a QR code image and a 6-digit numeric code as backup. Guests who cannot have their QR scanned can give the number verbally.' },
      { q: 'How does the usher interface work?', a: 'From your dashboard, generate a temporary PIN for each usher. They open the check-in page on their phone and enter the PIN to gain scan access. The check-in page works on any phone browser — no app required. A scan confirms entry, shows the guest name and tier, and logs the check-in.' },
      { q: 'What happens if a guest does not have their code?', a: 'Ushers can search by name and check in manually. Walk-in guests can be registered and admitted on the spot. All check-ins are logged.' },
      { q: 'Can I see arrivals in real time?', a: 'Yes. Your dashboard shows live arrival metrics including total arrived, breakdown by tier, outstanding VVIPs, invalid scan attempts, and a rolling recent arrivals feed. It refreshes every 15 seconds automatically.' },
    ]
  },

  {
    id: 'attire',
    icon: '◐',
    title: 'Fabric & Attire',
    subtitle: 'Coordinated event dressing — orders, payments, dispatch',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is the Fabric & Attire module?', a: 'Fabric & Attire lets you manage coordinated clothing orders for your event directly through your capsule. Showcase the fabric or attire, let guests order with their size and delivery details, track payments, and manage dispatch — all in one place. Built for events where coordinated dressing is part of the occasion, such as Aso-Ebi.' },
      { q: 'Can guests outside Nigeria order?', a: 'Yes. Guests can designate a custodian address — a family member or friend in the event country who will receive the fabric on their behalf. Multiple guests can share the same custodian address and orders are consolidated automatically.' },
      { q: 'How do I track orders and payments?', a: 'Your dashboard shows all orders, payment status, sizes, custodian addresses, and dispatch status. You manage the process from order placement through to collection confirmation.' },
    ]
  },

  {
    id: 'extended_validity',
    icon: '◇',
    title: 'Extended Validity',
    subtitle: 'Keep your capsule active beyond the standard period',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is Extended Validity?', a: 'Every capsule includes 90 days of active tribute collection from the date the first tribute arrives. Extended Validity extends this period so guests can continue contributing after the standard window closes.' },
      { q: 'When should I purchase it?', a: 'You can purchase Extended Validity at any time — before your capsule goes live, during the tribute collection period, or when you receive the expiry notice. Your capsule does not lose existing tributes when the standard period ends.' },
      { q: 'How long does it extend the capsule?', a: 'Extended Validity adds a further period of active collection. The exact duration is shown in your dashboard pricing. You can purchase multiple extensions if needed.' },
    ]
  },

  {
    id: 'additional_phase',
    icon: '◈',
    title: 'Additional Event Phase',
    subtitle: 'Add more phases to your event structure',
    badge: 'Premium Add-on',
    articles: [
      { q: 'What is an Event Phase?', a: 'An Event Phase represents a distinct part of your event — for example, a Traditional Ceremony, Church Service, and Reception are three separate phases of one event. Each phase has its own QR code for guests to capture memories from that specific part of the occasion.' },
      { q: 'How many phases are included?', a: 'Free capsules include one event phase. Pre-booked capsules include two. You can purchase additional phases individually from the Services tab in your dashboard.' },
      { q: 'What does each phase have?', a: 'Each phase has a name, event date, location, its own QR code, and a 24-hour D-Day capture window on the event date. The QR code automatically directs guests to the tribute wall before the event, and to the D-Day upload portal on the day itself.' },
    ]
  },

  // ── Event day ─────────────────────────────────────────────────────────────

  {
    id: 'dday',
    icon: '◎',
    title: 'D-Day Guest Captures',
    subtitle: 'Guest photos and tributes on the event day',
    badge: 'Always Free',
    articles: [
      { q: 'What is D-Day capture?', a: 'D-Day capture is a dedicated experience for guests to share photos and messages on the event day itself. The D-Day portal opens automatically on the event date and closes 24 hours later. Guests scan their table card QR code on the day — it redirects directly to the upload portal.' },
      { q: 'What can guests upload?', a: 'Guests can upload a photo or video they have taken at the event, leave a tribute message, or both. Their name and optional email are collected so their contribution is attributed correctly.' },
      { q: 'Why 24 hours?', a: 'The capture window is fixed at 24 hours starting from 6am on the event date. This is consistent for all capsules and cannot be changed — it ensures D-Day content is genuinely from the event day.' },
      { q: 'Where do D-Day captures appear?', a: 'D-Day photos appear in a dedicated gallery strip on the Live Wall display and in the D-Day section of the Digital Publication. D-Day tributes are marked separately from pre-event tributes.' },
    ]
  },

  {
    id: 'live_wall',
    icon: '◇',
    title: 'Live Wall Display',
    subtitle: 'Full-screen tribute display for your venue screen',
    badge: 'Always Free',
    articles: [
      { q: 'What is the Live Wall Display?', a: 'The Live Wall Display is a full-screen page designed for projection at your venue. It shows approved tributes arriving in real time — each new approval animates onto the screen with a spotlight moment. Your guests can watch voices arrive as they happen.' },
      { q: 'How do I set it up?', a: 'In your Services tab, find the Live Wall section. Copy the display URL or scan the QR code with the venue screen. Share the URL with your AV team before the event so they can have it ready.' },
      { q: 'Does it need any special software?', a: 'No. The Live Wall works in any modern browser on any screen. Open the URL in a browser and it will fill the screen automatically.' },
      { q: 'How are new tributes approved?', a: 'Use your normal moderation queue in the manage dashboard. Approving a tribute from your phone instantly broadcasts it to the Live Wall display at the venue.' },
    ]
  },

  // ── Account and help ──────────────────────────────────────────────────────

  {
    id: 'account',
    icon: '◑',
    title: 'Account & Pricing',
    subtitle: 'Billing, upgrades, and capsule management',
    badge: null,
    articles: [
      { q: 'How do I sign back into my dashboard?', a: 'Go to itslegacycapsule.com/signin and enter your email address. We send a 4-character code to your inbox. Enter the code in the browser — you are taken directly to your dashboard. No password to remember.' },
      { q: 'Can I have multiple capsules?', a: 'Yes. One email address can manage multiple capsules. When you sign in with an email that has multiple capsules, you see a listing of all of them.' },
      { q: 'What currencies are accepted?', a: 'We accept Nigerian Naira (₦) via Paystack and major international currencies (€ EUR, £ GBP, $ USD) via Stripe. Your currency is detected automatically based on your location. If the wrong currency shows, contact us.' },
      { q: 'What is a pre-booked capsule?', a: 'A pre-booked capsule lets you set everything up in advance — choose your services, make payment, and get your capsule ready — before sharing it with guests. Your capsule goes live when the first tribute arrives, not when you pay. Ideal for events that are planned months ahead.' },
      { q: 'What is "Gift a Capsule"?', a: 'You can purchase a LegacyCapsule as a gift for someone else\'s event. Choose the services you want to include as the gift, pay, and the recipient receives a notification explaining what they have received and how to get started.' },
      { q: 'What happens if I need help?', a: 'Contact us through this help page or email hello@itslegacycapsule.com. We respond within 24 hours on business days.' },
    ]
  },

]

// ─────────────────────────────────────────────────────────
// SECTION 3 — Badge styling
// ─────────────────────────────────────────────────────────

function Badge({ text }: { text: string }) {
  const isPremium = text === 'Premium Add-on'
  return (
    <span style={{
      fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      padding: '3px 8px', borderRadius: '20px',
      background: isPremium ? 'rgba(226,195,107,0.1)' : 'rgba(74,222,128,0.08)',
      border: isPremium ? '1px solid rgba(226,195,107,0.25)' : '1px solid rgba(74,222,128,0.2)',
      color: isPremium ? 'rgba(226,195,107,0.8)' : 'rgba(134,239,172,0.8)',
      flexShrink: 0,
    }}>
      {text}
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// SECTION 4 — Main page
// ─────────────────────────────────────────────────────────

function HelpPageInner() {
  const searchParams  = useSearchParams()
  const refParam      = searchParams.get('ref')       // 'booking' | 'dashboard'
  const sectionParam  = searchParams.get('section')   // service id e.g. 'publication'

  const [query,       setQuery]       = useState('')
  const [openArticle, setOpenArticle] = useState<string | null>(null)

  // Auto-scroll to section if deep-linked
  useEffect(() => {
    if (sectionParam) {
      setTimeout(() => {
        const el = document.getElementById(sectionParam)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [sectionParam])

  const filtered = query.trim().length > 1
    ? SECTIONS.map(s => ({
        ...s,
        articles: s.articles.filter(a =>
          a.q.toLowerCase().includes(query.toLowerCase()) ||
          a.a.toLowerCase().includes(query.toLowerCase()) ||
          s.title.toLowerCase().includes(query.toLowerCase())
        )
      })).filter(s => s.articles.length > 0)
    : SECTIONS

  const fromPlatform = refParam === 'booking' || refParam === 'dashboard'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f0a1e 0%, #14083a 30%, #0f0a1e 100%)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Context banner — shown when opened from booking or dashboard ── */}
      {fromPlatform && (
        <div style={{ background: 'rgba(226,195,107,0.08)', borderBottom: '1px solid rgba(226,195,107,0.15)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '8px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(226,195,107,0.8)', margin: 0, lineHeight: 1.5 }}>
            {refParam === 'booking'
              ? 'You came here from the booking flow. Read as much as you need, then close this tab to continue your order.'
              : 'You came here from your dashboard. Close this tab when you are done to return to your capsule.'}
          </p>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(226,195,107,0.3)', background: 'rgba(226,195,107,0.1)', color: gold, fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
          >
            ✕ Close & Return
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '80px 24px 48px', maxWidth: '640px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', color: goldMuted, letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '16px', fontWeight: 600 }}>
          Help & Services Guide
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: textPrimary, lineHeight: 1.2, marginBottom: '16px' }}>
          Everything LegacyCapsule offers
        </h1>
        <p style={{ fontSize: '15px', color: textBody, lineHeight: 1.7, marginBottom: '28px' }}>
          Search for any feature or question. Every free service and premium add-on is documented here.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '520px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search — e.g. 'how do I share my link' or 'voice tributes'"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '14px 20px 14px 48px',
              borderRadius: '14px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(226,195,107,0.2)',
              color: textPrimary, fontSize: '14px', outline: 'none',
              fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
            }}
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: goldMuted }}>◎</span>
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: textFaint, cursor: 'pointer', fontSize: '18px', fontFamily: "'DM Sans', sans-serif" }}
            >
              ×
            </button>
          )}
        </div>

        {/* Quick links to service sections */}
        {!query && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', justifyContent: 'center', marginTop: '20px' }}>
            {SECTIONS.filter(s => s.badge).map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '20px', background: cardBg, border: `1px solid ${cardBorder}`, color: textFaint, textDecoration: 'none', transition: 'color 0.15s' }}
              >
                {s.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Sections ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: textFaint }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>◎</p>
            <p style={{ fontSize: '15px' }}>No results for "{query}"</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              Try different words or{' '}
              <Link href="mailto:hello@itslegacycapsule.com" style={{ color: goldMuted }}>email us directly</Link>
            </p>
          </div>
        )}

        {filtered.map(section => (
          <div key={section.id} id={section.id} style={{ marginBottom: '52px', scrollMarginTop: '80px' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(226,195,107,0.1)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: goldFaint, border: '1px solid rgba(226,195,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: gold, flexShrink: 0 }}>
                {section.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>{section.title}</h2>
                  {section.badge && <Badge text={section.badge} />}
                </div>
                <p style={{ fontSize: '12px', color: textFaint, margin: '3px 0 0' }}>{section.subtitle}</p>
              </div>
            </div>

            {/* Articles */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {section.articles.map((article, i) => {
                const key    = `${section.id}-${i}`
                const isOpen = openArticle === key
                return (
                  <div key={key} style={{ borderRadius: '10px', background: cardBg, border: `1px solid ${isOpen ? 'rgba(226,195,107,0.15)' : cardBorder}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <button
                      onClick={() => setOpenArticle(isOpen ? null : key)}
                      style={{ width: '100%', padding: '14px 16px', textAlign: 'left' as const, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500, color: isOpen ? gold : textPrimary, lineHeight: 1.4, transition: 'color 0.2s' }}>
                        {article.q}
                      </span>
                      <span style={{ fontSize: '18px', color: isOpen ? gold : textFaint, flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s, color 0.2s', marginTop: '-2px' }}>
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px' }}>
                        <div style={{ height: '1px', background: 'rgba(226,195,107,0.1)', marginBottom: '14px' }} />
                        <p style={{ fontSize: '14px', color: textBody, lineHeight: 1.8, margin: 0 }}>
                          {article.a}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* ── Contact strip ── */}
        <div style={{ padding: '24px', borderRadius: '16px', background: goldFaint, border: '1px solid rgba(226,195,107,0.18)', textAlign: 'center' as const, marginTop: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: textPrimary, marginBottom: '8px' }}>Still have questions?</p>
          <p style={{ fontSize: '13px', color: textBody, marginBottom: '16px' }}>We respond within 24 hours on business days.</p>
          <Link href="mailto:hello@itslegacycapsule.com" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            Email Us
          </Link>
        </div>

        {/* ── Close tab strip — shown when from platform ── */}
        {fromPlatform && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' as const }}>
            <p style={{ fontSize: '13px', color: textFaint, marginBottom: '12px' }}>
              {refParam === 'booking'
                ? 'Ready to continue your order? Close this tab to return to the booking flow.'
                : 'Done reading? Close this tab to return to your dashboard.'}
            </p>
            <button
              onClick={() => window.close()}
              style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(226,195,107,0.25)', background: 'rgba(226,195,107,0.08)', color: gold, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              ✕ Close & Return
            </button>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', padding: '0 0 32px', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
        LEGACYCAPSULE · EVENTS END. LEGACIES DON'T.
      </p>

    </div>
  )
}

export default function HelpPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
      </div>
    }>
      <HelpPageInner />
    </Suspense>
  )
}
