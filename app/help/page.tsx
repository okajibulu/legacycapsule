/* =========================================================
   app/help/page.tsx — Knowledgebase
   Static, Phase 1. Service headers per D53/Section 13.2.
   Search-driven — reveals content on query.
========================================================= */
'use client'
import { useState } from 'react'
import Link from 'next/link'

const gold = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.10)'
const goldMuted = 'rgba(226,195,107,0.55)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textBody = 'rgba(255,255,255,0.70)'
const textFaint = 'rgba(255,255,255,0.30)'
const cardBg = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(255,255,255,0.07)'

const SECTIONS = [
  {
    id: 'getting-started',
    icon: '◈',
    title: 'Getting Started',
    subtitle: 'Everything you need to go live',
    articles: [
      { q: 'How do I create a capsule?', a: 'Go to itslegacycapsule.com/book and follow the steps. Tell us who the event is for, what type of occasion it is, and give your capsule a name. Your tribute wall is live immediately — no payment required. The whole process takes under three minutes.' },
      { q: 'Do I need to create an account?', a: 'No account is required to create a free capsule. You verify your email address during the booking process, and that email becomes your access key. To return to your dashboard, go to /signin and enter your email — we send you a 4-character code to sign in.' },
      { q: 'How do I share my capsule with guests?', a: 'Once your capsule is live, your dashboard shows a shareable link in the format itslegacycapsule.com/for/[your-name]. Share it via WhatsApp, email, or any channel you use. No app download required for guests.' },
      { q: 'What does the free tier include?', a: 'The free tier includes a live tribute wall, up to 50 tributes, a world map showing where voices came from, a profile canvas for your honouree, and the wall stays live for 90 days. No credit card required.' },
      { q: 'Can contributors leave tributes from outside Nigeria?', a: 'Yes. Anyone anywhere in the world with the link can leave a tribute. No account, no app download, no payment. The world map shows where every voice came from.' },
    ]
  },
  {
    id: 'tribute-wall',
    icon: '◎',
    title: 'Tribute Wall',
    subtitle: 'The live collection of voices for your event',
    articles: [
      { q: 'What is the tribute wall?', a: 'The tribute wall is a live, public page where guests leave written tributes, photos, voice recordings, and video messages for the person being honoured. It updates in real time as you approve submissions. It can be displayed on a screen during the event itself.' },
      { q: 'How does moderation work?', a: 'Every tribute comes to you first. From your dashboard, you read each submission and approve or decline it with one tap. Only approved tributes appear on the public wall. If a tribute needs adjustment, you can request a correction from the contributor before approving.' },
      { q: 'Can I display the wall during my event?', a: 'Yes. Open your capsule link on any screen during the event. Tributes appear as they are approved — your guests can watch voices arrive in real time. There is no special "event mode" to activate — the wall is always live.' },
      { q: 'Can contributors edit their tribute after submitting?', a: 'Contributors can edit their own tribute using the edit link they receive in their submission confirmation email. After editing, the tribute returns to your moderation queue for re-approval before going live again.' },
      { q: 'What happens after 90 days on the free tier?', a: 'Your capsule becomes read-only. The wall stays visible but no new tributes can be submitted. You can extend your capsule from your dashboard by purchasing an extension add-on.' },
    ]
  },
  {
    id: 'ways-to-honour',
    icon: '◆',
    title: 'Ways to Honour',
    subtitle: 'A dignified way for guests to contribute financially',
    articles: [
      { q: 'What is Ways to Honour?', a: 'Ways to Honour is a private, tasteful section of your capsule profile where guests can see your bank details and contribute financially to the occasion. It is not a crowdfunding page. It is a graceful, optional channel for guests who want to give more than words — built into the tribute experience naturally.' },
      { q: 'How do I set it up?', a: 'From your manage dashboard, go to the Profile tab and find the Ways to Honour section. Add your bank account details — account name, bank, account number. Your account number is masked on the public page for privacy. You can add multiple accounts (e.g. for different banks or currencies).' },
      { q: 'How do guests use it?', a: 'Guests visiting your capsule profile see a Ways to Honour section. They see your account details, make a transfer through their own bank, and then acknowledge their contribution on the platform. You receive a notification. The acknowledgement is recorded — useful for thank-you follow-up.' },
      { q: 'Does LegacyCapsule handle the money?', a: 'No. LegacyCapsule never touches any financial flows between you and your guests. All transfers go directly between your guest and your bank account. We only provide the display mechanism and the acknowledgement record.' },
      { q: 'Can I add a reference or message for guests?', a: 'Yes. You can add a reference guide — for example, "Please use your name as reference" — which appears alongside your account details. This helps you reconcile transfers when they arrive.' },
    ]
  },
  {
    id: 'gifting',
    icon: '✦',
    title: 'Gifting a Capsule',
    subtitle: 'Give someone a LegacyCapsule as a gift',
    articles: [
      { q: 'Can I buy a capsule as a gift for someone else\'s event?', a: 'Yes. If you know someone who has an event coming up — a retirement, a milestone birthday, a wedding — you can purchase a LegacyCapsule on their behalf. Contact us through the help page and we will set it up with the organiser\'s email so they receive full control.' },
      { q: 'What does a gifted capsule include?', a: 'A gifted capsule starts at the free tier and can include any add-ons you choose to purchase as the gift. The recipient receives everything — the tribute wall, the dashboard, the profile canvas — under their own control from the moment they verify their email.' },
      { q: 'How will the recipient know?', a: 'We send a beautifully designed gift notification email to the event organiser explaining what they have received, who it is from, and how to get started. Their capsule is ready to go live immediately.' },
      { q: 'Is this appropriate for corporate events?', a: 'Yes. Many organisations gift a LegacyCapsule to a retiring colleague, a departing leader, or a team member marking a milestone. It is a professional, lasting gesture — far more meaningful than a card.' },
    ]
  },
  {
    id: 'audio-video',
    icon: '◉',
    title: 'Voice & Video Tributes',
    subtitle: 'Hear and see the people who showed up',
    articles: [
      { q: 'What are voice tributes?', a: 'Voice tributes allow contributors to record a personal audio message directly in the browser — no app download needed. The recording appears in their tribute card on the wall. Hearing someone\'s voice adds a dimension that text cannot replicate.' },
      { q: 'What are video tributes?', a: 'Video tributes allow contributors to upload a short video message from their phone or computer. The video appears in their tribute card with a thumbnail and play button. Perfect for family members who want to say something more than words allow.' },
      { q: 'Are voice and video tributes available on the free tier?', a: 'Voice and video tributes are premium add-ons available for purchase from your dashboard. Once enabled for your capsule, all contributors can use them at no additional cost to contributors.' },
      { q: 'Is there a time limit on recordings?', a: 'Voice tributes are limited to 2 minutes. Video tributes are limited to 50MB file size. These limits cover the vast majority of meaningful tribute messages.' },
    ]
  },
  {
    id: 'profile',
    icon: '◇',
    title: 'Honouree Profile',
    subtitle: 'A full canvas for the person being celebrated',
    articles: [
      { q: 'What is the honouree profile?', a: 'The honouree profile is a dedicated page within your capsule — accessible at itslegacycapsule.com/for/[name]/profile — where you can share the story of the person being celebrated. Add a biography, milestones, a photo gallery, quotes, and more. Think of it as a beautifully designed tribute page.' },
      { q: 'How do I edit the profile?', a: 'From your manage dashboard, go to the Profile tab. Add, edit, and reorder sections — biography, milestones, gallery, support information. Changes go live immediately.' },
      { q: 'Can I add multiple photos?', a: 'Yes. The profile supports a featured photo (displayed prominently at the top), a full gallery, and photo tributes submitted by contributors. All photos are stored securely and permanently.' },
      { q: 'Is the profile public?', a: 'Yes. The profile is publicly accessible to anyone with the link. It is not indexed by search engines by default on the free tier.' },
    ]
  },
  {
    id: 'attire',
    icon: '◐',
    title: 'Fabric & Attire Coordination',
    subtitle: 'Coming soon — manage aso-ebi and dress code orders',
    articles: [
      { q: 'What is the Fabric & Attire module?', a: 'The Fabric and Attire module lets you manage coordinated clothing orders for your event directly through your capsule. Showcase the fabric or attire, let guests order with their size and delivery details, track payments, and manage dispatch — all in one place. Built for events where coordinated dressing is part of the occasion.' },
      { q: 'Can guests outside Nigeria order?', a: 'Yes. Guests can designate a custodian address — a family member or friend in the event country who will receive the fabric on their behalf. Multiple guests can share the same custodian address and orders are consolidated automatically.' },
      { q: 'When will this be available?', a: 'Fabric and Attire coordination is coming soon. If you need this for an upcoming event, contact us and we will let you know the timeline.' },
    ]
  },
  {
    id: 'account',
    icon: '◑',
    title: 'Account & Pricing',
    subtitle: 'Billing, upgrades, and capsule management',
    articles: [
      { q: 'How do I sign back into my dashboard?', a: 'Go to itslegacycapsule.com/signin and enter your email address. We send a 4-character code to your inbox. Enter the code in the browser window — no link to click, no device switching. You are taken directly to your dashboard.' },
      { q: 'Can I have multiple capsules?', a: 'Yes. One email address can manage multiple capsules. When you sign in with an email that has multiple capsules, you see a dashboard listing all of them.' },
      { q: 'How do payments work?', a: 'All payments are processed in Nigerian Naira via Paystack. Prices are listed on our pricing page. International payment options are coming soon.' },
      { q: 'What happens if I need help?', a: 'Contact us through this help page or email hello@itslegacycapsule.com. We respond within 24 hours on business days.' },
    ]
  },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [openArticle, setOpenArticle] = useState<string | null>(null)

  const filtered = query.trim().length > 1
    ? SECTIONS.map(s => ({
        ...s,
        articles: s.articles.filter(a =>
          a.q.toLowerCase().includes(query.toLowerCase()) ||
          a.a.toLowerCase().includes(query.toLowerCase())
        )
      })).filter(s => s.articles.length > 0)
    : SECTIONS

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f0a1e 0%, #14083a 30%, #0f0a1e 100%)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '100px 24px 48px', maxWidth: '600px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', color: goldMuted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>Help & Knowledgebase</p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: textPrimary, lineHeight: 1.2, marginBottom: '16px' }}>
          How can we help?
        </h1>
        <p style={{ fontSize: '15px', color: textBody, lineHeight: 1.7, marginBottom: '28px' }}>
          Find answers about tribute walls, gifting, payments, and everything LegacyCapsule offers.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Search — e.g. 'how do I share my link'"
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
          {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: textFaint, cursor: 'pointer', fontSize: '18px' }}>×</button>}
        </div>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: textFaint }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>◎</p>
            <p style={{ fontSize: '15px' }}>No results for "{query}"</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Try different words or <Link href="mailto:hello@itslegacycapsule.com" style={{ color: goldMuted }}>email us directly</Link></p>
          </div>
        )}

        {filtered.map(section => (
          <div key={section.id} style={{ marginBottom: '48px' }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(226,195,107,0.1)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: goldFaint, border: '1px solid rgba(226,195,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: gold, flexShrink: 0 }}>
                {section.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, marginBottom: '2px' }}>{section.title}</h2>
                <p style={{ fontSize: '12px', color: textFaint }}>{section.subtitle}</p>
              </div>
            </div>

            {/* Articles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {section.articles.map((article, i) => {
                const key = `${section.id}-${i}`
                const isOpen = openArticle === key
                return (
                  <div key={key} style={{ borderRadius: '10px', background: cardBg, border: `1px solid ${isOpen ? 'rgba(226,195,107,0.15)' : cardBorder}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <button
                      onClick={() => setOpenArticle(isOpen ? null : key)}
                      style={{ width: '100%', padding: '14px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500, color: isOpen ? gold : textPrimary, lineHeight: 1.4, transition: 'color 0.2s' }}>{article.q}</span>
                      <span style={{ fontSize: '18px', color: isOpen ? gold : textFaint, flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s, color 0.2s', marginTop: '-2px' }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 16px' }}>
                        <div style={{ height: '1px', background: 'rgba(226,195,107,0.1)', marginBottom: '14px' }} />
                        <p style={{ fontSize: '14px', color: textBody, lineHeight: 1.8 }}>{article.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Contact strip */}
        <div style={{ padding: '24px', borderRadius: '16px', background: goldFaint, border: '1px solid rgba(226,195,107,0.18)', textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: textPrimary, marginBottom: '8px' }}>Still have questions?</p>
          <p style={{ fontSize: '13px', color: textBody, marginBottom: '16px' }}>We respond within 24 hours on business days.</p>
          <Link href="mailto:hello@itslegacycapsule.com" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '10px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            Email Us
          </Link>
        </div>
      </div>

      <p style={{ textAlign: 'center', padding: '0 0 32px', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        LEGACYCAPSULE · EVENTS END. LEGACIES DON'T.
      </p>
    </div>
  )
}
