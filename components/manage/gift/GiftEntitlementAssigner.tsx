'use client'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE PATH:  components/manage/gift/GiftEntitlementAssigner.tsx
// PURPOSE:    Assign, edit, and revoke gift item entitlements for a specific
//             credential (guest). Shows allocation health per item.
//             Used inside coordinator dashboard and organiser credential detail.
// SPEC:       GCS-SPEC-001-AMD-002 Part Two (Four-Domain Model)
// BUILT BY:   AI22 · Claude Opus 4.6
// VERSION:    AI22v2.12.20
// DATE:       19 August 2026
//
// PROPS:
//   capsuleId    — capsule UUID
//   credentialId — the specific gift_credentials row
//   guestName    — displayed in header
//   readOnly     — hides add/edit/revoke controls
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'


// ═══ SECTION 1 — Types ═════════════════════════════════════════════════════════

interface ManifestItem {
  id:              string
  item_name:       string
  category:        string | null
  qty_in_stock:    number
  qty_allocated:   number
  qty_unallocated: number
}

interface Entitlement {
  id:                 string
  manifest_item_id:   string
  quantity_entitled:  number
  quantity_allocated: number
  quantity_collected: number
  gift_manifest_items: {
    id:              string
    item_name:       string
    category:        string | null
    qty_in_stock:    number
    qty_allocated:   number
    qty_collected:   number
    qty_exceptions:  number
  }
}

interface GiftEntitlementAssignerProps {
  capsuleId:    string
  credentialId: string
  guestName:    string
  readOnly?:    boolean
  manifestItems?: ManifestItem[]   // pre-fetched by parent to avoid duplicate calls
}


// ═══ SECTION 2 — Entitlement row ════════════════════════════════════════════════

function EntitlementRow({
  ent,
  onEdit,
  onRevoke,
  readOnly,
}: {
  ent:      Entitlement
  onEdit:   (ent: Entitlement) => void
  onRevoke: (ent: Entitlement) => void
  readOnly: boolean
}) {
  const item       = ent.gift_manifest_items
  const isCollected = ent.quantity_collected >= ent.quantity_entitled
  const isPartial   = ent.quantity_collected > 0 && !isCollected

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{item.item_name}</p>
        {item.category && (
          <p className="text-white/30 text-xs">{item.category}</p>
        )}
      </div>

      {/* Quantity + collection status */}
      <div className="text-right shrink-0">
        <p className="text-white text-sm">
          ×{ent.quantity_entitled}
        </p>
        {isCollected && (
          <p className="text-emerald-400 text-xs">Collected</p>
        )}
        {isPartial && (
          <p className="text-amber-400 text-xs">{ent.quantity_collected} of {ent.quantity_entitled}</p>
        )}
        {!isCollected && !isPartial && (
          <p className="text-white/30 text-xs">Pending</p>
        )}
      </div>

      {/* Actions */}
      {!readOnly && !isCollected && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(ent)}
            className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-white/50
                       hover:text-white/70 hover:border-white/20 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onRevoke(ent)}
            className="text-xs px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400/60
                       hover:border-red-500/40 hover:text-red-400 transition-colors"
          >
            Revoke
          </button>
        </div>
      )}
    </div>
  )
}


// ═══ SECTION 3 — Add entitlement form ══════════════════════════════════════════

function AddEntitlementForm({
  manifestItems,
  existingItemIds,
  onSave,
  onCancel,
  saving,
}: {
  manifestItems:   ManifestItem[]
  existingItemIds: Set<string>
  onSave:          (itemId: string, qty: number) => Promise<void>
  onCancel:        () => void
  saving:          boolean
}) {
  const available = manifestItems.filter(i => !existingItemIds.has(i.id) && i.qty_unallocated > 0)
  const [itemId,  setItemId]  = useState(available[0]?.id ?? '')
  const [qty,     setQty]     = useState('1')

  const selectedItem = available.find(i => i.id === itemId)
  const qtyNum       = parseInt(qty, 10)
  const maxQty       = selectedItem?.qty_unallocated ?? 0

  if (!available.length) {
    return (
      <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 text-amber-300/80 text-sm">
        All available gift items are already assigned to this guest, or the manifest has no
        unallocated inventory remaining.
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-[#E2C36B]/30 rounded-xl p-4 space-y-3">
      <h4 className="text-white text-sm font-semibold">Add Item to Entitlement</h4>

      <div>
        <label className="block text-white/50 text-xs mb-1.5">Gift Item</label>
        <select
          value={itemId}
          onChange={e => { setItemId(e.target.value); setQty('1') }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                     focus:outline-none focus:border-[#E2C36B]/50"
        >
          {available.map(i => (
            <option key={i.id} value={i.id}>
              {i.item_name} ({i.qty_unallocated} unallocated)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white/50 text-xs mb-1.5">
          Quantity <span className="text-white/30 text-xs font-normal">(max {maxQty})</span>
        </label>
        <input
          type="number"
          min="1"
          max={maxQty}
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                     focus:outline-none focus:border-[#E2C36B]/50"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onSave(itemId, qtyNum)}
          disabled={saving || !itemId || isNaN(qtyNum) || qtyNum < 1 || qtyNum > maxQty}
          className="flex-1 py-2 bg-[#E2C36B] text-[#0f0a1e] text-sm font-semibold rounded-lg
                     hover:bg-[#E2C36B]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Adding…' : 'Add Item'}
        </button>
        <button onClick={onCancel} className="px-3 py-2 text-sm text-white/40 hover:text-white/60">
          Cancel
        </button>
      </div>
    </div>
  )
}


// ═══ SECTION 4 — Edit quantity inline ══════════════════════════════════════════

function EditQtyForm({
  ent,
  onSave,
  onCancel,
  saving,
}: {
  ent:      Entitlement
  onSave:   (qty: number) => Promise<void>
  onCancel: () => void
  saving:   boolean
}) {
  const item    = ent.gift_manifest_items
  const [qty, setQty] = useState(String(ent.quantity_entitled))
  const qtyNum  = parseInt(qty, 10)
  const maxQty  = ent.quantity_entitled + (item.qty_in_stock - item.qty_allocated)

  return (
    <div className="flex items-center gap-2 py-2">
      <p className="text-white/60 text-sm flex-1">{item.item_name}</p>
      <input
        type="number"
        min={ent.quantity_collected}
        max={maxQty}
        value={qty}
        onChange={e => setQty(e.target.value)}
        className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm
                   text-center focus:outline-none focus:border-[#E2C36B]/50"
      />
      <button
        onClick={() => onSave(qtyNum)}
        disabled={saving || isNaN(qtyNum) || qtyNum < 1}
        className="px-3 py-1.5 bg-[#E2C36B] text-[#0f0a1e] text-xs font-semibold rounded-lg
                   hover:bg-[#E2C36B]/90 disabled:opacity-40 transition-colors"
      >
        {saving ? '…' : 'Save'}
      </button>
      <button onClick={onCancel} className="text-white/30 text-xs hover:text-white/50">Cancel</button>
    </div>
  )
}


// ═══ SECTION 5 — Main component ════════════════════════════════════════════════

export default function GiftEntitlementAssigner({
  capsuleId,
  credentialId,
  guestName,
  readOnly = false,
  manifestItems = [],
}: GiftEntitlementAssignerProps) {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editTarget,   setEditTarget]   = useState<Entitlement | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Entitlement | null>(null)
  const [saving,       setSaving]       = useState(false)


  // ── Load entitlements ───────────────────────────────────────────────────────
  const loadEntitlements = useCallback(async () => {
    try {
      setLoading(true)
      const res  = await fetch(
        `/api/gift/entitlements?capsule_id=${capsuleId}&credential_id=${credentialId}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setEntitlements(data.entitlements ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [capsuleId, credentialId])

  useEffect(() => { loadEntitlements() }, [loadEntitlements])


  // ── Add entitlement ─────────────────────────────────────────────────────────
  async function handleAdd(itemId: string, qty: number) {
    try {
      setSaving(true)
      const res  = await fetch('/api/gift/entitlements', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          capsule_id:        capsuleId,
          credential_id:     credentialId,
          manifest_item_id:  itemId,
          quantity_entitled: qty,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add')
      setEntitlements(prev => [...prev, json.entitlement])
      setShowAdd(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }


  // ── Edit entitlement ────────────────────────────────────────────────────────
  async function handleEdit(qty: number) {
    if (!editTarget) return
    try {
      setSaving(true)
      const res  = await fetch(`/api/gift/entitlements/${editTarget.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ quantity_entitled: qty }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update')
      setEntitlements(prev => prev.map(e => e.id === editTarget.id ? json.entitlement : e))
      setEditTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }


  // ── Revoke entitlement ──────────────────────────────────────────────────────
  async function handleRevoke() {
    if (!revokeTarget) return
    try {
      setSaving(true)
      const res = await fetch(`/api/gift/entitlements/${revokeTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to revoke')
      }
      setEntitlements(prev => prev.filter(e => e.id !== revokeTarget.id))
      setRevokeTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }


  // ── Render ──────────────────────────────────────────────────────────────────
  const existingItemIds = new Set(entitlements.map(e => e.manifest_item_id))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#E2C36B]/20 border-t-[#E2C36B] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-red-400 text-sm py-4 text-center">{error}</p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium text-sm">{guestName}</h3>
          <p className="text-white/40 text-xs mt-0.5">
            {entitlements.length === 0
              ? 'No items assigned yet'
              : `${entitlements.length} item type${entitlements.length !== 1 ? 's' : ''} assigned`}
          </p>
        </div>
        {!readOnly && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs px-3 py-1.5 border border-[#E2C36B]/30 text-[#E2C36B] rounded-lg
                       hover:bg-[#E2C36B]/10 transition-colors"
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <AddEntitlementForm
          manifestItems={manifestItems}
          existingItemIds={existingItemIds}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={saving}
        />
      )}

      {/* Revoke confirm */}
      {revokeTarget && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
          <p className="text-white text-sm">
            Revoke <strong>{revokeTarget.gift_manifest_items.item_name}</strong> ×{revokeTarget.quantity_entitled}?
            This will release the allocation back to unallocated stock.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRevoke}
              disabled={saving}
              className="flex-1 py-2 bg-red-500/80 text-white text-sm rounded-lg hover:bg-red-500
                         disabled:opacity-40 transition-colors"
            >
              {saving ? 'Revoking…' : 'Revoke'}
            </button>
            <button
              onClick={() => setRevokeTarget(null)}
              className="flex-1 py-2 border border-white/10 text-white/60 text-sm rounded-lg hover:text-white/80"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {entitlements.length === 0 && !showAdd && (
        <div className="py-8 text-center text-white/30 text-sm">
          No gift items assigned to this guest yet.
        </div>
      )}

      {/* Entitlement list */}
      {entitlements.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/5 px-4 divide-y divide-white/5">
          {entitlements.map(ent =>
            editTarget?.id === ent.id ? (
              <EditQtyForm
                key={ent.id}
                ent={ent}
                onSave={handleEdit}
                onCancel={() => setEditTarget(null)}
                saving={saving}
              />
            ) : (
              <EntitlementRow
                key={ent.id}
                ent={ent}
                readOnly={readOnly}
                onEdit={setEditTarget}
                onRevoke={setRevokeTarget}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}
