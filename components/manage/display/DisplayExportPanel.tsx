// ============================================================
// FILE PATH: components/manage/display/DisplayExportPanel.tsx
// PURPOSE:   Organiser triggers the Offline HTML export.
//            Shows live content counts (voices, stories, photos).
//            On export: calls /api/display/export/html, downloads
//            the returned HTML file directly in the browser.
//            Gives clear post-download instructions.
// ARCHITECTURE: EDS — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect } from 'react'

// ═══ SECTION 2 — Types ═══

interface ContentCounts {
  voices: number
  stories: number
  photos: number
}

interface DisplayExportPanelProps {
  capsuleSlug: string
  capsuleId: string
  honoureeName: string
  eventType: string
}

// ═══ SECTION 3 — Component ═══

export default function DisplayExportPanel({
  capsuleSlug,
  capsuleId,
  honoureeName,
  eventType,
}: DisplayExportPanelProps) {
  const [counts, setCounts] = useState<ContentCounts | null>(null)
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exported, setExported] = useState(false)

  // ── 3a. Load content counts on mount ──
  useEffect(() => {
    async function loadCounts() {
      try {
        const res = await fetch(`/api/display/config?slug=${capsuleSlug}`)
        // Config endpoint is just for auth check — counts come from a separate call
        // Fetch counts directly
        const countsRes = await fetch(
          `/api/display/export/counts?slug=${capsuleSlug}`
        )
        if (countsRes.ok) {
          const data = await countsRes.json()
          setCounts(data.counts)
        }
      } catch {
        // silent — counts are informational only
      }
      setLoadingCounts(false)
    }
    loadCounts()
  }, [capsuleSlug])

  // ── 3b. Trigger export ──
  async function handleExport() {
    setExporting(true)
    setExportError(null)
    setExported(false)

    try {
      const res = await fetch(`/api/display/export/html?slug=${capsuleSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule_id: capsuleId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Export failed. Please try again.')
      }

      // Download the HTML file
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeName = honoureeName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      a.href = url
      a.download = `LegacyCapsule-${safeName}-display.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExported(true)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.')
    }

    setExporting(false)
  }

  // ═══ SECTION 4 — Render ═══

  const hasContent = counts && (counts.voices + counts.stories + counts.photos) > 0

  return (
    <div style={{ maxWidth: '560px' }}>

      {/* ── Content summary ── */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}>
        {loadingCounts ? (
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>
            Loading content counts…
          </p>
        ) : counts ? (
          <>
            <CountBadge label="Voices" count={counts.voices} />
            <CountBadge label="Stories" count={counts.stories} />
            <CountBadge label="Photos" count={counts.photos} />
          </>
        ) : null}
      </div>

      {/* ── Empty state ── */}
      {!loadingCounts && counts && !hasContent && (
        <div style={{
          background: '#fef9c3',
          border: '1px solid #fde047',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0 }}>
            No approved content yet. Export is available once contributions have been approved.
          </p>
        </div>
      )}

      {/* ── Export button ── */}
      <button
        onClick={handleExport}
        disabled={exporting || (!hasContent && !loadingCounts)}
        style={{
          background: hasContent ? '#0D0820' : '#e5e7eb',
          color: hasContent ? '#D4AE2A' : '#9ca3af',
          border: 'none',
          padding: '0.85rem 2rem',
          fontSize: '0.95rem',
          fontFamily: 'inherit',
          cursor: exporting || !hasContent ? 'not-allowed' : 'pointer',
          borderRadius: '6px',
          fontWeight: 700,
          letterSpacing: '0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: exporting ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {exporting ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
            Generating display file…
          </>
        ) : (
          <>⬇ Export Offline Display</>
        )}
      </button>

      {/* ── Error ── */}
      {exportError && (
        <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: '0.75rem 0 0' }}>
          {exportError}
        </p>
      )}

      {/* ── Success + instructions ── */}
      {exported && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginTop: '1rem',
        }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', margin: '0 0 0.5rem' }}>
            ✓ Display file downloaded
          </p>
          <ol style={{ fontSize: '0.825rem', color: '#166534', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>Open the downloaded <strong>.html</strong> file in Chrome</li>
            <li>Press <kbd style={{ background: '#dcfce7', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>F11</kbd> for fullscreen</li>
            <li>Click <strong>Start Display</strong> when ready</li>
            <li>Use <kbd style={{ background: '#dcfce7', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>Ctrl+Shift+O</kbd> for operator controls</li>
          </ol>
          <p style={{ fontSize: '0.775rem', color: '#16a34a', margin: '0.75rem 0 0', opacity: 0.8 }}>
            Re-export any time to pick up new approved content.
          </p>
        </div>
      )}
    </div>
  )
}

// ═══ SECTION 5 — Count Badge ═══

function CountBadge({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      background: count > 0 ? 'rgba(13,8,32,0.05)' : '#f9fafb',
      border: `1px solid ${count > 0 ? 'rgba(212,174,42,0.3)' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '0.75rem 1.25rem',
      textAlign: 'center',
      minWidth: '90px',
    }}>
      <p style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: count > 0 ? '#0D0820' : '#9ca3af',
        margin: 0,
        fontFamily: 'Georgia, serif',
      }}>
        {count}
      </p>
      <p style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#9ca3af',
        margin: '0.1rem 0 0',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </p>
    </div>
  )
}
