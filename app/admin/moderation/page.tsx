'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ModerationPage() {
  const [items, setItems] = useState<any[]>([])
  const [acting, setActing] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await client
      .from('contributions')
      .select('id, capsule_id, contributor_name, tribute_text, created_at, city, country')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true })
    if (data) setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  const act = async (id: string, action: 'approve' | 'remove', reason: string) => {
    setActing(id)
    await fetch(`/api/admin/moderation/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reason }),
    })
    flash(action === 'approve' ? 'Contribution approved' : 'Contribution removed')
    await load()
    setActing(null)
  }

  return (
    <div className="space-y-6 max-w-3xl">

      <div>
        <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
          Content Moderation
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          Platform-level escalations only.
          {items.length > 0
            ? ` ${items.length} pending.`
            : ' Queue is clear.'}
        </p>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-lg border border-yellow-400/30 bg-yellow-400/8 text-yellow-200 text-sm">
          {msg}
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-white/8 bg-white/4 p-12 text-center">
          <p className="text-white/25 text-sm">No escalated content — queue is clear.</p>
          <p className="text-white/15 text-xs mt-1">
            Per-capsule moderation is handled by organisers at /manage/[slug]
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/8 bg-white/4 p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-white/90">
                  {item.contributor_name}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {item.city}{item.country ? ` · ${item.country}` : ''}
                  {' · '}
                  {new Date(item.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <p className="text-[10px] text-white/20 font-mono truncate max-w-[120px]">
                capsule: {item.capsule_id?.slice(0, 8)}...
              </p>
            </div>

            <p className="text-sm text-white/65 leading-relaxed">
              {item.tribute_text}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => act(item.id, 'approve', 'Admin moderation approval')}
                disabled={acting === item.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 border
                  border-green-400/25 text-green-300 hover:bg-green-500/25
                  disabled:opacity-50 transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => act(item.id, 'remove', 'Admin moderation removal')}
                disabled={acting === item.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 border
                  border-red-400/25 text-red-300 hover:bg-red-500/25
                  disabled:opacity-50 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
