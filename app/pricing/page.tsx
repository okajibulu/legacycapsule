/* =========================================================
   app/pricing/page.tsx
   Reads NGN prices from lc_pricing via API.
   Naira-only at launch. Paystack note.
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
========================================================= */
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const gold = '#E2C36B'
const goldFaint = 'rgba(226,195,107,0.10)'
const goldMuted = 'rgba(226,195,107,0.55)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textBody = 'rgba(255,255,255,0.70)'
const textFaint = 'rgba(255,255,255,0.30)'
const cardBg = 'rgba(255,255,255,0.03)'

export const metadata = {
  title: 'Pricing · LegacyCapsule',
  description: 'Simple, transparent pricing. Start free. Add what your event needs.',
}

// Add-ons to display with their lc_pricing keys
const ADDON_KEYS = [
  { key: 'voice_tribute', label: 'Voice Tributes', desc: 'Guests record audio messages', icon: '🎙️' },
  { key: 'video_tribute_30', label: 'Video Tributes (30s)', desc: 'Guests upload short video messages', icon: '🎬' },
  { key: 'video_tribute_60', label: 'Video Tributes (60s)', desc: 'Longer video tribute option', icon: '🎬' },
  { key: 'permanent_archive', label: 'Extended Validity', desc: 'Keep your capsule live beyond 90 days', icon: '♾️' },
  { key: 'fabric_attire', label: 'Fabric & Attire', desc: 'Manage aso-ebi and dress code orders', icon: '👗', comingSoon: true },
  { key: 'save_the_date', label: 'Save the Date', desc: 'Designed announcements and RSVP tracking', icon: '📅', comingSoon: true },
  { key: 'table_management', label: 'Table Management', desc: 'Seating plan and table card generation', icon: '🪑', comingSoon: true },
  { key: 'access_code_system', label: 'Access Codes', desc: 'QR-based guest check-in system', icon: '🎫', comingSoon: true },
]

function formatNGN(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

export default async function PricingPage() {
  // Fetch all pricing rows
  const { data: pricingRows } = await adminClient
    .from('lc_pricing')
    .select('key, label, ngn_price')

  const priceMap: Record<string, number> = {}
  pricingRows?.forEach(row => { priceMap[row.key] = row.ngn_price })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f0a1e 0%, #14083a 40%, #0f0a1e 100%)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '100px 24px 60px', maxWidth: '600px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', color: goldMuted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>Pricing</p>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 700, color: textPrimary, lineHeight: 1.15, marginBottom: '16px' }}>
          Start free.<br />Add what you need.
        </h1>
        <p style={{ fontSize: '16px', color: textBody, lineHeight: 1.75 }}>
          No packages. No bloated bundles. Your tribute wall is free forever. Purchase only the add-ons that make sense for your event.
        </p>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Free tier — GLOWING */}
        <div style={{
          borderRadius: '20px', padding: '32px', marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(226,195,107,0.08) 0%, rgba(226,195,107,0.03) 100%)',
          border: '1px solid rgba(226,195,107,0.35)',
          boxShadow: '0 0 0 1px rgba(226,195,107,0.15), 0 0 40px rgba(226,195,107,0.12), 0 8px 32px rgba(0,0,0,0.4)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: '32px', right: '32px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.6), transparent)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '10px', background: 'rgba(226,195,107,0.15)', border: '1px solid rgba(226,195,107,0.3)', fontSize: '10px', fontWeight: 700, color: gold, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                ✦ Start Here
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Go Live Free</h2>
              <p style={{ fontSize: '13px', color: textBody }}>Your tribute wall, live in minutes</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '36px', fontWeight: 800, color: gold, lineHeight: 1 }}>₦0</p>
              <p style={{ fontSize: '12px', color: textFaint }}>forever free</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {[
              'Live tribute wall',
              'Up to 50 tributes',
              'World map — voices from anywhere',
              'Honouree profile canvas',
              'WhatsApp share link',
              '90 days live',
              'No credit card required',
              'Your own capsule link',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: gold, fontSize: '12px', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '13px', color: textBody }}>{f}</span>
              </div>
            ))}
          </div>

          <Link href="/book" style={{ display: 'block', padding: '14px', borderRadius: '12px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '15px', fontWeight: 700, textDecoration: 'none', textAlign: 'center', letterSpacing: '0.04em', boxShadow: '0 4px 24px rgba(226,195,107,0.3)' }}>
            Create Your Capsule — Free →
          </Link>
        </div>

        {/* Add-ons */}
        <div style={{ marginTop: '48px', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p style={{ fontSize: '11px', color: goldMuted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>Add-Ons</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: textPrimary, marginBottom: '10px' }}>Expand your capsule</h2>
            <p style={{ fontSize: '14px', color: textBody }}>Purchase from your dashboard after creating your capsule. Only pay for what you use.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ADDON_KEYS.map(addon => {
              const price = priceMap[addon.key]
              return (
                <div key={addon.key} style={{
                  padding: '16px 18px', borderRadius: '12px',
                  background: addon.comingSoon ? 'rgba(255,255,255,0.02)' : cardBg,
                  border: `1px solid ${addon.comingSoon ? 'rgba(255,255,255,0.05)' : 'rgba(226,195,107,0.1)'}`,
                  display: 'flex', alignItems: 'center', gap: '14px',
                  opacity: addon.comingSoon ? 0.6 : 1,
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{addon.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>{addon.label}</p>
                      {addon.comingSoon && (
                        <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: textFaint, border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coming Soon</span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: textFaint }}>{addon.desc}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {price !== undefined && !addon.comingSoon ? (
                      <p style={{ fontSize: '16px', fontWeight: 700, color: gold }}>{formatNGN(price)}</p>
                    ) : addon.comingSoon ? (
                      <p style={{ fontSize: '12px', color: textFaint }}>—</p>
                    ) : (
                      <p style={{ fontSize: '12px', color: textFaint }}>Contact us</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment note */}
        <div style={{ padding: '20px 24px', borderRadius: '14px', background: goldFaint, border: '1px solid rgba(226,195,107,0.15)', marginBottom: '32px' }}>
          <p style={{ fontSize: '13px', color: textBody, lineHeight: 1.7 }}>
            <strong style={{ color: textPrimary }}>Payments in Nigerian Naira (₦)</strong> — All transactions are processed securely via Paystack. International payment options are coming soon. If you are outside Nigeria and need to pay now, <Link href="mailto:hello@itslegacycapsule.com" style={{ color: gold }}>contact us</Link> and we will arrange an invoice.
          </p>
        </div>

        {/* FAQ strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '40px' }}>
          {[
            { q: 'Can I upgrade later?', a: 'Yes. Add any component from your dashboard at any time — before, during, or after your event.' },
            { q: 'Is the free tier really free?', a: 'Yes. No credit card. No trial period. Your tribute wall is free for 90 days with all core features.' },
            { q: 'What if I need help choosing?', a: 'Email hello@itslegacycapsule.com and we will help you decide what your event actually needs.' },
          ].map(item => (
            <div key={item.q} style={{ padding: '16px', borderRadius: '12px', background: cardBg, border: `1px solid rgba(255,255,255,0.06)` }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '6px' }}>{item.q}</p>
              <p style={{ fontSize: '12px', color: textBody, lineHeight: 1.65 }}>{item.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/book" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: '14px', background: `linear-gradient(135deg, ${gold}, #C9A84E)`, color: '#1a0845', fontSize: '15px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em', boxShadow: '0 8px 32px rgba(226,195,107,0.25)' }}>
            Start Free — No Card Needed →
          </Link>
          <div style={{ marginTop: '16px' }}>
            <Link href="/how-it-works" style={{ fontSize: '13px', color: goldMuted, textDecoration: 'none' }}>See how it works first →</Link>
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', padding: '0 0 32px', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        LEGACYCAPSULE · EVENTS END. LEGACIES DON'T.
      </p>
    </div>
  )
}
