import Link from 'next/link'

export default function GiftPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f0a1e 0%, #1a0845 45%, #120630 100%)',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em',
            background: 'linear-gradient(135deg, #E2C36B, #C9A84E)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>LEGACY</span>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', marginLeft: '0.1em' }}>CAPSULE</span>
        </Link>
        <Link href="/book" style={{
          fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em',
          padding: '8px 18px', borderRadius: '20px', textDecoration: 'none',
          background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', color: '#1a0845',
        }}>Start Free</Link>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 14px', borderRadius: '20px', marginBottom: '20px',
            border: '1px solid rgba(226,195,107,0.25)',
            background: 'rgba(226,195,107,0.06)',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E2C36B', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', color: 'rgba(226,195,107,0.7)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
              Coming Soon
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 800,
            color: '#E2C36B', lineHeight: 1.2, marginBottom: '14px',
            textShadow: '0 0 40px rgba(226,195,107,0.2)',
          }}>
            The gift that outlasts the occasion.
          </h1>

          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: '20px', fontWeight: 500 }}>
            Give someone the experience of having their moment preserved — as a gift for an event you are attending
            or a milestone you want to mark.
          </p>

          <div style={{
            height: '1px', margin: '24px auto', maxWidth: '200px',
            background: 'linear-gradient(to right, transparent, rgba(226,195,107,0.4), transparent)',
          }} />

          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: '36px' }}>
            A LegacyCapsule gift means a tribute wall goes live in the recipient&apos;s name, gathering voices from
            everyone who matters — wherever they are in the world. The gift that keeps building, long after the
            day itself. Full gift flow launching shortly.
          </p>

          <a href="mailto:hello@itslegacycapsule.com" style={{
            display: 'inline-block', padding: '14px 32px', borderRadius: '12px',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #E2C36B, #C9A84E)', color: '#1a0845',
            fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: '0 4px 24px rgba(226,195,107,0.25)',
          }}>
            Contact Us to Gift →
          </a>

          <div style={{ marginTop: '24px' }}>
            <Link href="/" style={{ fontSize: '12px', color: 'rgba(226,195,107,0.45)', textDecoration: 'none', letterSpacing: '0.06em' }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          LEGACYCAPSULE · EVENTS END. LEGACIES DON&apos;T.
        </p>
      </div>
    </div>
  )
}
