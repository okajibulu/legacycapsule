"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface FlagRow {
  key:       string
  label:     string
  enabled:   boolean
  emergency: boolean
}

export default function FeatureFlagsPage() {
  const [flags,    setFlags]    = useState<FlagRow[]>([])
  const [saving,   setSaving]   = useState<string | null>(null)
  const [msg,      setMsg]      = useState("")
  const [authed,   setAuthed]   = useState(false)
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

  // ── LOAD FLAGS ───────────────────────────────────────────
  useEffect(() => {
    if (!authed) return
    supabase.from("lc_feature_flags").select("*").order("label")
      .then(({ data }) => { if (data) setFlags(data) })
  }, [authed])

  // ── TOGGLE ───────────────────────────────────────────────
  const toggle = async (flag: FlagRow) => {
    if (flag.emergency && flag.enabled) {
      const proceed = confirm(
        `Disabling "${flag.label}" is an emergency action. This affects live platform operations. Continue?`
      )
      if (!proceed) return
    }

    setSaving(flag.key)

    // Write audit log
    await supabase.from("admin_audit_log").insert({
      module:     "LCAdmin",
      action:     "feature_flag_toggled",
      record_id:  flag.key,
      prev_state: { enabled: flag.enabled },
      next_state: { enabled: !flag.enabled },
      reason:     "Admin toggle",
    })

    // Update flag
    await supabase.from("lc_feature_flags")
      .update({
        enabled:    !flag.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("key", flag.key)

    // Reload
    const { data } = await supabase
      .from("lc_feature_flags").select("*").order("label")
    if (data) setFlags(data)

    setSaving(null)
    setMsg(`✓ ${flag.label} ${!flag.enabled ? "enabled" : "disabled"}`)
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
        <p className="text-xs text-white/40 text-center">Feature Flags</p>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(234,179,8,0.4)",
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

  // ── FLAGS SCREEN ─────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0a0010] px-4 py-6 max-w-2xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-yellow-100 tracking-wide">
            Feature Flags
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            Toggle platform features without code deployment.
          </p>
        </div>
        <a href="/admin/pricing"
          className="text-xs text-white/30 hover:text-yellow-300 transition-colors">
          ← Pricing
        </a>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-lg border border-yellow-400/30
          bg-yellow-400/8 text-yellow-200 text-sm text-center">
          {msg}
        </div>
      )}

      <div className="space-y-2">
        {flags.map((flag) => (
          <div key={flag.key}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border
              transition-all duration-150
              ${flag.emergency
                ? "border-red-400/20 bg-red-400/4"
                : "border-white/8 bg-white/4"
              }`}>
            <div>
              <p className="text-sm text-white/90">{flag.label}</p>
              {flag.emergency && (
                <p className="text-[10px] text-red-400/70 mt-0.5 uppercase tracking-widest">
                  Emergency flag — affects live operations
                </p>
              )}
            </div>

            {/* TOGGLE */}
            <button
              onClick={() => toggle(flag)}
              disabled={saving === flag.key}
              style={{
                position:   "relative",
                width:      "44px",
                height:     "24px",
                borderRadius: "12px",
                border:     "none",
                cursor:     "pointer",
                background: flag.enabled
                  ? "rgba(234,179,8,0.9)"
                  : "rgba(255,255,255,0.15)",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span style={{
                position:   "absolute",
                top:        "3px",
                left:       flag.enabled ? "23px" : "3px",
                width:      "18px",
                height:     "18px",
                borderRadius: "50%",
                background: "white",
                transition: "left 0.2s",
                boxShadow:  "0 1px 3px rgba(0,0,0,0.3)",
              }} />
            </button>
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
