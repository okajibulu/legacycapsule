'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/manage/gift/GiftBlockManager.tsx
// PURPOSE:    Numbered range block assignment for GCS — FRFA creates blocks,
//             assigns coordinators, visualises coverage across the full number range
// SPEC:       GCS-SPEC-001-AMD-001 Part One (Block System)
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// PARENT:     Rendered inside GiftCollectionSection (Services Tab)
//             Only shown to organiser / frfa / family_rep_full roles
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface GiftBlock {
  id:             string
  block_name:     string
  range_start:    number
  range_end:      number
  coordinator_id: string | null
  is_locked:      boolean
  is_buffer:      boolean
  created_at:     string
  capsule_accounts?: {
    id:           string
    display_name: string
    role:         string
  } | null
}

interface CoAdmin {
  id:           string
  display_name: string
  role:         string
}

interface GiftBlockManagerProps {
  capsuleId: string
  coAdmins:  CoAdmin[]   // passed from parent — capsule_accounts with gift_collection permission
}


// ═══ SECTION 2 — Range visualiser ══════════════════════════════════════════════
//
// Horizontal bar showing block coverage across 001–999.
// Each block rendered as a proportional segment — colour-coded by assignment status.
// FRFA buffer blocks shown as grey. Unassigned blocks shown as amber outline.
// Assigned blocks shown as solid gold.

function RangeVisualiser({ blocks }: { blocks: GiftBlock[] }) {
  const RANGE_MIN = 1
  const RANGE_MAX = 999
  const RANGE_SPAN = RANGE_MAX - RANGE_MIN

  if (!blocks.length) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/30">
          <span>001</span>
          <span>999</span>
        </div>
        <div className="h-8 w-full rounded-lg bg-white/5 border border-white/5 flex items-center
                        justify-center text-white/20 text-xs">
          No blocks defined — the full range is available
        </div>
      </div>
    )
  }

  // Sort by range_start for consistent display
  const sorted = [...blocks].sort((a, b) => a.range_start - b.range_start)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>001</span>
        <span>999</span>
      </div>
      <div className="relative h-8 w-full rounded-lg bg-white/5 border border-white/5 overflow-hidden">
        {sorted.map(block => {
          const left  = ((block.range_start - RANGE_MIN) / RANGE_SPAN) * 100
          const width = ((block.range_end - block.range_start + 1) / RANGE_SPAN) * 100

          let bg = 'bg-[#E2C36B]'           // assigned to coordinator
          if (block.is_buffer)      bg = 'bg-white/20'         // FRFA buffer
          if (!block.coordinator_id && !block.is_buffer) bg = 'bg-[#E2C36B]/30 border border-[#E2C36B]/50' // unassigned

          return (
            <div
              key={block.id}
              className={`absolute top-0 h-full ${bg} transition-all`}
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
              title={`${block.block_name}: ${block.range_start}–${block.range_end}`}
            />
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-[#E2C36B] inline-block" />
          Assigned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-[#E2C36B]/30 border border-[#E2C36B]/50 inline-block" />
          Unassigned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-white/20 inline-block" />
          Buffer (FRFA)
        </span>
      </div>
    </div>
  )
}


// ═══ SECTION 3 — Block card ═════════════════════════════════════════════════════

function BlockCard({
  block,
  onAssign,
}: {
  block:    GiftBlock
  onAssign: (block: GiftBlock) => void
}) {
  const coordName = block.capsule_accounts?.display_name ?? null
  const codeCount = block.range_end - block.range_start + 1

  return (
    <div className={`bg-white/5 border rounded-xl p-4 space-y-3 ${
      block.is_locked ? 'border-white/5 opacity-70' : 'border-white/10'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-medium">{block.block_name}</h4>
            {block.is_buffer && (
              <span className="text-xs text-white/40 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                Buffer
              </span>
            )}
            {block.is_locked && (
              <span className="text-xs text-amber-400/70 bg-amber-400/10 rounded px-1.5 py-0.5">
                Locked
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm mt-0.5">
            Codes {block.range_start.toString().padStart(3, '0')} — {block.range_end.toString().padStart(3, '0')}
            <span className="ml-2 text-white/25">({codeCount} code{codeCount !== 1 ? 's' : ''})</span>
          </p>
        </div>

        <div className="text-right shrink-0">
          {coordName ? (
            <div>
              <p className="text-[#E2C36B] text-sm font-medium">{coordName}</p>
              <p className="text-white/30 text-xs">Coordinator</p>
            </div>
          ) : block.is_buffer ? (
            <p className="text-white/30 text-xs">FRFA direct</p>
          ) : (
            <p className="text-amber-400/70 text-xs">Unassigned</p>
          )}
        </div>
      </div>

      {!block.is_locked && (
        <button
          onClick={() => onAssign(block)}
          className="w-full text-xs py-1.5 rounded-lg border border-white/10 text-white/50
                     hover:border-white/20 hover:text-white/70 transition-colors"
        >
          {coordName ? 'Reassign coordinator' : 'Assign coordinator'}
        </button>
      )}
    </div>
  )
}


// ═══ SECTION 4 — Add block form ═════════════════════════════════════════════════

interface AddBlockFormProps {
  onSave:   (data: {
    block_name:     string
    range_start:    number
    range_end:      number
    coordinator_id: string | null
    is_buffer:      boolean
  }) => Promise<void>
  onCancel: () => void
  saving:   boolean
  coAdmins: CoAdmin[]
  blocks:   GiftBlock[]
}

function AddBlockForm({ onSave, onCancel, saving, coAdmins, blocks }: AddBlockFormProps) {
  const [blockName,    setBlockName]    = useState('')
  const [rangeStart,   setRangeStart]   = useState('')
  const [rangeEnd,     setRangeEnd]     = useState('')
  const [coordId,      setCoordId]      = useState('')
  const [isBuffer,     setIsBuffer]     = useState(false)

  // Live overlap feedback
  const start = parseInt(rangeStart, 10)
  const end   = parseInt(rangeEnd,   10)

  const overlappingBlock = (!isNaN(start) && !isNaN(end) && end >= start)
    ? blocks.find(b =>
        b.range_start <= end && b.range_end >= start
      ) ?? null
    : null

  function handleSubmit() {
    onSave({
      block_name:     blockName.trim(),
      range_start:    start,
      range_end:      end,
      coordinator_id: coordId || null,
      is_buffer:      isBuffer,
    })
  }

  return (
    <div className="bg-white/5 border border-[#E2C36B]/30 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold">Create New Block</h3>

      <p className="text-white/40 text-xs leading-relaxed">
        A block is a named range of gift collection codes. Each coordinator manages the guests
        within their block. Blocks must not overlap. Numbers run from 001 to 999.
      </p>

      {/* Block name */}
      <div>
        <label className="block text-white/60 text-xs mb-1.5">
          Block Name <span className="text-[#E2C36B]">*</span>
        </label>
        <input
          type="text"
          value={blockName}
          onChange={e => setBlockName(e.target.value)}
          placeholder="e.g. Gbenga's Friends, VIP Table, Gate B"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
        />
        <p className="text-white/30 text-xs mt-1">
          Name this block after the coordinator or the group of guests they are responsible for.
        </p>
      </div>

      {/* Range inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/60 text-xs mb-1.5">Range Start</label>
          <input
            type="number"
            min="1"
            max="999"
            value={rangeStart}
            onChange={e => setRangeStart(e.target.value)}
            placeholder="001"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                       text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
          />
        </div>
        <div>
          <label className="block text-white/60 text-xs mb-1.5">Range End</label>
          <input
            type="number"
            min="1"
            max="999"
            value={rangeEnd}
            onChange={e => setRangeEnd(e.target.value)}
            placeholder="050"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                       text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
          />
        </div>
      </div>

      {/* Overlap warning — live */}
      {overlappingBlock && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          ⚠ This range overlaps with <strong>{overlappingBlock.block_name}</strong>
          {' '}({overlappingBlock.range_start}–{overlappingBlock.range_end}).
          Adjust the range to avoid overlap.
        </p>
      )}

      {/* Buffer toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          onClick={() => setIsBuffer(v => !v)}
          className={`w-10 h-5 rounded-full transition-colors relative ${
            isBuffer ? 'bg-[#E2C36B]' : 'bg-white/10'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            isBuffer ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </div>
        <span className="text-white/50 text-xs">This is a buffer block (FRFA-held gap)</span>
      </label>

      {/* Coordinator assignment */}
      {!isBuffer && coAdmins.length > 0 && (
        <div>
          <label className="block text-white/60 text-xs mb-1.5">Assign Coordinator (optional)</label>
          <select
            value={coordId}
            onChange={e => setCoordId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                       text-sm focus:outline-none focus:border-[#E2C36B]/50"
          >
            <option value="">— Unassigned (FRFA manages) —</option>
            {coAdmins.map(c => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
          <p className="text-white/30 text-xs mt-1">
            You can assign a coordinator now or leave it unassigned and return to this later.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSubmit}
          disabled={
            saving ||
            !blockName.trim() ||
            isNaN(start) ||
            isNaN(end) ||
            end < start ||
            !!overlappingBlock
          }
          className="flex-1 py-2.5 bg-[#E2C36B] text-[#0f0a1e] text-sm font-semibold rounded-lg
                     hover:bg-[#E2C36B]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Creating…' : 'Create Block'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}


// ═══ SECTION 5 — Main component ════════════════════════════════════════════════

export default function GiftBlockManager({ capsuleId, coAdmins }: GiftBlockManagerProps) {
  const [blocks,     setBlocks]     = useState<GiftBlock[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [assignTarget, setAssignTarget] = useState<GiftBlock | null>(null)


  // ── Load blocks ─────────────────────────────────────────────────────────────
  const loadBlocks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res  = await fetch(`/api/gift/blocks?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load blocks')
      setBlocks(data.blocks ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [capsuleId])

  useEffect(() => { loadBlocks() }, [loadBlocks])


  // ── Create block ─────────────────────────────────────────────────────────────
  async function handleCreate(data: {
    block_name:     string
    range_start:    number
    range_end:      number
    coordinator_id: string | null
    is_buffer:      boolean
  }) {
    try {
      setSaving(true)
      const res  = await fetch('/api/gift/blocks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, capsule_id: capsuleId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create block')
      setBlocks(prev => [...prev, json.block].sort((a, b) => a.range_start - b.range_start))
      setShowForm(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }


  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-7 h-7 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={loadBlocks} className="text-[#E2C36B] text-sm hover:underline">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Number Blocks</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {blocks.length === 0
              ? 'No blocks defined'
              : `${blocks.length} block${blocks.length !== 1 ? 's' : ''} covering ${
                  blocks.reduce((s, b) => s + b.range_end - b.range_start + 1, 0)
                } codes`
            }
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E2C36B]/10 border border-[#E2C36B]/30
                       text-[#E2C36B] text-sm rounded-lg hover:bg-[#E2C36B]/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Block
          </button>
        )}
      </div>

      {/* Range visualiser */}
      <RangeVisualiser blocks={blocks} />

      {/* Context tip */}
      {blocks.length === 0 && !showForm && (
        <div className="text-center py-10 text-white/40 text-sm space-y-2">
          <p>Blocks divide the gift collection number range between coordinators.</p>
          <p className="text-white/25 text-xs">
            Example — Block "Gbenga's Friends": codes 001–050 · Block "VIP Table": codes 051–080
          </p>
        </div>
      )}

      {/* Add block form */}
      {showForm && (
        <AddBlockForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          saving={saving}
          coAdmins={coAdmins}
          blocks={blocks}
        />
      )}

      {/* Block list */}
      {blocks.length > 0 && (
        <div className="space-y-3">
          {blocks.map(block => (
            <BlockCard
              key={block.id}
              block={block}
              onAssign={setAssignTarget}
            />
          ))}
        </div>
      )}

    </div>
  )
}
