"use client"

import { use } from "react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const [capsule,       setCapsule]       = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])
  const [authed,        setAuthed]        = useState(false)
  const [password,      setPassword]      = useState("")
  const [msg,           setMsg]           = useState("")

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

  // ── LOAD DATA ────────────────────────────────────────────
  useEffect(() => {
    if (!authed || !slug) return
    loadData()
  }, [authed, slug])

  const loadData = async () => {
    const { data: cap } = await supabase
      .from("capsules")
      .select("*")
      .eq("slug", slug)
      .single()

    if (cap) {
      setCapsule(cap)
      const { data: contribs } = await supabase
        .from("contributions")
        .select("*")
        .eq("capsule_id", cap.id)
        .order("created_at", { ascending: false })
      if (contribs) setContributions(contribs)
    }
  }

  // ── APPROVE ──────────────────────────────────────────────
  const approve = async (id: string) => {
    const contribution = contributions.find(c => c.id === id)

    await supabase
      .from("contributions")
      .update({ status: "approved" })
      .eq("id", id)

    if (contribution?.email) {
      await fetch("/api/email/approval", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:              contribution.email,
          contributorName: contribution.name,
          honoreeName:     capsule.honouree_name,
          capsuleSlug:     slug,
        }),
      })
    }

    setMsg("✓ Approved — email sent")
    setTimeout(() => setMsg(""), 2000)
    loadData()
  }

  // ── DECLINE ──────────────────────────────────────────────
  const decline = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ status: "declined" })
      .eq("id", id)
    setMsg("✓ Declined")
    setTimeout(() => setMsg(""), 2000)
    loadData()
  }

  const pending  = contributions.filter(c => c.status === "pending_review")
  const approved = contributions.filter(c => c.status === "approved")
  const declined = contributions.filter(c => c.status === "declined")

  // ── LOGIN SCREEN ─────────────────────────────────────────
  if (!authed) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0010]">
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
        {msg && <p className="mt-4 text-red-600">{msg}</p>}
      </div>
    </main>
  )

  if (!capsule) return <div className="p-8">Loading...</div>

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">{capsule.honouree_name}</h1>
        <p className="text-gray-600 mb-8">Contributions: {contributions.length}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pending */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-yellow-600">
              Pending ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded shadow">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.message}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => approve(c.id)}
                      className="flex-1 bg-green-600 text-white py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decline(c.id)}
                      className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Approved */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-green-600">
              Approved ({approved.length})
            </h2>
            <div className="space-y-4">
              {approved.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded shadow">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Declined */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Declined ({declined.length})
            </h2>
            <div className="space-y-4">
              {declined.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded shadow">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-600">{c.message}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {msg && <p className="mt-8 text-center font-semibold">{msg}</p>}
      </div>
    </main>
  )
}