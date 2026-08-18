// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/PhaseQRPrintClient.tsx
// PURPOSE:   Client component for print-ready QR code page.
//            Premium print design — white card, navy and gold.
//            QR code links to /for/[slug]/dday?phase=[phaseId] so guests land
//            on the Event Moments upload page pre-selected to this phase.
//            Includes event day window note so guests know when uploads open.
//            @media print hides browser chrome.
// ARCHITECTURE: LC12 Event Moments Spec
// BUILT BY:  AI16 · Claude Opus 4.6 · 2 August 2026
// UPDATED:   AI21 · Claude Opus 4.6 · 17 August 2026 (AI21v2.12.17)
//            — Split from server page (params bug fix)
//            — QR URL corrected: now points to /for/[slug]/dday?phase=[phaseId]
//            — ddayUrl and phaseId added as props
//            — programmeSummary prop added
//            — Event day window note added to print card
//            — Short URL updated to show dday path
// ─────────────────────────────────────────────────────────────────────────────

'use client'

// ═══ SECTION 1 — Helpers ═══

function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ═══ SECTION 2 — Props ═══

interface Props {
  phaseName:          string
  eventDate:          string | null
  location:           string | null
  programmeSummary:   string | null
  honoureeName:       string
  eventTag:           string | null
  capsuleSlug:        string
  phaseId:            string
  qrUrl:              string
  ddayUrl:            string
}

// ═══ SECTION 3 — Component ═══

export default function PhaseQRPrintClient({
  phaseName, eventDate, location, programmeSummary,
  honoureeName, eventTag, capsuleSlug, phaseId, qrUrl, ddayUrl,
}: Props) {

  // Short display URL — show the dday path so guests know what to expect
  const shortUrl = `itslegacycapsule.com/for/${capsuleSlug}/dday`

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
        style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 100 }}
      >
        <button
          onClick={() => window.print()}
          style={{ padding: '10px 22px', borderRadius: '8px', background: '#1a0845', color: '#E2C36B', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Arial, sans-serif', letterSpacing: '0.04em' }}
        >
          🖨 Print
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: '10px 22px', borderRadius: '8px', background: 'transparent', color: '#6b6b80', fontSize: '13px', border: '1px solid #d0d0e0', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
        >
          Close
        </button>
      </div>

      {/* ── Print card ── */}
      <div
        className="card"
        style={{ width: '100%', maxWidth: '420px', background: '#ffffff', border: '2px solid #1a0845', borderRadius: '18px', padding: '36px 32px', textAlign: 'center', boxShadow: '0 12px 48px rgba(0,0,0,0.12)' }}
      >
        {/* ── Brand ── */}
        <p style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9090a0', marginBottom: '20px', fontFamily: 'Arial, sans-serif' }}>
          <span style={{ color: '#1a0845', fontWeight: 700 }}>LegacyCapsule</span>
          {' · '}Event Moments
        </p>

        {/* ── Honouree ── */}
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a0845', lineHeight: 1.2, marginBottom: eventTag ? '6px' : '20px' }}>
          {honoureeName}
        </p>
        {eventTag && (
          <p style={{ fontSize: '13px', color: '#B8960C', marginBottom: '20px', fontFamily: 'Arial, sans-serif' }}>
            {eventTag}
          </p>
        )}

        {/* ── Gold divider ── */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #D4AE2A, transparent)', margin: '0 0 20px' }} />

        {/* ── Phase name ── */}
        <p style={{ fontSize: '20px', fontWeight: 700, color: '#1a0845', marginBottom: '8px' }}>
          {phaseName}
        </p>

        {/* ── Phase details ── */}
        <div style={{ fontSize: '12px', color: '#60607a', marginBottom: '16px', lineHeight: 1.7, fontFamily: 'Arial, sans-serif' }}>
          {eventDate && <div>📅 {formatDate(eventDate)}</div>}
          {location  && <div>📍 {location}</div>}
        </div>

        {/* ── Event day window note ── */}
        <div style={{ background: '#fdf9f0', border: '1px solid #D4AE2A', borderRadius: '10px', padding: '10px 14px', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', color: '#7a5c00', fontFamily: 'Arial, sans-serif', lineHeight: 1.65, margin: 0 }}>
            📸 Photo uploads open at 6am on event day and close 24 hours later.
            {eventDate && (
              <> Scan on <strong>{new Date(eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> to add your photo.</>
            )}
          </p>
        </div>

        {/* ── Programme summary if provided ── */}
        {programmeSummary && (
          <div style={{ fontSize: '11px', color: '#60607a', fontFamily: 'Arial, sans-serif', lineHeight: 1.65, marginBottom: '20px', fontStyle: 'italic' }}>
            {programmeSummary}
          </div>
        )}

        {/* ── QR code ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: '#f8f6f0', borderRadius: '14px', padding: '20px', border: '1px solid #e8e4d8' }}>
            <img
              src={qrUrl}
              alt={`QR code for ${phaseName} — Event Moments`}
              width={200}
              height={200}
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {/* ── Instruction ── */}
        <p style={{ fontSize: '13px', color: '#1a0845', fontWeight: 700, marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>
          Scan to add your photo
        </p>
        <p style={{ fontSize: '11px', color: '#9090a0', lineHeight: 1.65, marginBottom: '20px', fontFamily: 'Arial, sans-serif' }}>
          Be part of the record. Scan this QR code on event day<br />
          to upload your photo from {phaseName}.
        </p>

        {/* ── Short URL ── */}
        <p style={{ fontSize: '11px', color: '#B8960C', fontFamily: 'Arial, sans-serif', letterSpacing: '0.02em', marginBottom: '24px' }}>
          {shortUrl}
        </p>

        {/* ── Gold bottom rule ── */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #D4AE2A, transparent)', marginBottom: '16px' }} />

        {/* ── Footer ── */}
        <p style={{ fontSize: '8px', color: '#c0c0d0', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>
          VALNEX, UNIPESSOAL LDA · RevoWorldTech
        </p>
      </div>
    </>
  )
}
