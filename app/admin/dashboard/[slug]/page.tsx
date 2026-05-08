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

  const [capsule, setCapsule] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])

  // LOAD CAPSULE
  useEffect(() => {
    if (!slug) return

    const loadCapsule = async () => {
      const { data } = await supabase
        .from("capsules")
        .select("*")
        .eq("slug", slug)
        .single()

      if (data) {
        setCapsule(data)
        loadContributions(data.id)
      }
    }

    loadCapsule()
  }, [slug])

  // LOAD ALL CONTRIBUTIONS
  const loadContributions = async (capsuleId: string) => {
    const { data } = await supabase
      .from("contributions")
      .select("*")
      .eq("capsule_id", capsuleId)
      .order("created_at", { ascending: false })

    if (data) setContributions(data)
  }

  // APPROVE CONTRIBUTION
  const handleApprove = async (id: string) => {
    await supabase
      .from("contributions")
      .update({ status: "approved" })
      .eq("id", id)

    if (capsule) {
      loadContributions(capsule.id)
    }
  }

  const pendingContributions = contributions.filter(
    (c) => c.status === "pending_review"
  )

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-2">
        Admin Dashboard
      </h1>

      <p className="text-yellow-400 mb-8">
        {capsule?.title || "Loading Capsule..."}
      </p>

      <div className="space-y-4">
        {pendingContributions.length === 0 && (
          <p className="text-white/50">
            No pending tributes.
          </p>
        )}

        {pendingContributions.map((c) => (
          <div
            key={c.id}
            className="border border-white/20 rounded-lg p-4 bg-white/5"
          >
            <div className="mb-2">
              <p className="font-semibold text-yellow-300">
                {c.name}
              </p>

              <p className="text-sm text-white/60">
                {c.email}
              </p>

              <p className="text-sm text-white/40">
                {[c.city, c.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            <p className="mb-4 whitespace-pre-wrap">
              {c.tribute_text}
            </p>

            <button
              onClick={() => handleApprove(c.id)}
              className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
            >
              Approve Tribute
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}