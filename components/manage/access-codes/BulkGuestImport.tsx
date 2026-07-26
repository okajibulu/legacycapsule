'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/manage/access-codes/BulkGuestImport.tsx
// PURPOSE: Bulk guest entry for the Access Code System.
//          Organiser pastes a list of names/emails or uploads a CSV.
//          Parses entries, detects duplicates against existing guests,
//          allows tier and section assignment before import,
//          then batch-POSTs to /api/guests.
//          Self-contained — does not require Guest Management to be active.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// PHASE: 5 — Bulk Guest Entry
// BUILT BY: AI14 · Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Imports & types ═══

import { useState, useRef, useCallback } from 'react'

interface Props {
  capsuleId:  string
  onImported: (count: number) => void   // called after successful import
}

interface ParsedEntry {
  name:      string
  email:     string | null
  phone:     string | null
  raw:       string          // original line for error display
  duplicate: boolean         // true if email already exists in guests table
  error:     string | null   // parse-level error
}

interface ImportConfig {
  tier:     string
  section:  string           // section name for display (not FK — section assignment happens post-generate)
}

type ImportStep = 'input' | 'preview' | 'importing' | 'done'

// ═══ SECTION 2 — Design tokens ═══

const gold         = '#E2C36B'
const goldMuted    = 'rgba(226,195,107,0.55)'
const goldFaint    = 'rgba(226,195,107,0.12)'
const cardBg       = 'rgba(255,255,255,0.04)'
const cardBorder   = 'rgba(226,195,107,0.12)'
const textPrimary  = 'rgba(255,255,255,0.92)'
const textFaint    = 'rgba(255,255,255,0.28)'
const successColor = 'rgba(134,239,172,0.8)'
const errorColor   = 'rgba(248,113,113,0.8)'
const warnColor    = 'rgba(251,191,36,0.8)'

const inputStyle: React.CSSProperties = {
  fontSize: '13px', padding: '10px 12px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box' as const,
  width: '100%',
}

// ═══ SECTION 3 — Constants ═══

const GUEST_TIERS = [
  'General', 'VIP', 'VVIP', 'Reception Only', 'Staff', 'Media', 'Vendor',
]

// Tip shown above the paste area
const PASTE_TIP =
  'One guest per line. Accepted formats:\n'
  + '  Name, Email\n'
  + '  Name <email@example.com>\n'
  + '  Name only (no email)\n\n'
  + 'Or upload a CSV file with Name and Email columns.'

// ═══ SECTION 4 — Parser helpers ═══

/**
 * parseLine
 * Tries multiple common formats for a single paste line.
 * Returns { name, email, phone, error }.
 *
 * Supported:
 *   "John Adeyemi, john@email.com"
 *   "John Adeyemi <john@email.com>"
 *   "john@email.com, John Adeyemi"   (email first)
 *   "John Adeyemi"                   (name only)
 *   "John Adeyemi, 08012345678"      (name + phone, no email)
 */
function parseLine(line: string): { name: string; email: string | null; phone: string | null; error: string | null } {
  const trimmed = line.trim()
  if (!trimmed) return { name: '', email: null, phone: null, error: 'Empty line' }

  // Format: "Name <email>"
  const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>\s*$/)
  if (angleMatch) {
    return {
      name:  angleMatch[1].trim(),
      email: angleMatch[2].trim().toLowerCase(),
      phone: null,
      error: null,
    }
  }

  // Format: comma or tab separated
  const sep = trimmed.includes('\t') ? '\t' : ','
  const parts = trimmed.split(sep).map(p => p.trim())

  if (parts.length >= 2) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[+\d\s\-().]{7,15}$/

    // Detect which part is email, phone, or name
    let name  = ''
    let email: string | null = null
    let phone: string | null = null

    for (const part of parts) {
      if (!email && emailRegex.test(part)) { email = part.toLowerCase(); continue }
      if (!phone && phoneRegex.test(part) && /\d{6,}/.test(part)) { phone = part; continue }
      if (!name) name = part
    }

    if (!name) name = parts[0]

    return { name, email, phone, error: null }
  }

  // Single value — treat as name only
  return { name: trimmed, email: null, phone: null, error: null }
}

/**
 * parseCSV
 * Minimal CSV parser. Handles quoted fields and common column headers.
 * Returns array of { name, email, phone } objects.
 */
function parseCSV(text: string): { name: string; email: string | null; phone: string | null }[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Parse header row to find column indices
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const nameIdx  = headers.findIndex(h => ['name', 'full name', 'guest name', 'guest'].includes(h))
  const emailIdx = headers.findIndex(h => ['email', 'email address', 'e-mail'].includes(h))
  const phoneIdx = headers.findIndex(h => ['phone', 'mobile', 'telephone', 'tel'].includes(h))

  if (nameIdx === -1) return []   // no name column found — can't parse

  return lines.slice(1).map(line => {
    // Handle quoted fields
    const cols = line.match(/(".*?"|[^,]+)/g)?.map(c =>
      c.trim().replace(/^"|"$/g, '')
    ) ?? []

    return {
      name:  cols[nameIdx]?.trim()  ?? '',
      email: emailIdx !== -1 ? (cols[emailIdx]?.trim().toLowerCase() || null) : null,
      phone: phoneIdx !== -1 ? (cols[phoneIdx]?.trim() || null) : null,
    }
  }).filter(r => r.name)
}

// ═══ SECTION 5 — Component ═══

export default function BulkGuestImport({ capsuleId, onImported }: Props) {

  // ── 5.1 State ──────────────────────────────────────────────────────────────

  const [step,          setStep]          = useState<ImportStep>('input')
  const [pasteText,     setPasteText]     = useState('')
  const [entries,       setEntries]       = useState<ParsedEntry[]>([])
  const [config,        setConfig]        = useState<ImportConfig>({
    tier:    'General',
    section: '',
  })
  const [importing,     setImporting]     = useState(false)
  const [progress,      setProgress]      = useState({ done: 0, total: 0 })
  const [resultMsg,     setResultMsg]     = useState('')
  const [parseError,    setParseError]    = useState('')
  const [tipOpen,       setTipOpen]       = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  // ── 5.2 Parse pasted text into entries ────────────────────────────────────

  const parseAndPreview = useCallback(async () => {
    setParseError('')
    const lines = pasteText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)

    if (lines.length === 0) {
      setParseError('Nothing to import — paste at least one name or email.')
      return
    }

    if (lines.length > 500) {
      setParseError('Maximum 500 guests per import. Split into multiple batches.')
      return
    }

    // Parse each line
    const parsed: Omit<ParsedEntry, 'duplicate'>[] = lines.map(line => {
      const result = parseLine(line)
      return {
        name:  result.name,
        email: result.email,
        phone: result.phone,
        raw:   line,
        error: result.error,
      }
    })

    // Check for duplicates: fetch existing guest emails for this capsule
    const validEmails = parsed
      .filter(e => e.email)
      .map(e => e.email as string)

    let existingEmails = new Set<string>()

    if (validEmails.length > 0) {
      try {
        const res  = await fetch(`/api/guests?capsule_id=${capsuleId}`)
        const data = await res.json()
        existingEmails = new Set(
          (data.guests ?? [])
            .map((g: any) => g.email?.toLowerCase())
            .filter(Boolean)
        )
      } catch {
        // Non-blocking — skip duplicate check if fetch fails
      }
    }

    const withDuplicates: ParsedEntry[] = parsed.map(e => ({
      ...e,
      duplicate: e.email ? existingEmails.has(e.email) : false,
    }))

    setEntries(withDuplicates)
    setStep('preview')
  }, [pasteText, capsuleId])

  // ── 5.3 Handle CSV file upload ─────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)

      if (rows.length === 0) {
        setParseError(
          'Could not read CSV. Make sure it has a "Name" column header. '
          + 'Paste manually if the file format is unusual.'
        )
        return
      }

      // Convert parsed CSV rows to paste-format lines for unified handling
      const lines = rows.map(r =>
        r.email ? `${r.name}, ${r.email}` : r.name
      ).join('\n')

      setPasteText(lines)
      setParseError('')
    }
    reader.readAsText(file)
    // Reset file input so same file can be re-uploaded if needed
    e.target.value = ''
  }

  // ── 5.4 Remove an entry from preview ──────────────────────────────────────

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  // ── 5.5 Run batch import ───────────────────────────────────────────────────

  const runImport = async () => {
    const toImport = entries.filter(e => !e.duplicate && !e.error && e.name)

    if (toImport.length === 0) {
      setParseError('No valid entries to import after removing duplicates and errors.')
      return
    }

    setImporting(true)
    setStep('importing')
    setProgress({ done: 0, total: toImport.length })

    let succeeded = 0
    let failed    = 0

    for (let i = 0; i < toImport.length; i++) {
      const entry = toImport[i]
      try {
        const res = await fetch('/api/guests', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            capsule_id: capsuleId,
            name:       entry.name,
            email:      entry.email   ?? undefined,
            phone:      entry.phone   ?? undefined,
            tier:       config.tier,
            rsvp_status: 'pending',
          }),
        })

        if (res.ok) { succeeded++ }
        else        { failed++;    console.warn(`[BulkImport] Failed: ${entry.name}`) }

      } catch {
        failed++
      }

      setProgress({ done: i + 1, total: toImport.length })
    }

    setImporting(false)
    setResultMsg(
      `${succeeded} guest${succeeded !== 1 ? 's' : ''} imported successfully.`
      + (failed > 0 ? ` ${failed} failed — check console for details.` : '')
    )
    setStep('done')
    if (succeeded > 0) onImported(succeeded)
  }

  // ── 5.6 Reset to start ────────────────────────────────────────────────────

  const reset = () => {
    setStep('input')
    setPasteText('')
    setEntries([])
    setResultMsg('')
    setParseError('')
    setProgress({ done: 0, total: 0 })
  }

  // Valid entries in preview (for import count)
  const validCount      = entries.filter(e => !e.duplicate && !e.error && e.name).length
  const duplicateCount  = entries.filter(e => e.duplicate).length
  const errorCount      = entries.filter(e => e.error && !e.duplicate).length

  // ═══ SECTION 6 — Render ═══

  return (
    <div>

      {/* ── 6.1 INPUT STEP ────────────────────────────────────────────────── */}

      {step === 'input' && (
        <div>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '8px',
          }}>
            <p style={{
              fontSize: '10px', color: goldMuted,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              fontWeight: 600, margin: 0,
            }}>
              Bulk Import
            </p>
            <button
              onClick={() => setTipOpen(o => !o)}
              style={{
                fontSize: '10px', color: textFaint,
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
              }}
            >
              {tipOpen ? 'Hide help' : 'Accepted formats ⓘ'}
            </button>
          </div>

          {/* Format tip */}
          {tipOpen && (
            <pre style={{
              fontSize: '11px', color: 'rgba(226,195,107,0.55)',
              background: 'rgba(226,195,107,0.03)',
              border: '1px solid rgba(226,195,107,0.08)',
              borderRadius: '8px', padding: '10px 12px',
              margin: '0 0 10px', whiteSpace: 'pre-wrap' as const,
              fontFamily: 'monospace', lineHeight: 1.7,
            }}>
              {PASTE_TIP}
            </pre>
          )}

          {/* Paste area */}
          <textarea
            placeholder={
              'Paste guest list here…\n\nExamples:\n'
              + 'Chief Emeka Obi, emeka@email.com\n'
              + 'Dr. Aisha Bello <aisha@email.com>\n'
              + 'Mr. James Olawale'
            }
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={10}
            style={{
              ...inputStyle,
              resize: 'vertical' as const,
              lineHeight: 1.65,
              marginBottom: '10px',
            }}
          />

          {/* Parse error */}
          {parseError && (
            <p style={{
              fontSize: '11px', color: errorColor,
              margin: '0 0 10px', lineHeight: 1.5,
            }}>
              {parseError}
            </p>
          )}

          {/* Actions row */}
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            {/* CSV upload */}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '9px 14px', borderRadius: '9px',
                border: `1px solid ${cardBorder}`,
                background: 'transparent',
                color: goldMuted, fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap' as const,
              }}
            >
              Upload CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Preview button */}
            <button
              onClick={parseAndPreview}
              disabled={!pasteText.trim()}
              style={{
                flex: 1, padding: '10px',
                borderRadius: '10px', border: 'none',
                background: !pasteText.trim()
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
                color: !pasteText.trim() ? textFaint : '#1a0845',
                fontSize: '12px', fontWeight: 700,
                cursor: !pasteText.trim() ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              Preview Import →
            </button>
          </div>
        </div>
      )}

      {/* ── 6.2 PREVIEW STEP ──────────────────────────────────────────────── */}

      {step === 'preview' && (
        <div>
          {/* Summary bar */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '12px',
            flexWrap: 'wrap' as const,
          }}>
            {[
              { label: 'To import', value: validCount,     accent: true },
              { label: 'Duplicates', value: duplicateCount, accent: false },
              { label: 'Errors',     value: errorCount,     accent: false },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, minWidth: '60px',
                padding: '8px 6px', borderRadius: '8px',
                background: s.accent && s.value > 0
                  ? 'rgba(226,195,107,0.07)' : cardBg,
                border: `1px solid ${s.accent && s.value > 0
                  ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.05)'}`,
                textAlign: 'center' as const,
              }}>
                <div style={{
                  fontSize: '18px', fontWeight: 800,
                  color: s.accent && s.value > 0 ? gold : textPrimary,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: '8px', color: textFaint,
                  textTransform: 'uppercase' as const, letterSpacing: '0.1em',
                  marginTop: '2px',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tier and section config */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '10px', marginBottom: '14px',
          }}>
            <div>
              <label style={{
                fontSize: '10px', color: textFaint,
                display: 'block', marginBottom: '4px',
                textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              }}>
                Assign Tier
              </label>
              <select
                value={config.tier}
                onChange={e => setConfig(p => ({ ...p, tier: e.target.value }))}
                style={inputStyle}
              >
                {GUEST_TIERS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{
                fontSize: '10px', color: textFaint,
                display: 'block', marginBottom: '4px',
                textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              }}>
                Note / Group Label
              </label>
              <input
                type="text"
                placeholder="e.g. Alumni, Church"
                value={config.section}
                onChange={e => setConfig(p => ({ ...p, section: e.target.value }))}
                style={inputStyle}
                maxLength={40}
              />
            </div>
          </div>

          {/* Tier tip */}
          <p style={{
            fontSize: '10px', color: 'rgba(226,195,107,0.4)',
            margin: '0 0 12px', lineHeight: 1.6,
          }}>
            All guests in this batch will be assigned the tier above.
            You can edit individual guests after import.
          </p>

          {/* Entry list */}
          <div style={{
            display: 'flex', flexDirection: 'column' as const,
            gap: '4px', marginBottom: '14px',
            maxHeight: '280px', overflowY: 'auto' as const,
          }}>
            {entries.map((entry, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: '8px',
                border: `1px solid ${
                  entry.duplicate ? 'rgba(251,191,36,0.2)'
                  : entry.error   ? 'rgba(248,113,113,0.15)'
                  : cardBorder
                }`,
                background: cardBg,
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: entry.duplicate || entry.error ? 0.55 : 1,
              }}>
                {/* Status dot */}
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: entry.duplicate ? warnColor
                    : entry.error ? errorColor
                    : successColor,
                }} />

                {/* Name and email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, color: textPrimary,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const, display: 'block',
                  }}>
                    {entry.name || <em style={{ color: textFaint }}>No name</em>}
                  </span>
                  {entry.email && (
                    <span style={{ fontSize: '10px', color: textFaint }}>
                      {entry.email}
                    </span>
                  )}
                  {entry.duplicate && (
                    <span style={{ fontSize: '9px', color: warnColor, display: 'block' }}>
                      Already in guest list — will be skipped
                    </span>
                  )}
                  {entry.error && !entry.duplicate && (
                    <span style={{ fontSize: '9px', color: errorColor, display: 'block' }}>
                      {entry.error}
                    </span>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeEntry(i)}
                  aria-label="Remove entry"
                  style={{
                    background: 'none', border: 'none',
                    color: 'rgba(248,113,113,0.4)',
                    fontSize: '14px', cursor: 'pointer',
                    padding: '0 4px', flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 16px', borderRadius: '10px',
                border: `1px solid ${cardBorder}`,
                background: 'transparent', color: textFaint,
                fontSize: '12px', cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <button
              onClick={runImport}
              disabled={validCount === 0}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: 'none',
                background: validCount === 0
                  ? 'rgba(255,255,255,0.06)'
                  : 'linear-gradient(135deg, #E2C36B, #C8A84A)',
                color: validCount === 0 ? textFaint : '#1a0845',
                fontSize: '12px', fontWeight: 700,
                cursor: validCount === 0 ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              Import {validCount} Guest{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── 6.3 IMPORTING STEP ────────────────────────────────────────────── */}

      {step === 'importing' && (
        <div style={{ textAlign: 'center' as const, padding: '32px 0' }}>
          {/* Progress bar */}
          <div style={{
            height: '4px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.06)',
            margin: '0 auto 14px', width: '200px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: 'linear-gradient(90deg, #E2C36B, #C8A84A)',
              width: `${progress.total > 0
                ? Math.round((progress.done / progress.total) * 100)
                : 0}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{ fontSize: '12px', color: textFaint, margin: 0 }}>
            Importing {progress.done} of {progress.total} guests…
          </p>
        </div>
      )}

      {/* ── 6.4 DONE STEP ─────────────────────────────────────────────────── */}

      {step === 'done' && (
        <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
          <p style={{
            fontSize: '22px', marginBottom: '8px',
          }}>
            ✓
          </p>
          <p style={{
            fontSize: '13px', fontWeight: 600, color: textPrimary,
            margin: '0 0 6px',
          }}>
            Import complete
          </p>
          <p style={{
            fontSize: '12px', color: successColor,
            margin: '0 0 20px', lineHeight: 1.6,
          }}>
            {resultMsg}
          </p>
          <p style={{
            fontSize: '11px', color: textFaint,
            margin: '0 0 16px', lineHeight: 1.6,
          }}>
            Generate access codes in the Codes tab to assign entry codes
            to your newly imported guests.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '9px 22px', borderRadius: '9px',
              border: `1px solid ${cardBorder}`,
              background: 'transparent', color: goldMuted,
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Import Another Batch
          </button>
        </div>
      )}
    </div>
  )
}
