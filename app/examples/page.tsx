/* =========================================================
   app/examples/page.tsx — Holding page, no inline logo
========================================================= */
import Link from 'next/link'

export const metadata = { title: 'Examples · LegacyCapsule' }

export default function ExamplesPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 50%, #0f0a1e 100%)',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px 40px', // top padding for nav
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '560px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(226,195,107,0.25)', marginBottom: '32px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#E2C36B', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', color: '#E2C36B', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' }}>Coming Soon</span>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 700, color: '#E2C36B', lineHeight: 1.2, marginBottom: '20px' }}>
          Real events. Real voices. Real legacies.
        </h1>

        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, marginBottom: '16px' }}>
          The most powerful examples are the ones being built right now by real organisers.
        </p>

        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.3), transparent)', margin: '24px 0' }} />

        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: '36px' }}>
          Our first completed capsules — with full tribute walls, profile canvases, and digital publications — will become the showcase here. Come back soon to see events from across the world, preserved permanently on LegacyCapsule.
        </p>

        <Link href="/book" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: '14px', background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', color: '#1a0845', fontSize: '15px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em' }}>
          Start Your Own →
        </Link>

        <div style={{ marginTop: '24px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'rgba(226,195,107,0.5)', textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>

      <p style={{ position: 'absolute', bottom: '24px', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        LEGACYCAPSULE · EVENTS END. LEGACIES DON'T.
      </p>
    </div>
  )
}
