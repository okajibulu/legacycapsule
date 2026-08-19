'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/manage/gift/GiftPoolManager.tsx
// PURPOSE:    Controlled Gift Pool creation and management
//             Organiser creates anonymous pools with max N collections
//             Each pool shows real-time capacity consumption
// SPEC:       GCS-SPEC-001-AMD-002 v1.0 Part Three — Phase 3 Step 9
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.20
// DATE:       19 August 2026
//
// PARENT:     Rendered inside GiftCollectionSection Settings or a dedicated
//             Pools sub-tab within the Services Tab GCS section
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface ManifestItem {
  id:              string
  item_name:       string
  category:        string | null
  qty_unallocated: number
}

interface Pool {
  id:                     string
  pool_name:              string
  pool_code:              string
  max_collections:        number
  collections_used:       number
  collections_remaining:  number
  is_active:              boolean
  gift_pool_items: {
    id:                      string
    manifest_item_id:        string
    quantity_per_collection: number
    gift_manifest_items: {
      id:        string
      item_name: string
      category:  string | null
    }
  }[]
}

interface GiftPoolManagerProps {
  capsuleId:     string
  manifestItems: ManifestItem[]
}


// ═══ SECTION 2 — Pool card ══════════════════════════════════════════════════════

function PoolCard({ pool }: { pool: Pool }) {
  const pct     = Math.round((pool.collections_used / pool.max_collections) * 100)
  const isFull  = pool.collections_used >= pool.max_collections

  return (
    <div className={`bg-white/5 border rounded-xl p-4 space-y-3 ${
      !pool.is_active ? 'border-white/5 opacity-60' : 'border-white/10'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium">{pool.pool_name}</h4>
            {isFull && (
              <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-1.5 py-0.5">
                Full
              </span>
            )}
            {!pool.is_active && (
              <span className="text-xs text-white/30 border border-white/10 rounded px-1.5 py-0.5">
                Inactive
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm mt-0.5">
            Code: <span className="text-white/60 font-mono">{pool.pool_code}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white font-semibold">
            {pool.collections_used}<span className="text-white/30 font-normal">/{pool.max_collections}</span>
          </p>
          <p className="text-white/30 text-xs">collections</p>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-[#E2C36B]'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="text-white/30 text-xs">
          {pool.collections_remaining} collection{pool.collections_remaining !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* Pool items */}
      {pool.gift_pool_items.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-white/30 text-xs mb-1.5">Each collection yields:</p>
          <div className="space-y-0.5">
            {pool.gift_pool_items.map(pi => (
              <p key={pi.id} className="text-white/60 text-xs">
                × {pi.quantity_per_collection} {pi.gift_manifest_items.item_name}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ═══ SECTION 3 — Pool item row in form ═════════════════════════════════════════

interface PoolItemEntry {
  manifest_item_id:        string
  quantity_per_collection: number
}

function PoolItemRow({
  entry,
  manifestItems,
  usedIds,
  onUpdate,
  onRemove,
}: {
  entry:         PoolItemEntry
  manifestItems: ManifestItem[]
  usedIds:       Set<string>
  onUpdate:      (field: keyof PoolItemEntry, value: string | number) => void
  onRemove:      () => void
}) {
  const available = manifestItems.filter(i => i.id === entry.manifest_item_id || !usedIds.has(i.id))

  return (
    <div className="flex items-center gap-2">
      <select
        value={entry.manifest_item_id}
        onChange={e => onUpdate('manifest_item_id', e.target.value)}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm
                   focus:outline-none focus:border-[#E2C36B]/50"
      >
        <option value="">— Select item —</option>
        {available.map(i => (
          <option key={i.id} value={i.id}>
            {i.item_name} ({i.qty_unallocated} avail)
          </option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        value={entry.quantity_per_collection}
        onChange={e => onUpdate('quantity_per_collection', parseInt(e.target.value, 10) || 1)}
        className="w-16 text-center bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white
                   text-sm focus:outline-none focus:border-[#E2C36B]/50"
      />
      <button onClick={onRemove} className="text-red-400/50 hover:text-red-400 transition-colors text-sm px-1">
        ✕
      </button>
    </div>
  )
}


// ═══ SECTION 4 — Create pool form ═══════════════════════════════════════════════

function CreatePoolForm({
  manifestItems,
  onSave,
  onCancel,
  saving,
}: {
  manifestItems: ManifestItem[]
  onSave:        (data: {
    pool_name:       string
    pool_code:       string
    max_collections: number
    items:           PoolItemEntry[]
  }) => Promise<void>
  onCancel:      () => void
  saving:        boolean
}) {
  const [poolName,    setPoolName]    = useState('')
  const [poolCode,    setPoolCode]    = useState('')
  const [maxCollect,  setMaxCollect]  = useState('')
  const [items,       setItems]       = useState<PoolItemEntry[]>([
    { manifest_item_id: '', quantity_per_collection: 1 }
  ])

  const usedIds = new Set(items.map(i => i.manifest_item_id).filter(Boolean))
  const maxNum  = parseInt(maxCollect, 10)

  // Live allocation warning
  const warnings: string[] = []
  for (const entry of items) {
    if (!entry.manifest_item_id) continue
    const mItem = manifestItems.find(i => i.id === entry.manifest_item_id)
    if (!mItem) continue
    const needed = (maxNum || 0) * entry.quantity_per_collection
    if (needed > mItem.qty_unallocated) {
      warnings.push(
        `"${mItem.item_name}": need ${needed}, only ${mItem.qty_unallocated} unallocated`
      )
    }
  }

  function updateItem(index: number, field: keyof PoolItemEntry, value: string | number) {
    setItems(prev => prev.map((i, idx) => idx === index ? { ...i, [field]: value } : i))
  }

  function addItemRow() {
    setItems(prev => [...prev, { manifest_item_id: '', quantity_per_collection: 1 }])
  }

  function removeItemRow(index: number) {
    setItems(prev => prev.filter((_, idx) => idx !== index))
  }

  const canSave =
    poolName.trim() &&
    poolCode.trim() &&
    !isNaN(maxNum) &&
    maxNum >= 1 &&
    items.length > 0 &&
    items.every(i => i.manifest_item_id) &&
    warnings.length === 0

  return (
    <div className="bg-white/5 border border-[#E2C36B]/30 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold">Create Controlled Pool</h3>

      <p className="text-white/40 text-xs leading-relaxed">
        A controlled pool allows anonymous gift collection up to a set maximum. Use this for
        walk-in guests or situations where you don't have names in advance. No guest can collect
        more than once — the pool ceiling enforces fairness.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/50 text-xs mb-1.5">Pool Name <span className="text-[#E2C36B]">*</span></label>
          <input
            type="text"
            value={poolName}
            onChange={e => setPoolName(e.target.value)}
            placeholder="e.g. Welcome Pack Pool"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                       text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
          />
        </div>
        <div>
          <label className="block text-white/50 text-xs mb-1.5">Pool Code <span className="text-[#E2C36B]">*</span></label>
          <input
            type="text"
            value={poolCode}
            onChange={e => setPoolCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="e.g. 000"
            maxLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                       text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50 font-mono"
          />
          <p className="text-white/25 text-xs mt-1">Numeric only</p>
        </div>
      </div>

      <div>
        <label className="block text-white/50 text-xs mb-1.5">
          Maximum Collections <span className="text-[#E2C36B]">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={maxCollect}
          onChange={e => setMaxCollect(e.target.value)}
          placeholder="e.g. 50"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
        />
        <p className="text-white/30 text-xs mt-1">
          Hard ceiling — once this many people have collected, the pool is exhausted and closed.
        </p>
      </div>

      {/* Pool items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-white/50 text-xs">
            Items per collection <span className="text-[#E2C36B]">*</span>
          </label>
          <p className="text-white/25 text-xs">Item · Quantity</p>
        </div>
        {items.map((entry, idx) => (
          <PoolItemRow
            key={idx}
            entry={entry}
            manifestItems={manifestItems}
            usedIds={usedIds}
            onUpdate={(field, value) => updateItem(idx, field, value)}
            onRemove={() => removeItemRow(idx)}
          />
        ))}
        <button
          onClick={addItemRow}
          className="w-full py-2 text-xs text-[#E2C36B]/70 border border-dashed border-[#E2C36B]/20
                     rounded-lg hover:border-[#E2C36B]/40 hover:text-[#E2C36B] transition-colors"
        >
          + Add another item type
        </button>
      </div>

      {/* Allocation warnings */}
      {warnings.length > 0 && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 space-y-1">
          <p className="text-red-300 text-xs font-medium">Allocation check failed:</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-red-300/70 text-xs">{w}</p>
          ))}
          <p className="text-red-300/50 text-xs mt-1">
            Reduce max collections or add more stock before creating this pool.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => onSave({ pool_name: poolName.trim(), pool_code: poolCode.trim(), max_collections: maxNum, items })}
          disabled={saving || !canSave}
          className="flex-1 py-2.5 bg-[#E2C36B] text-[#0f0a1e] text-sm font-semibold rounded-lg
                     hover:bg-[#E2C36B]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Creating…' : 'Create Pool'}
        </button>
        <button onClick={onCancel} disabled={saving} className="px-4 py-2.5 text-sm text-white/40 hover:text-white/60">
          Cancel
        </button>
      </div>
    </div>
  )
}


// ═══ SECTION 5 — Main component ════════════════════════════════════════════════

export default function GiftPoolManager({ capsuleId, manifestItems }: GiftPoolManagerProps) {
  const [pools,    setPools]    = useState<Pool[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)


  const loadPools = useCallback(async () => {
    try {
      setLoading(true)
      const res  = await fetch(`/api/gift/pools?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setPools(data.pools ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [capsuleId])

  useEffect(() => { loadPools() }, [loadPools])


  async function handleCreate(data: {
    pool_name:       string
    pool_code:       string
    max_collections: number
    items:           PoolItemEntry[]
  }) {
    try {
      setSaving(true)
      const res  = await fetch('/api/gift/pools', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...data, capsule_id: capsuleId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create pool')
      setPools(prev => [json.pool, ...prev])
      setShowForm(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-7 h-7 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={loadPools} className="text-[#E2C36B] text-sm hover:underline">Try again</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Gift Pools</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {pools.length === 0 ? 'No pools created yet' : `${pools.length} pool${pools.length !== 1 ? 's' : ''}`}
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
            New Pool
          </button>
        )}
      </div>

      {showForm && (
        <CreatePoolForm
          manifestItems={manifestItems}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {pools.length === 0 && !showForm && (
        <div className="text-center py-10 text-white/30 text-sm space-y-2">
          <p>No anonymous pools set up yet.</p>
          <p className="text-white/20 text-xs">
            Use pools for walk-in guests where you do not have names in advance.
            Each pool has a hard maximum to prevent over-collection.
          </p>
        </div>
      )}

      {pools.length > 0 && (
        <div className="space-y-3">
          {pools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      )}
    </div>
  )
}
