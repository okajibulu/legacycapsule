// ============================================================
// FILE PATH: components/manage/PhaseQRPrintClient.tsx
// PURPOSE:   Client component for print-ready QR code page.
//            Handles print and close button interactions.
//            Premium print design — white card, navy and gold.
//            @media print hides browser chrome.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6
// VERSION:   v2.11.21
// DATE:      2 August 2026
// ============================================================

'use client'

function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

interface Props {
  phaseName:    string
  eventDate:    string | null
  location:     string | null
  honoureeName: string
  eventTag:     string | null
  capsuleSlug:  string
  qrUrl:        string
}

export default function PhaseQRPrintClient({
  phaseName, eventDate, location, honoureeName, eventTag, capsuleSlug, qrUrl,
}: Props) {
  const shortUrl = `itslegacycapsule.com/for/${capsuleSlug}`

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Georgia, 'Playfair Display', serif;
          background: #f0ece4;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .no-print { display: flex; }
        @media print {
          body { background: #ffffff; padding: 0; }
          .no-print { display: none !important; }
          .card { box-shadow: none !important; border: 1.5pt solid #1a0845 !important; }
        }
      `}</style>

      {/* ── Print / Close buttons ── */}
      <div
        className="no-print"
        style={{
          position:   'fixed',
          top:        '20px',
          right:      '20px',
          display:    'flex',
          gap:        '10px',
          zIndex:     100,
        }}>
        <button
          onClick={() => window.print()}
          style={{
            padding:     '10px 22px',
            borderRadius: '8px',
            background:  '#1a0845',
            color:       '#E2C36B',
            fontSize:    '13px',
            fontWeight:  700,
            border:      'none',
            cursor:      'pointer',
            fontFamily:  'Arial, sans-serif',
            letterSpacing: '0.04em',
          }}>
          🖨 Print
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding:     '10px 22px',
            borderRadius: '8px',
            background:  'transparent',
            color:       '#6b6b80',
            fontSize:    '13px',
            border:      '1px solid #d0d0e0',
            cursor:      'pointer',
            fontFamily:  'Arial, sans-serif',
          }}>
          Close
        </button>
      </div>

      {/* ── Print card ── */}
      <div
        className="card"
        style={{
          width:        '100%',
          maxWidth:     '420px',
          background:   '#ffffff',
          border:       '2px solid #1a0845',
          borderRadius: '18px',
          padding:      '36px 32px',
          textAlign:    'center',
          boxShadow:    '0 12px 48px rgba(0,0,0,0.12)',
        }}>

        {/* Brand */}
        <p style={{
          fontSize:      '9px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color:         '#9090a0',
          marginBottom:  '20px',
          fontFamily:    'Arial, sans-serif',
        }}>
          <span style={{ color: '#1a0845', fontWeight: 700 }}>LegacyCapsule</span>
          {' · '}Event Moments
        </p>

        {/* Honouree */}
        <p style={{
          fontSize:     '22px',
          fontWeight:   700,
          color:        '#1a0845',
          lineHeight:   1.2,
          marginBottom: eventTag ? '6px' : '20px',
        }}>
          {honoureeName}
        </p>
        {eventTag && (
          <p style={{
            fontSize:     '13px',
            color:        '#B8960C',
            marginBottom: '20px',
            fontFamily:   'Arial, sans-serif',
          }}>
            {eventTag}
          </p>
        )}

        {/* Gold divider */}
        <div style={{
          height:       '1px',
          background:   'linear-gradient(to right, transparent, #D4AE2A, transparent)',
          margin:       '0 0 20px',
        }} />

        {/* Phase name */}
        <p style={{
          fontSize:     '20px',
          fontWeight:   700,
          color:        '#1a0845',
          marginBottom: '8px',
        }}>
          {phaseName}
        </p>

        {/* Phase meta */}
        <div style={{
          fontSize:     '12px',
          color:        '#60607a',
          marginBottom: '28px',
          lineHeight:   1.7,
          fontFamily:   'Arial, sans-serif',
        }}>
          {eventDate && <div>📅 {formatDate(eventDate)}</div>}
          {location  && <div>📍 {location}</div>}
        </div>

        {/* QR code */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            background:   '#f8f6f0',
            borderRadius: '14px',
            padding:      '20px',
            border:       '1px solid #e8e4d8',
          }}>
            <img
              src={qrUrl}
              alt={`QR code for ${phaseName}`}
              width={200}
              height={200}
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {/* Instruction */}
        <p style={{
          fontSize:     '13px',
          color:        '#1a0845',
          fontWeight:   700,
          marginBottom: '8px',
          fontFamily:   'Arial, sans-serif',
        }}>
          Scan to add your photo
        </p>
        <p style={{
          fontSize:     '11px',
          color:        '#9090a0',
          lineHeight:   1.65,
          marginBottom: '20px',
          fontFamily:   'Arial, sans-serif',
        }}>
          Be part of the record. Scan this QR code<br />
          to upload your photo from {phaseName}.
        </p>

        {/* Short URL */}
        <p style={{
          fontSize:      '11px',
          color:         '#B8960C',
          fontFamily:    'Arial, sans-serif',
          letterSpacing: '0.02em',
          marginBottom:  '24px',
        }}>
          {shortUrl}
        </p>

        {/* Gold bottom rule */}
        <div style={{
          height:     '1px',
          background: 'linear-gradient(to right, transparent, #D4AE2A, transparent)',
          marginBottom: '16px',
        }} />

        {/* Footer */}
        <p style={{
          fontSize:      '8px',
          color:         '#c0c0d0',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily:    'Arial, sans-serif',
        }}>
          VALNEX, UNIPESSOAL LDA · RevoWorldTech
        </p>
      </div>
    </>
  )
}