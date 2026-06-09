/**
 * ============================================================
 * FILE PATH: components/manage/TableManagementSection.tsx
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * Table Management — inline component for Services tab
 *
 * Sub-sections:
 *   1. Types & style constants
 *   2. TableRow — display table with occupancy
 *   3. AddTableForm — create table
 *   4. Main component
 * ============================================================
 */

'use client'

// ============================================================
// SECTION 1 — Types & style constants
// ============================================================

import { useState, useEffect, useCallback } from 'react'

interface Table {
  id: string; name: string; capacity: number
  tier_designation: string | null; guest_count: number
}

interface Props { capsuleId: string; onTablesChange?: (tables: Table[]) => void }

const gold = '#E2C36B'
const goldMuted = 'rgba(226,195,107,0.55)'
const goldFaint = 'rgba(226,195,107,0.12)'
const cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.28)'

const inp: React.CSSProperties = {
  width: '100%', fontSize: '13px', padding: '10px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(226,195,107,0.18)',
  color: textPrimary, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
}

// ============================================================
// SECTION 2 — TableRow
// ============================================================

function TableRow({ table, onDelete }: { table: Table; onDelete: (id: string) => void }) {
  const pct = table.capacity > 0 ? Math.round((table.guest_count / table.capacity) * 100) : 0
  const isFull = table.guest_count >= table.capacity

  return (
    <div style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${isFull ? 'rgba(74,222,128,0.2)' : cardBorder}`, background: cardBg, marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0 }}>{table.name}</p>
          {table.tier_designation && <p style={{ fontSize: '10px', color: goldMuted, margin: '2px 0 0' }}>{table.tier_designation}</p>}
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: isFull ? 'rgba(134,239,172,0.8)' : gold }}>
          {table.guest_count}/{table.capacity}
        </span>
      </div>
      {/* Occupancy bar */}
      <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', marginBottom: '8px' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: isFull ? 'rgba(74,222,128,0.5)' : `linear-gradient(to right, ${goldMuted}, ${gold})`, borderRadius: '2px' }} />
      </div>
      <button onClick={() => onDelete(table.id)} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}>Remove</button>
    </div>
  )
}

// ============================================================
// SECTION 3 — AddTableForm
// ============================================================

function AddTableForm({ capsuleId, onAdded, onCancel }: {
  capsuleId: string; onAdded: () => void; onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('10')
  const [tierDes, setTierDes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !capacity) return
    setSaving(true)
    await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsule_id: capsuleId, name: name.trim(), capacity: parseInt(capacity), tier_designation: tierDes.trim() || undefined }),
    })
    setSaving(false); onAdded()
  }

  return (
    <div style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: cardBg, marginBottom: '10px' }}>
      <p style={{ fontSize: '11px', color: goldMuted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>New Table</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input style={inp} placeholder="Table name (e.g. Table 1, High Table, VIP Corner) *" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="number" style={{ ...inp, flex: 1 }} placeholder="Capacity *" value={capacity} onChange={e => setCapacity(e.target.value)} min="1" max="500" />
          <input style={{ ...inp, flex: 1 }} placeholder="Tier (e.g. VVIP, VIP)" value={tierDes} onChange={e => setTierDes(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{ padding: '8px 20px', borderRadius: '8px', background: `linear-gradient(135deg, ${gold}, ${goldMuted})`, color: '#1a0845', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Adding…' : 'Add Table'}
          </button>
          <button onClick={onCancel} style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${cardBorder}`, color: textFaint, fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 4 — Main component
// ============================================================

export default function TableManagementSection({ capsuleId, onTablesChange }: Props) {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const fetchTables = useCallback(async () => {
    const res = await fetch(`/api/tables?capsule_id=${capsuleId}`)
    const data = await res.json()
    const t = data.tables ?? []
    setTables(t)
    onTablesChange?.(t)
    setLoading(false)
  }, [capsuleId, onTablesChange])

  useEffect(() => { fetchTables() }, [fetchTables])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this table? Guests assigned to it will be unassigned.')) return
    await fetch(`/api/tables?id=${id}`, { method: 'DELETE' })
    fetchTables()
  }

  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0)
  const totalSeated = tables.reduce((s, t) => s + t.guest_count, 0)

  return (
    <div>
      <p style={{ fontSize: '12px', color: textFaint, lineHeight: 1.65, marginBottom: '14px' }}>
        Define your seating layout. Assign guests to tables from the Guest Management section.
      </p>

      {tables.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1, padding: '10px', borderRadius: '10px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' as const }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>{tables.length}</div>
            <div style={{ fontSize: '8px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Tables</div>
          </div>
          <div style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(226,195,107,0.07)', border: '1px solid rgba(226,195,107,0.18)', textAlign: 'center' as const }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: gold, fontFamily: "'Playfair Display', serif" }}>{totalCapacity}</div>
            <div style={{ fontSize: '8px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Seats</div>
          </div>
          <div style={{ flex: 1, padding: '10px', borderRadius: '10px', background: cardBg, border: `1px solid ${cardBorder}`, textAlign: 'center' as const }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, fontFamily: "'Playfair Display', serif" }}>{totalSeated}</div>
            <div style={{ fontSize: '8px', color: textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Assigned</div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: '12px', color: textFaint, textAlign: 'center', padding: '16px 0' }}>Loading tables…</p>
      ) : (
        <>
          {tables.map(t => <TableRow key={t.id} table={t} onDelete={handleDelete} />)}

          {adding ? (
            <AddTableForm capsuleId={capsuleId} onAdded={() => { setAdding(false); fetchTables() }} onCancel={() => setAdding(false)} />
          ) : (
            <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed rgba(226,195,107,0.2)`, background: 'transparent', color: goldMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
              + Add Table
            </button>
          )}
        </>
      )}
    </div>
  )
}
