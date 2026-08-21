// ============================================================
// FILE PATH: components/manage/display/DisplayExportPanel.tsx
// PURPOSE:   Offline HTML export panel. Shows content counts,
//            theme selector with preview swatches, audio track
//            manager, export button, post-download instructions.
// ARCHITECTURE: EDS — Manage Dashboard
// BUILT BY:  AI24 · Claude Sonnet 4.6
// VERSION:   v2.12.28
// DATE:      21 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useState, useEffect } from 'react'
import AudioTrackPanel from './AudioTrackPanel'

// ═══ SECTION 2 — Theme Definitions ═══

const THEMES = [
  { key: 'midnight', name: 'Midnight',  bg: '#0D0820', accent: '#D4AE2A', desc: 'Classic LegacyCapsule' },
  { key: 'obsidian', name: 'Obsidian',  bg: '#080808', accent: '#D4AE2A', desc: 'Pure black, formal' },
  { key: 'forest',   name: 'Forest',    bg: '#071A0E', accent: '#C8B560', desc: 'Natural, warm' },
  { key: 'navy',     name: 'Navy',      bg: '#070F1A', accent: '#D4AE2A', desc: 'Corporate, retirement' },
  { key: 'burgundy', name: 'Burgundy',  bg: '#180810', accent: '#C4956A', desc: 'Celebration, birthday' },
  { key: 'slate',    name: 'Slate',     bg: '#141428', accent: '#B0B8C8', desc: 'Modern, graduation' },
]

// ═══ SECTION 3 — Types ═══

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

// ═══ SECTION 4 — Component ═══

export default function DisplayExportPanel({
  capsuleSlug,
  capsuleId,
  honoureeName,
  eventType,
}: DisplayExportPanelProps) {
  const [counts, setCounts] = useState<ContentCounts | null>(null)
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState('midnight')
  const [savingTheme, setSavingTheme] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exported, setExported] = useState(false)

  // ── 4a. Load counts and saved theme ──
  useEffect(() => {
    async function load() {
      try {
        const [countsRes, configRes] = await Promise.all([
          fetch(`/api/display/export/counts?slug=${capsuleSlug}`),
          fetch(`/api/display/config?slug=${capsuleSlug}`),
        ])
        if (countsRes.ok) {
          const data = await countsRes.json()
          setCounts(data.counts)
        }
        if (configRes.ok) {
          const data = await configRes.json()
          if (data.config?.theme_override) setSelectedTheme(data.config.theme_override)
        }
      } catch { /* silent */ }
      setLoadingCounts(false)
    }
    load()
  }, [capsuleSlug])

  // ── 4b. Save theme selection ──
  async function handleThemeSelect(key: string) {
    setSelectedTheme(key)
    setSavingTheme(true)
    await fetch(`/api/display/config?slug=${capsuleSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme_override: key }),
    })
    setSavingTheme(false)
  }

  // ── 4c. Export ──
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

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeName = honoureeName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      a.href = url
      a.download = 'LegacyCapsule-' + safeName + '-display.html'
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

  const hasContent = counts && (counts.voices + counts.stories + counts.photos) > 0

  // ═══ SECTION 5 — Render ═══

  return (
    <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Content counts ── */}
      <div>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>
          Content ready for display
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {loadingCounts ? (
            <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Loading…</p>
          ) : counts ? (
            <>
              <CountBadge label="Voices" count={counts.voices} />
              <CountBadge label="Stories" count={counts.stories} />
              <CountBadge label="Photos" count={counts.photos} />
            </>
          ) : null}
        </div>
      </div>

      {/* ── Theme selector ── */}
      <div>
        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>
          Display Theme {savingTheme && <span style={{ fontWeight: 400, opacity: 0.6 }}>— saving…</span>}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {THEMES.map((theme) => (
            <button
              key={theme.key}
              onClick={() => handleThemeSelect(theme.key)}
              style={{
                background: theme.bg,
                border: selectedTheme === theme.key
                  ? '2px solid ' + theme.accent
                  : '2px solid transparent',
                borderRadius: '8px',
                padding: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxShadow: selectedTheme === theme.key
                  ? '0 0 0 3px ' + theme.accent + '33'
                  : 'none',
              }}
            >
              {/* Preview swatch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.accent, flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.accent, letterSpacing: '0.05em' }}>
                  {theme.name}
                </span>
                {selectedTheme === theme.key && (
                  <span style={{ marginLeft: 'auto', color: theme.accent, fontSize: '0.75rem' }}>✓</span>
                )}
              </div>
              {/* Sample text preview */}
              <div style={{ borderRadius: '4px', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '0.65rem', color: '#F5F3EE', margin: 0, opacity: 0.8, fontFamily: 'Georgia, serif' }}>
                  {honoureeName.split(' ')[0]}
                </p>
                <p style={{ fontSize: '0.55rem', color: theme.accent, margin: '0.1rem 0 0', opacity: 0.7, fontFamily: 'sans-serif' }}>
                  {theme.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Audio tracks ── */}
      <AudioTrackPanel capsuleSlug={capsuleSlug} capsuleId={capsuleId} />

      {/* ── Empty state warning ── */}
      {!loadingCounts && counts && !hasContent && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0 }}>
            No approved content yet. Export is available once contributions have been approved.
          </p>
        </div>
      )}

      {/* ── Export button ── */}
      <div>
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
          {exporting ? '⟳ Generating display file…' : '⬇ Export Offline Display'}
        </button>

        {exportError && (
          <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: '0.75rem 0 0' }}>
            {exportError}
          </p>
        )}

        {exported && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '1rem 1.25rem', marginTop: '1rem' }}>
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
              Re-export any time to pick up new approved content or theme changes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ SECTION 6 — Count Badge ═══

function CountBadge({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      background: count > 0 ? 'rgba(13,8,32,0.05)' : '#f9fafb',
      border: '1px solid ' + (count > 0 ? 'rgba(212,174,42,0.3)' : '#e5e7eb'),
      borderRadius: '8px',
      padding: '0.75rem 1.25rem',
      textAlign: 'center',
      minWidth: '90px',
    }}>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: count > 0 ? '#0D0820' : '#9ca3af', margin: 0, fontFamily: 'Georgia, serif' }}>
        {count}
      </p>
      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', margin: '0.1rem 0 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
    </div>
  )
}
