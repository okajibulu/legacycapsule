'use client'

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase-browser'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface ContentRow {
  id: string
  key: string
  label: string
  value: string
  group_key: string
  sort_order: number
  updated_at: string
}

interface GroupConfig {
  key: string
  label: string
  icon: string
  description: string
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP CONFIGURATION
// Drives the three collapsible sections. Order matches lc_content group_key values.
// ─────────────────────────────────────────────────────────────────────────────
const GROUPS: GroupConfig[] = [
  {
    key: 'tier_honour',
    label: 'Legacy Honour Tier',
    icon: '📦',
    description: 'Package name, tagline, description and feature bullets for the Honour tier',
  },
  {
    key: 'tier_premier',
    label: 'Legacy Premier Tier',
    icon: '💎',
    description: 'Package name, tagline, description and feature bullets for the Premier tier',
  },
  {
    key: 'booking_flow',
    label: 'Booking Flow Labels',
    icon: '🔖',
    description: 'Visitor type titles, subtitles, CTA text and footer line shown during booking',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Returns true if the key is a feature bullet (pattern: group__feat_N)
function isFeatureKey(key: string): boolean {
  return /__(feat_)\d+$/.test(key)
}

// Returns true if the key is name, tagline, or description (non-feature metadata)
function isMetaKey(key: string): boolean {
  return (
    key.endsWith('__name') ||
    key.endsWith('__tagline') ||
    key.endsWith('__description')
  )
}

// Derives the next feature number for a given group from existing rows
function nextFeatureNumber(rows: ContentRow[], groupKey: string): number {
  const feats = rows
    .filter((r) => r.group_key === groupKey && isFeatureKey(r.key))
    .map((r) => {
      const match = r.key.match(/feat_(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
  return feats.length > 0 ? Math.max(...feats) + 1 : 1
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLAPSIBLE GROUP SECTION COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function GroupSection({
  group,
  rows,
  onSave,
  onAddFeature,
  onDeleteFeature,
  saving,
  msg,
}: {
  group: GroupConfig
  rows: ContentRow[]
  onSave: (key: string, value: string) => void
  onAddFeature: (groupKey: string, value: string, nextNum: number) => void
  onDeleteFeature: (key: string) => void
  saving: string | null
  msg: string
}) {
  // ── Local state ────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(true)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [newFeature, setNewFeature] = useState('')

  // Initialise edit state from rows on mount / rows change
  useEffect(() => {
    const initial: Record<string, string> = {}
    rows.forEach((r) => { initial[r.key] = r.value })
    setEdits(initial)
  }, [rows])

  // ── Derived row sets ───────────────────────────────────────────────────────
  const metaRows = rows
    .filter((r) => isMetaKey(r.key))
    .sort((a, b) => a.sort_order - b.sort_order)

  const featureRows = rows
    .filter((r) => isFeatureKey(r.key))
    .sort((a, b) => a.sort_order - b.sort_order)

  const bookingRows = rows
    .filter((r) => !isMetaKey(r.key) && !isFeatureKey(r.key))
    .sort((a, b) => a.sort_order - b.sort_order)

  const isTierGroup = group.key.startsWith('tier_')
  const displayRows = isTierGroup ? metaRows : bookingRows
  const nextNum = nextFeatureNumber(rows, group.key)

  return (
    <div className="rounded-xl border border-white/10 bg-white/4 overflow-hidden">

      {/* ── Section header / collapse toggle ─────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4
          hover:bg-white/4 transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{group.icon}</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-yellow-100">{group.label}</p>
            <p className="text-[10px] text-white/35 mt-0.5">{group.description}</p>
          </div>
        </div>
        <span className={`text-white/30 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* ── Expanded content ─────────────────────────────────────────────── */}
      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/8">

          {/* Flash message */}
          {msg && (
            <div className="mt-4 px-3 py-2 rounded-lg border border-yellow-400/30
              bg-yellow-400/8 text-yellow-200 text-xs">
              {msg}
            </div>
          )}

          {/* ── Metadata / booking rows (name, tagline, description, booking labels) */}
          {displayRows.length > 0 && (
            <div className="space-y-3 mt-4">
              {displayRows.map((row) => {
                const isDesc = row.key.endsWith('__description')
                return (
                  <div key={row.key}>
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">
                      {row.label}
                    </label>
                    {isDesc ? (
                      <textarea
                        rows={3}
                        value={edits[row.key] ?? row.value}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [row.key]: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/8 border border-white/15
                          text-white text-sm placeholder:text-white/20 resize-none
                          focus:outline-none focus:border-yellow-300 transition-all"
                      />
                    ) : (
                      <input
                        type="text"
                        value={edits[row.key] ?? row.value}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [row.key]: e.target.value }))
                        }
                        className="mt-1 w-full px-3 py-1.5 rounded-lg bg-white/8 border border-white/15
                          text-white text-sm placeholder:text-white/20
                          focus:outline-none focus:border-yellow-300 transition-all"
                      />
                    )}
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={() => onSave(row.key, edits[row.key] ?? row.value)}
                        disabled={saving === row.key}
                        className="text-[10px] px-3 py-1 rounded-lg border border-yellow-400/20
                          text-yellow-300/70 hover:text-yellow-200 hover:border-yellow-400/40
                          disabled:opacity-40 transition-all"
                      >
                        {saving === row.key ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Feature bullets (tier groups only) ───────────────────────── */}
          {isTierGroup && (
            <div className="space-y-3 pt-2 border-t border-white/8">
              <p className="text-[10px] text-white/30 uppercase tracking-widest pt-1">
                Feature Bullets
              </p>

              {featureRows.length === 0 && (
                <p className="text-white/20 text-xs">No feature bullets yet.</p>
              )}

              {featureRows.map((row, index) => (
                <div key={row.key} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 w-4 flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={edits[row.key] ?? row.value}
                    onChange={(e) =>
                      setEdits((prev) => ({ ...prev, [row.key]: e.target.value }))
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/8 border border-white/15
                      text-white text-sm focus:outline-none focus:border-yellow-300 transition-all"
                  />
                  <button
                    onClick={() => onSave(row.key, edits[row.key] ?? row.value)}
                    disabled={saving === row.key}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-yellow-400/20
                      text-yellow-300/60 hover:text-yellow-200 hover:border-yellow-400/40
                      disabled:opacity-40 transition-all flex-shrink-0"
                  >
                    {saving === row.key ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete feature: "${row.value}"?`)) {
                        onDeleteFeature(row.key)
                      }
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-red-400/20
                      text-red-400/50 hover:text-red-300 hover:border-red-400/40
                      transition-all flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add new feature */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="New feature bullet..."
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFeature.trim()) {
                      onAddFeature(group.key, newFeature.trim(), nextNum)
                      setNewFeature('')
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/6 border border-white/10
                    text-white text-sm placeholder:text-white/20
                    focus:outline-none focus:border-yellow-300/50 transition-all"
                />
                <button
                  onClick={() => {
                    if (newFeature.trim()) {
                      onAddFeature(group.key, newFeature.trim(), nextNum)
                      setNewFeature('')
                    }
                  }}
                  className="text-[10px] px-3 py-1.5 rounded-lg border border-yellow-400/25
                    text-yellow-300/70 hover:text-yellow-200 hover:border-yellow-400/50
                    transition-all flex-shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ContentPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<ContentRow[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // ── Load all lc_content rows ───────────────────────────────────────────────
  const load = async () => {
    const { data } = await supabase
      .from('lc_content')
      .select('id, key, label, value, group_key, sort_order, updated_at')
      .order('group_key')
      .order('sort_order')
    if (data) setRows(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  // ── Flash message per group ────────────────────────────────────────────────
  const flashGroup = (groupKey: string, text: string) => {
    setMsgs((prev) => ({ ...prev, [groupKey]: text }))
    setTimeout(() => setMsgs((prev) => ({ ...prev, [groupKey]: '' })), 3000)
  }

  // ── Save a single content row value ───────────────────────────────────────
  const handleSave = async (key: string, value: string) => {
    setSaving(key)
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        key,
        value,
        reason: 'LCAdmin content edit',
      }),
    })
    if (res.ok) {
      // Find group key for this row to flash the right section
      const row = rows.find((r) => r.key === key)
      if (row) flashGroup(row.group_key, `Saved: ${row.label}`)
      await load()
    }
    setSaving(null)
  }

  // ── Add a new feature bullet ───────────────────────────────────────────────
  const handleAddFeature = async (
    groupKey: string,
    value: string,
    nextNum: number
  ) => {
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_feature',
        groupKey,
        value,
        nextSortOrder: nextNum,
      }),
    })
    if (res.ok) {
      flashGroup(groupKey, 'Feature bullet added')
      await load()
    }
  }

  // ── Delete a feature bullet ────────────────────────────────────────────────
  const handleDeleteFeature = async (key: string) => {
    const row = rows.find((r) => r.key === key)
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_feature', key }),
    })
    if (res.ok) {
      if (row) flashGroup(row.group_key, 'Feature bullet deleted')
      await load()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <p className="text-white/30 text-sm text-center py-16">
        Loading content...
      </p>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
          Content Editor
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          Edit tier names, feature bullets, and booking flow labels.
          All changes apply immediately — no code deployment needed.
        </p>
      </div>

      {/* One collapsible section per group */}
      {GROUPS.map((group) => (
        <GroupSection
          key={group.key}
          group={group}
          rows={rows.filter((r) => r.group_key === group.key)}
          onSave={handleSave}
          onAddFeature={handleAddFeature}
          onDeleteFeature={handleDeleteFeature}
          saving={saving}
          msg={msgs[group.key] ?? ''}
        />
      ))}

    </div>
  )
}
