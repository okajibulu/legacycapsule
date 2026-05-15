"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface PricingRow {
  key:          string
  label:        string
  eur_price:    number
  ngn_price:    number
  safe_min_eur: number
  safe_max_eur: number
}

export default function PricingPage() {
  const [rows,    setRows]    = useState<PricingRow[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [eurVal,  setEurVal]  = useState("")
  const [ngnVal,  setNgnVal]  = useState("")
  const [reason,  setReason]  = useState("")
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState("")
  const [authed,  setAuthed]  = useState(false)
  const [password, setPassword] = useState("")

  // ── AUTH ─────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("lcadmin_authed")
    if (saved === "yes") setAuthed(true)
  }, [])

  const handleLogin = () => {
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123")) {
      localStorage.setItem("lcadmin_authed", "yes")
      setAuthed(true)
    } else {
      setMsg("Incorrect password")
    }
  }

  // ── LOAD PRICES ──────────────────────────────────────────
  useEffect(() => {
    if (!authed) return
    supabase.from("lc_pricing").select("*").order("label")
      .then(({ data }) => { if (data) setRows(data) })
  }, [authed])

  const startEdit = (row: PricingRow) => {
    setEditing(row.key)
    setEurVal(String(row.eur_price))
    setNgnVal(String(row.ngn_price))
    setReason("")
  }

  const cancelEdit = () => {
    setEditing(null)
    setEurVal("")
    setNgnVal("")
    setReason("")
  }

  const savePrice = async (row: PricingRow) => {
    if (!reason.trim()) {
      setMsg("Reason is required")
      return
    }
    const eur = parseFloat(eurVal)
    const ngn = parseFloat(ngnVal)
    if (isNaN(eur) || isNaN(ngn)) {
      setMsg("Enter valid numbers")
      return
    }
    if (eur < row.safe_min_eur || eur > row.safe_max_eur) {
      const proceed = confirm(
        `€${eur} is outside safe range €${row.safe_min_eur}–€${row.safe_max_eur}. Proceed anyway?`
      )
      if (!proceed) return
    }
    setSaving(true)

    // Write audit log
    await supabase.from("admin_audit_log").insert({
      module:     "LCAdmin",
      action:     "price_updated",
      record_id:  row.key,
      prev_state: { eur_price: row.eur_price, ngn_price: row.ngn_price },
      next_state: { eur_price: eur, ngn_price: ngn },
      reason,
    })

    // Update price
    await supabase.from("lc_pricing")
      .update({
        eur_price:  eur,
        ngn_price:  ngn,
        updated_at: new Date().toISOString(),
      })
      .eq("key", row.key)

    // Reload
    const { data } = await supabase
      .from("lc_pricing").select("*").order("label")
    if (data) setRows(data)

    setSaving(false)
    setEditing(null)
    setMsg(`✓ ${row.label} updated`)
    setTimeout(() => setMsg(""), 3000)
  }

  // ── LOGIN SCREEN ─────────────────────────────────────────
  if (!authed) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0010]">
      <div className="w-full max-w-sm space-y-4 p-8 rounded-2xl
        border border-yellow-400/20 bg-white/5">
        <h1 className="text-xl font-bold text-yellow-100 text-center tracking-widest uppercase">
          LCAdmin
        </h1>
        <p className="text-xs text-white/40 text-center">Pricing Configuration</p>
<input type="number" value={eurVal}
  onChange={e => setEurVal(e.target.value)}
  style={{
    width: "100%",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(234,179,8,0.3)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    fontSize: "14px",
    outline: "none",
    WebkitTextFillColor: "white",
    WebkitBoxShadow: "0 0 0px 1000px rgba(26,13,46,0.95) inset",
  }}
/>
        {msg && <p className="text-xs text-red-400 text-center">{msg}</p>}
        <button onClick={handleLogin}
          className="w-full py-2 rounded-lg bg-gradient-to-b from-yellow-400 to-yellow-500
            text-purple-950 font-bold text-sm hover:from-yellow-300 transition-all">
          Enter
        </button>
      </div>
    </main>
  )

  // ── PRICING SCREEN ───────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0a0010] px-4 py-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-yellow-100 tracking-wide">
            Pricing Configuration
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            All changes logged. Reason required. Safe ranges shown.
          </p>
        </div>
        <a href="/admin/flags"
          className="text-xs text-white/30 hover:text-yellow-300 transition-colors">
          Feature Flags →
        </a>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-lg border border-yellow-400/30
          bg-yellow-400/8 text-yellow-200 text-sm text-center">
          {msg}
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key}
            className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 space-y-2">

            {/* ROW HEADER */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90">{row.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  Safe range: €{row.safe_min_eur} – €{row.safe_max_eur}
                </p>
              </div>
              {editing !== row.key && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-300">€{row.eur_price}</p>
                    <p className="text-[10px] text-white/40">
                      ₦{row.ngn_price.toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => startEdit(row)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-yellow-400/25
                      text-yellow-300/70 hover:border-yellow-400/50 hover:text-yellow-200
                      transition-all duration-150">
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* EDIT FORM */}
            {editing === row.key && (
              <div className="space-y-2 pt-2 border-t border-white/8">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">
                      EUR Price
                    </label>
                    <input type="number" value={eurVal}
                      onChange={e => setEurVal(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg bg-white/8
                        border border-yellow-400/30 text-white text-sm
                        focus:outline-none focus:border-yellow-300 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">
                      NGN Price
                    </label>
                    <input type="number" value={ngnVal}
                      onChange={e => setNgnVal(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg bg-white/8
                        border border-yellow-400/30 text-white text-sm
                        focus:outline-none focus:border-yellow-300 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-widest">
                    Reason for change (required)
                  </label>
                  <input type="text" value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Q3 2026 pricing review"
                    className="mt-1 w-full px-3 py-1.5 rounded-lg bg-white/8
                      border border-white/15 text-white text-sm
                      placeholder:text-white/25 focus:outline-none
                      focus:border-yellow-300 transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-2 pb-1">
                  <button onClick={() => savePrice(row)} disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-b
                      from-yellow-400 to-yellow-500 text-purple-950 font-bold
                      text-sm disabled:opacity-50 hover:from-yellow-300
                      hover:to-yellow-400 transition-all">
                    {saving ? "Saving…" : "Save"}
                  </button>
                 <button onClick={cancelEdit}
  className="px-4 py-1.5 rounded-lg border border-red-400/30
    text-red-300/70 text-sm hover:text-red-300 hover:border-red-400/60
    transition-all">
  Cancel
</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SIGN OUT */}
      <div className="pt-4 border-t border-white/8">
        <button
          onClick={() => {
            localStorage.removeItem("lcadmin_authed")
            setAuthed(false)
          }}
          className="text-xs text-white/30 hover:text-red-400/70 transition-colors">
          Sign out
        </button>
      </div>

    </main>
  )
}
