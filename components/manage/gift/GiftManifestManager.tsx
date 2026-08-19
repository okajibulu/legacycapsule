'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/manage/gift/GiftManifestManager.tsx
// PURPOSE:    Manifest item management for GCS — organiser adds, edits, reorders
//             and monitors stock levels across all gift items
// SPEC:       GCS-SPEC-001 Part Two + AMD-002 Part Two (Four-Domain Model)
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.18
// DATE:       19 August 2026
//
// PARENT:     Rendered inside GiftCollectionSection (Services Tab) when
//             capsule.components.includes('gift_collection') === true
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface ManifestItem {
  id:                  string
  item_name:           string
  category:            string | null
  description:         string | null
  donor_name:          string | null
  donor_name_visible:  boolean
  qty_in_stock:        number
  qty_allocated:       number
  qty_collected:       number
  qty_exceptions:      number
  qty_unallocated:     number   // derived: in_stock - allocated
  qty_outstanding:     number   // derived: allocated - collected
  is_active:           boolean
  sort_order:          number
  created_at:          string
}

interface GiftManifestManagerProps {
  capsuleId:  string
  readOnly?:  boolean   // true for coordinator view (co-admin with limited perms)
}

type FormMode = 'idle' | 'add' | 'edit'


// ═══ SECTION 2 — Empty state ════════════════════════════════════════════════════

function EmptyManifest({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E2C36B]/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-[#E2C36B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">No items in the gift manifest yet</h3>
      <p className="text-white/50 text-sm max-w-sm mb-6">
        Add each type of gift you are distributing at the event — bags, hampers, food packs,
        souvenirs. Each item you add here becomes available to assign to guests.
      </p>
      <button
        onClick={onAdd}
        className="px-5 py-2.5 bg-[#E2C36B] text-[#0f0a1e] text-sm font-semibold rounded-lg
                   hover:bg-[#E2C36B]/90 transition-colors"
      >
        Add First Item
      </button>
    </div>
  )
}


// ═══ SECTION 3 — Stock level indicator ═════════════════════════════════════════
//
// Colour-coded bar showing allocation health at a glance.
// Green: plenty unallocated · Amber: <20% unallocated · Red: fully allocated

function StockBar({ item }: { item: ManifestItem }) {
  if (item.qty_in_stock === 0) {
    return (
      <div className="mt-1.5">
        <div className="h-1.5 w-full rounded-full bg-white/10" />
        <p className="text-white/30 text-xs mt-1">No stock added</p>
      </div>
    )
  }

  const allocPct     = Math.round((item.qty_allocated / item.qty_in_stock) * 100)
  const collectedPct = Math.round((item.qty_collected / item.qty_in_stock) * 100)

  let barColor = 'bg-emerald-500'
  if (allocPct >= 100) barColor = 'bg-red-500'
  else if (allocPct >= 80) barColor = 'bg-amber-500'

  return (
    <div className="mt-2 space-y-1">
      {/* Stacked bar: collected (solid) + allocated-but-not-collected (muted) */}
      <div className="h-1.5 w-full rounded-full bg-white/10 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#E2C36B]/40"
          style={{ width: `${allocPct}%` }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#E2C36B]"
          style={{ width: `${collectedPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{item.qty_unallocated} unallocated</span>
        <span>{item.qty_collected} collected · {item.qty_outstanding} outstanding</span>
      </div>
    </div>
  )
}


// ═══ SECTION 4 — Item card ═════════════════════════════════════════════════════

function ItemCard({
  item,
  onEdit,
  onDelete,
  readOnly,
}: {
  item:     ManifestItem
  onEdit:   (item: ManifestItem) => void
  onDelete: (item: ManifestItem) => void
  readOnly: boolean
}) {
  return (
    <div className={`bg-white/5 border rounded-xl p-4 transition-colors ${
      item.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-medium truncate">{item.item_name}</h4>
            {!item.is_active && (
              <span className="text-xs text-white/40 border border-white/20 rounded px-1.5 py-0.5">
                Inactive
              </span>
            )}
            {item.category && (
              <span className="text-xs text-[#E2C36B]/70 bg-[#E2C36B]/10 rounded px-1.5 py-0.5">
                {item.category}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-white/40 text-sm mt-0.5 line-clamp-1">{item.description}</p>
          )}

          {item.donor_name && (
            <p className="text-white/30 text-xs mt-1">
              Donated by {item.donor_name_visible ? item.donor_name : '— name hidden'}
            </p>
          )}
        </div>

        {/* Stock quantity badge */}
        <div className="text-right shrink-0">
          <p className="text-white font-semibold text-lg leading-none">{item.qty_in_stock}</p>
          <p className="text-white/30 text-xs">in stock</p>
        </div>
      </div>

      <StockBar item={item} />

      {/* Quick counters row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-white/40">
        <span>
          <span className="text-white/60">{item.qty_allocated}</span> allocated
        </span>
        <span>
          <span className="text-white/60">{item.qty_collected}</span> collected
        </span>
        {item.qty_exceptions > 0 && (
          <span>
            <span className="text-amber-400">{item.qty_exceptions}</span> exceptions
          </span>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 text-xs py-1.5 rounded-lg border border-white/10 text-white/60
                       hover:border-white/20 hover:text-white/80 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/70
                       hover:border-red-500/40 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}


// ═══ SECTION 5 — Add / Edit form ═══════════════════════════════════════════════

interface ItemFormProps {
  mode:       FormMode
  initial?:   ManifestItem | null
  onSave:     (data: Partial<ManifestItem>) => Promise<void>
  onCancel:   () => void
  saving:     boolean
}

function ItemForm({ mode, initial, onSave, onCancel, saving }: ItemFormProps) {
  const [itemName,          setItemName]          = useState(initial?.item_name         ?? '')
  const [category,          setCategory]          = useState(initial?.category           ?? '')
  const [description,       setDescription]       = useState(initial?.description        ?? '')
  const [donorName,         setDonorName]         = useState(initial?.donor_name         ?? '')
  const [donorNameVisible,  setDonorNameVisible]  = useState(initial?.donor_name_visible ?? true)
  const [qtyInStock,        setQtyInStock]        = useState(String(initial?.qty_in_stock ?? ''))

  const isEdit = mode === 'edit'

  function handleSubmit() {
    onSave({
      item_name:          itemName.trim(),
      category:           category.trim() || undefined,
      description:        description.trim() || undefined,
      donor_name:         donorName.trim() || undefined,
      donor_name_visible: donorNameVisible,
      qty_in_stock:       parseInt(qtyInStock || '0', 10),
    })
  }

  return (
    <div className="bg-white/5 border border-[#E2C36B]/30 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold">
        {isEdit ? 'Edit Item' : 'Add Gift Item'}
      </h3>

      {/* Guidance tip */}
      <p className="text-white/40 text-xs leading-relaxed">
        Add each type of gift separately — for example, "Branded Tote Bag" and "Rice Pack" are
        two separate items. The stock quantity is the total number of that item you have available.
      </p>

      {/* Item name */}
      <div>
        <label className="block text-white/60 text-xs mb-1.5">
          Item Name <span className="text-[#E2C36B]">*</span>
        </label>
        <input
          type="text"
          value={itemName}
          onChange={e => setItemName(e.target.value)}
          placeholder="e.g. Branded Tote Bag, Gift Hamper (VIP)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-white/60 text-xs mb-1.5">Category (optional)</label>
        <input
          type="text"
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="e.g. Food Packs, VIP Gifts, Souvenirs"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
        />
        <p className="text-white/30 text-xs mt-1">
          Categories group items together in coordinator and guest views.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-white/60 text-xs mb-1.5">Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Additional detail shown at the collection point…"
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50
                     resize-none"
        />
      </div>

      {/* Stock quantity */}
      <div>
        <label className="block text-white/60 text-xs mb-1.5">
          Total Stock Quantity <span className="text-[#E2C36B]">*</span>
        </label>
        <input
          type="number"
          min="0"
          value={qtyInStock}
          onChange={e => setQtyInStock(e.target.value)}
          placeholder="0"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
        />
        <p className="text-white/30 text-xs mt-1">
          How many of this item do you have in total? You can increase this number later if more
          arrive. Reducing below the allocated amount is not permitted.
        </p>
      </div>

      {/* Donor attribution */}
      <div className="space-y-2">
        <label className="block text-white/60 text-xs">Donor Name (optional)</label>
        <input
          type="text"
          value={donorName}
          onChange={e => setDonorName(e.target.value)}
          placeholder="e.g. Uncle Emeka, The Adeyemi Family"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white
                     text-sm placeholder-white/20 focus:outline-none focus:border-[#E2C36B]/50"
        />
        {donorName.trim() && (
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              onClick={() => setDonorNameVisible(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                donorNameVisible ? 'bg-[#E2C36B]' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                donorNameVisible ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
            <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors">
              Show donor name to guests
            </span>
          </label>
        )}
        <p className="text-white/30 text-xs">
          If shown, guests see "Donated by [name]" on their gift credential. Leave blank if no
          attribution is needed.
        </p>
      </div>

      {/* Form actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !itemName.trim()}
          className="flex-1 py-2.5 bg-[#E2C36B] text-[#0f0a1e] text-sm font-semibold rounded-lg
                     hover:bg-[#E2C36B]/90 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add to Manifest'}
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


// ═══ SECTION 6 — Delete confirm modal ══════════════════════════════════════════

function DeleteConfirm({
  item,
  onConfirm,
  onCancel,
  deleting,
}: {
  item:      ManifestItem
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="bg-[#1a0845] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="text-white font-semibold">Remove "{item.item_name}"?</h3>
        {item.qty_allocated > 0 ? (
          <p className="text-amber-400 text-sm">
            This item has {item.qty_allocated} units allocated to guest entitlements. Remove all
            allocations before deleting.
          </p>
        ) : (
          <p className="text-white/50 text-sm">
            This will remove the item from the manifest. This action cannot be undone.
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting || item.qty_allocated > 0}
            className="flex-1 py-2.5 bg-red-500/80 text-white text-sm font-semibold rounded-lg
                       hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Removing…' : 'Remove Item'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-white/10 text-white/60 text-sm rounded-lg
                       hover:text-white/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}


// ═══ SECTION 7 — Summary bar ════════════════════════════════════════════════════

function ManifestSummaryBar({ items }: { items: ManifestItem[] }) {
  const active       = items.filter(i => i.is_active)
  const totalStock   = active.reduce((s, i) => s + i.qty_in_stock,  0)
  const totalAlloc   = active.reduce((s, i) => s + i.qty_allocated, 0)
  const totalCollect = active.reduce((s, i) => s + i.qty_collected, 0)

  if (!active.length) return null

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="text-center">
        <p className="text-white font-semibold text-xl leading-none">{totalStock}</p>
        <p className="text-white/40 text-xs mt-1">Total in stock</p>
      </div>
      <div className="text-center border-x border-white/10">
        <p className="text-[#E2C36B] font-semibold text-xl leading-none">{totalAlloc}</p>
        <p className="text-white/40 text-xs mt-1">Allocated</p>
      </div>
      <div className="text-center">
        <p className="text-emerald-400 font-semibold text-xl leading-none">{totalCollect}</p>
        <p className="text-white/40 text-xs mt-1">Collected</p>
      </div>
    </div>
  )
}


// ═══ SECTION 8 — Main component ════════════════════════════════════════════════

export default function GiftManifestManager({
  capsuleId,
  readOnly = false,
}: GiftManifestManagerProps) {
  const [items,      setItems]      = useState<ManifestItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [formMode,   setFormMode]   = useState<FormMode>('idle')
  const [editTarget, setEditTarget] = useState<ManifestItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManifestItem | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)


  // ── Load manifest ───────────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res  = await fetch(`/api/gift/manifest?capsule_id=${capsuleId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load manifest')
      setItems(data.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [capsuleId])

  useEffect(() => { loadItems() }, [loadItems])


  // ── Save item (add or edit) ─────────────────────────────────────────────────
  async function handleSave(data: Partial<ManifestItem>) {
    try {
      setSaving(true)

      if (formMode === 'add') {
        const res = await fetch('/api/gift/manifest', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...data, capsule_id: capsuleId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to add item')
        setItems(prev => [...prev, json.item])
      }

      if (formMode === 'edit' && editTarget) {
        const res = await fetch(`/api/gift/manifest/${editTarget.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to update item')
        setItems(prev => prev.map(i => i.id === editTarget.id ? json.item : i))
      }

      setFormMode('idle')
      setEditTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }


  // ── Delete item ─────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/gift/manifest/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to delete')
      }
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }


  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={loadItems} className="text-[#E2C36B] text-sm hover:underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Gift Manifest</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {items.length === 0
              ? 'No items added yet'
              : `${items.filter(i => i.is_active).length} active item${items.filter(i => i.is_active).length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {!readOnly && formMode === 'idle' && (
          <button
            onClick={() => { setFormMode('add'); setEditTarget(null) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E2C36B]/10 border border-[#E2C36B]/30
                       text-[#E2C36B] text-sm rounded-lg hover:bg-[#E2C36B]/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        )}
      </div>

      {/* Summary bar */}
      <ManifestSummaryBar items={items} />

      {/* Add / Edit form */}
      {(formMode === 'add' || formMode === 'edit') && (
        <ItemForm
          mode={formMode}
          initial={editTarget}
          onSave={handleSave}
          onCancel={() => { setFormMode('idle'); setEditTarget(null) }}
          saving={saving}
        />
      )}

      {/* Item list */}
      {items.length === 0 && formMode === 'idle' ? (
        <EmptyManifest onAdd={() => setFormMode('add')} />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              readOnly={readOnly}
              onEdit={item => {
                setEditTarget(item)
                setFormMode('edit')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirm
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

    </div>
  )
}
