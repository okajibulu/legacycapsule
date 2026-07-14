// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/features/[service]/page.tsx
// PURPOSE: Full detail page for each premium service add-on.
//          Linked from ServicesTab "Full details →" and from homepage features section.
//          Marketing-quality content from serviceDetails.ts.
//          Server component — no client state needed.
// ARCHITECTURE: LC02 Event Services Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { notFound }        from 'next/navigation'
import Link                from 'next/link'
import { getServiceDetail, ALL_SERVICE_IDS } from '@/lib/content/serviceDetails'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Static params
// ─────────────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return ALL_SERVICE_IDS.map(service => ({ service }))
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params
  const detail = getServiceDetail(service)
  if (!detail) return {}
  return {
    title:       `${detail.title} — LegacyCapsule`,
    description: detail.summary,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
  pageBg:       'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)',
  gold:         '#E2C36B',
  goldMuted:    'rgba(226,195,107,0.55)',
  goldFaint:    'rgba(226,195,107,0.10)',
  cardBg:       'rgba(255,255,255,0.04)',
  cardBorder:   'rgba(226,195,107,0.15)',
  textPrimary:  'rgba(255,255,255,0.92)',
  textSecondary:'rgba(255,255,255,0.60)',
  textFaint:    'rgba(255,255,255,0.28)',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Page component
// ─────────────────────────────────────────────────────────────────────────────

export default async function FeatureDetailPage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params
  const detail = getServiceDetail(service)
  if (!detail) return notFound()

  return (
    <div style={{ minHeight: '100vh', background: styles.pageBg, fontFamily: "'DM Sans', system-ui, sans-serif", color: styles.textPrimary }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px 80px' }}>

        {/* ── Back nav ── */}
        <div style={{ padding: '24px 0 0' }}>
          <Link href="/book" style={{ fontSize: '12px', color: styles.goldMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            ← Back
          </Link>
        </div>

        {/* ── Header ── */}
        <div style={{ padding: '32px 0 0', borderBottom: `1px solid rgba(226,195,107,0.12)`, marginBottom: '40px', paddingBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: styles.goldFaint, border: `1px solid rgba(226,195,107,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              {detail.icon}
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: styles.goldMuted, margin: '0 0 4px' }}>
                Premium Add-on
              </p>
              <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: styles.textPrimary, margin: 0, lineHeight: 1.2 }}>
                {detail.title}
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '16px', color: styles.gold, fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.5 }}>
            {detail.tagline}
          </p>
          <p style={{ fontSize: '14px', color: styles.textSecondary, lineHeight: 1.8, margin: 0 }}>
            {detail.summary}
          </p>
        </div>

        {/* ── What you get ── */}
        <Section title="What you get">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detail.whatYouGet.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: styles.gold, fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>✦</span>
                <span style={{ fontSize: '14px', color: styles.textSecondary, lineHeight: 1.7 }}>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── Contributor experience ── */}
        <Section title="What your contributors experience">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detail.contributorExperience.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: styles.goldMuted, fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>◇</span>
                <span style={{ fontSize: '14px', color: styles.textSecondary, lineHeight: 1.7 }}>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── Example use case ── */}
        <Section title="How it works in practice">
          <div style={{ padding: '20px', borderRadius: '12px', background: styles.goldFaint, border: `1px solid rgba(226,195,107,0.12)` }}>
            <p style={{ fontSize: '14px', color: styles.textSecondary, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
              {detail.exampleUseCase}
            </p>
          </div>
        </Section>

        {/* ── Best for ── */}
        <Section title="Best suited for">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {detail.bestFor.map((event, i) => (
              <span key={i} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', border: `1px solid rgba(226,195,107,0.2)`, color: styles.goldMuted, background: styles.goldFaint }}>
                {event}
              </span>
            ))}
          </div>
        </Section>

        {/* ── FAQs ── */}
        <Section title="Frequently asked questions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {detail.faqs.map((faq, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: '12px', background: styles.cardBg, border: `1px solid rgba(255,255,255,0.05)` }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: styles.textPrimary, margin: '0 0 8px' }}>
                  {faq.q}
                </p>
                <p style={{ fontSize: '13px', color: styles.textSecondary, lineHeight: 1.7, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Refund note ── */}
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(248,191,113,0.2)', background: 'rgba(248,191,113,0.04)', marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(248,191,113,0.7)', margin: 0, lineHeight: 1.6 }}>
            ⚠ {detail.refundNote}
          </p>
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign: 'center', padding: '32px 0', borderTop: `1px solid rgba(226,195,107,0.12)` }}>
          <p style={{ fontSize: '13px', color: styles.textFaint, marginBottom: '20px', lineHeight: 1.6 }}>
            Ready to add {detail.title} to your capsule?<br />
            Activate it directly from your manage dashboard under Services.
          </p>
          <Link
            href="/"
            style={{ display: 'inline-block', padding: '13px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #E2C36B, #C8A84A)', color: '#1a0845', fontSize: '14px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em' }}
          >
            ← Back to LegacyCapsule
          </Link>
        </div>

        {/* ── Footer ── */}
        <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '40px' }}>
          LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA · REVOWORLDTECH
        </p>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Sub-component
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(226,195,107,0.55)', margin: '0 0 16px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
