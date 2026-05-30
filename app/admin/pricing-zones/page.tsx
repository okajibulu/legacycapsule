'use client'

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface PricingZone {
  id: string
  zone_name: string
  currency_code: string
  currency_symbol: string
  multiplier: number
  countries: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONE METADATA
// Display labels and notes per zone — driven by zone_name from DB
// ─────────────────────────────────────────────────────────────────────────────
const ZONE_META: Record<string, { flag: string; note: string }> = {
  EU:  { flag: '🇪🇺', note: 'Base zone — multiplier 1.00' },
  UK:  { flag: '🇬🇧', note: 'GBP — Sterling pricing' },
  US:  { flag: '🇺🇸', note: 'USD — Dollar pricing' },
  CA:  { flag: '🇨🇦', note: 'CAD — Canadian dollar' },
  NG:  { flag: '🇳🇬', note: 'NGN — Independent pricing, not multiplier-based' },
  GH:  { flag: '🇬🇭', note: 'USD — West Africa bloc, 0.60 multiplier' },
  KE:  { flag: '🇰🇪', note: 'KES — East Africa bloc, 130x multiplier' },
  ROW: { flag: '🌍', note: 'EUR — Rest of World fallback, 1.00 multiplier' },
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PricingZonesPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [zones, setZones] = useState<PricingZone[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editMultiplier, setEditMultiplier] = useState('')
  const [editSymbol, setEditSymbol] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  // ── Load pricing zones ─────────────────────────────────────────────────────
  const load = async () => {
    const { data } = await supabase
      .from('lc_pricing_zones')
      .select('id, zone_name, currency_code, currency_symbol, multiplier, countries')
      .order('zone_name')
    if (data) setZones(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  // ── Flash message ──────────────────────────────────────────────────────────
  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3500)
  }

  // ── Start editing a zone ───────────────────────────────────────────────────
  const startEdit = (zone: PricingZone) => {
    setEditing(zone.id)
    setEditMultiplier(String(zone.multiplier))
    setEditSymbol(zone.currency_symbol)
    setReason('')
  }

  // ── Cancel edit ───────────────────────────────────────────────────────────
  const cancelEdit = () => {
    setEditing(null)
    setEditMultiplier('')
    setEditSymbol('')
    setReason('')
  }

  // ── Save zone changes ──────────────────────────────────────────────────────
  const saveZone = async (zone: PricingZone) => {
    if (!reason.trim()) {
      flash('Reason is required')
      return
    }
    const multiplier = parseFloat(editMultiplier)
    if (isNaN(multiplier) || multiplier <= 0) {
      flash('Enter a valid multiplier (must be greater than 0)')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/pricing-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: zone.id,
        multiplier,
        currency_symbol: editSymbol.trim(),
        reason,
      }),
    })
    if (res.ok) {
      flash(`Zone ${zone.zone_name} updated`)
      cancelEdit()
      await load()
    } else {
      flash('Save failed — check console')
    }
    setSaving(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <p className="text-white/30 text-sm text-center py-16">
        Loading pricing zones...
      </p>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
          Pricing Zones
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          Edit regional multipliers and currency symbols. Country arrays are read-only —
          contact engineering to reassign countries between zones.
          All changes are audit-logged.
        </p>
      </div>

      {/* Flash message */}
      {msg && (
        <div className="px-4 py-2 rounded-lg border border-yellow-400/30
          bg-yellow-400/8 text-yellow-200 text-sm">
          {msg}
        </div>
      )}

      {/* Zone list */}
      <div className="space-y-3">
        {zones.map((zone) => {
          const meta = ZONE_META[zone.zone_name] ?? { flag: '🌐', note: '' }
          const isEditing = editing === zone.id

          return (
            <div
              key={zone.id}
              className="rounded-xl border border-white/8 bg-white/4 px-5 py-4 space-y-3"
            >
              {/* ── Zone header row ─────────────────────────────────────── */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-100">
                      {zone.zone_name}
                      <span className="ml-2 text-white/40 font-normal text-xs">
                        {zone.currency_code}
                      </span>
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">{meta.note}</p>
                  </div>
                </div>

                {/* Current values + edit button */}
                {!isEditing && (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {zone.currency_symbol}
                      </p>
                      <p className="text-[10px] text-white/35">
                        ×{zone.multiplier}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(zone)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-yellow-400/20
                        text-yellow-300/60 hover:text-yellow-200 hover:border-yellow-400/40
                        transition-all"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* ── Country array (read-only) ────────────────────────────── */}
              {zone.countries && zone.countries.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {zone.countries.map((code: string) => (
                    <span
                      key={code}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white/6
                        border border-white/8 text-white/30 font-mono"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Edit form (visible when this zone is being edited) ───── */}
              {isEditing && (
                <div className="space-y-3 pt-3 border-t border-white/8">

                  {/* Multiplier + symbol inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-white/35 uppercase tracking-widest">
                        Multiplier
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editMultiplier}
                        onChange={(e) => setEditMultiplier(e.target.value)}
                        className="mt-1 w-full px-3 py-1.5 rounded-lg bg-white/8 border border-yellow-400/25
                          text-white text-sm focus:outline-none focus:border-yellow-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/35 uppercase tracking-widest">
                        Currency Symbol
                      </label>
                      <input
                        type="text"
                        value={editSymbol}
                        onChange={(e) => setEditSymbol(e.target.value)}
                        className="mt-1 w-full px-3 py-1.5 rounded-lg bg-white/8 border border-yellow-400/25
                          text-white text-sm focus:outline-none focus:border-yellow-300 transition-all"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-[10px] text-white/35 uppercase tracking-widest">
                      Reason for change (required)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 2026 regional pricing review"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg bg-white/8 border border-white/15
                        text-white text-sm placeholder:text-white/20
                        focus:outline-none focus:border-yellow-300 transition-all"
                    />
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveZone(zone)}
                      disabled={saving}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-b from-yellow-400 to-yellow-500
                        text-purple-950 font-bold text-sm hover:from-yellow-300 hover:to-yellow-400
                        disabled:opacity-50 transition-all"
                    >
                      {saving ? 'Saving...' : 'Save Zone'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-1.5 rounded-lg border border-white/15
                        text-white/40 text-sm hover:text-white/60 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
