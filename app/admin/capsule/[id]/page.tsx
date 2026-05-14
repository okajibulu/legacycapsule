'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATE_COLORS: Record<string, string> = {
  active:               'text-green-300 bg-green-400/10 border-green-400/20',
  pending_verification: 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  pending_payment:      'text-yellow-300 bg-yellow-400/10 border-yellow-400/20',
  suspended:            'text-red-300 bg-red-400/10 border-red-400/20',
  expired:              'text-orange-300 bg-orange-400/10 border-orange-400/20',
}

export default function CapsuleDetailPage() {
  const { id } = useParams()
  const [capsule, setCapsule] = useState<any>(null)
  const [contributions, setContributions] = useState<any[]>([])
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [extendDate, setExtendDate] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')

  const load = async () => {
    const [{ data: cap }, { data: contribs }] = await Promise.all([
      client.from('capsules').select('*').eq('id', id).single(),
      client
        .from('contributions')
        .select('id, contributor_name, tribute_text, status, created_at, city, country')
        .eq('capsule_id', id)
        .order('created_at', { ascending: false }),
    ])
    if (cap) setCapsule(cap)
    if (contribs) setContributions(contribs)
  }

  useEffect(() => {
    load()
  }, [id])

  const flash = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  const doAction = async (action: string, body: object) => {
    if (!reason.trim()) {
      flash('Reason is required for all actions', 'err')
      return
    }
    const res = await fetch(`/api/admin/capsule/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reason, ...body }),
    })
    if (res.ok) {
      flash('Action complete')
      load()
    } else {
      flash('Action failed', 'err')
    }
  }

  const saveNote = async () => {
    if (!note.trim()) return
    const res = await fetch('/api/admin/capsule/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, note }),
    })
    if (res.ok) {
      flash('Note saved to audit log')
      setNote('')
    }
  }

  if (!capsule) {
    return <p className="text-white/30 text-sm text-center py-16">Loading...</p>
  }

  return (
    <div className="max-w-3xl space-y-6">

      <Link
        href="/admin/capsules"
        className="text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        Back to Capsules
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-yellow-100">
            {capsule.honouree_name}
          </h1>
          <p className="text-xs text-white/35 mt-0.5">
            /{capsule.slug}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest ${STATE_COLORS[capsule.page_state] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
          {capsule.page_state?.replace(/_/g, ' ')}
        </span>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg border text-sm ${msgType === 'ok' ? 'border-yellow-400/30 bg-yellow-400/8 text-yellow-200' : 'border-red-400/30 bg-red-400/8 text-red-300'}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {([
          ['Organiser Email', capsule.organiser_email],
          ['Tier', capsule.tier],
          ['State', capsule.page_state],
          ['Created', new Date(capsule.created_at).toLocaleDateString('en-GB')],
          ['Event Date', capsule.event_date ?? '—'],
          ['Expires', capsule.free_tier_expires_at ? new Date(capsule.free_tier_expires_at).toLocaleDateString('en-GB') : '—'],
          ['Reseller Code', capsule.reseller_code ?? 'None'],
          ['Pricing Key', capsule.pricing_key ?? '—'],
        ] as [string, string][]).map(([label, val]) => (
          <div key={label} className="px-3 py-2 rounded-lg bg-white/4 border border-white/8">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">{label}</p>
            <p className="text-sm text-white/75 mt-0.5 truncate">{val}</p>
          </div>
        ))}
      </div>

      <Link
        href={`/capsule/${capsule.slug}`}
        target="_blank"
        className="inline-flex items-center gap-2 text-xs text-yellow-400/60 hover:text-yellow-300 transition-colors"
      >
        View live capsule
      </Link>

      <div className="space-y-3 border border-white/8 rounded-xl p-4">
        <p className="text-[10px] text-white/30 uppercase tracking-widest">Admin Actions</p>

        <input
          type="text"
          placeholder="Reason required for all state-change actions"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-white/8 border border-white/15 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-yellow-300 transition-all"
        />

        <div className="flex flex-wrap gap-2">
          {([
            { label: 'Suspend',     action: 'suspend',   danger: true,  extra: {} },
            { label: 'Unsuspend',   action: 'unsuspend', danger: false, extra: {} },
            { label: 'Set Active',  action: 'state',     danger: false, extra: { state: 'active' } },
            { label: 'Set Expired', action: 'state',     danger: true,  extra: { state: 'expired' } },
          ] as { label: string; action: string; danger: boolean; extra: object }[]).map(({ label, action, danger, extra }) => (
            <button
              key={label}
              onClick={() => doAction(action, extra)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${danger ? 'bg-red-500/15 border border-red-400/25 text-red-300 hover:bg-red-500/25' : 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 hover:bg-yellow-400/18'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-white/8 space-y-2">
          <p className="text-[10px] text-white/25 uppercase tracking-widest">Extend Free Tier Expiry</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/8 border border-white/15 text-white text-sm focus:outline-none focus:border-yellow-300 transition-all"
            />
            <button
              onClick={() => { if (extendDate) doAction('extend', { newDate: extendDate }) }}
              className="px-3 py-1.5 rounded-lg border border-yellow-400/20 text-yellow-300 text-sm hover:bg-yellow-400/10 transition-all"
            >
              Extend
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-white/8 space-y-2">
          <p className="text-[10px] text-white/25 uppercase tracking-widest">Internal Note</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add note to audit log..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/8 border border-white/15 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-yellow-300 transition-all"
            />
            <button
              onClick={saveNote}
              className="px-3 py-1.5 rounded-lg border border-white/15 text-white/50 text-sm hover:text-white/70 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] text-white/30 uppercase tracking-widest">
          Contributions ({contributions.length})
        </p>
        {contributions.length === 0 && (
          <p className="text-white/25 text-sm text-center py-8">No contributions yet.</p>
        )}
        {contributions.map((c: any) => (
          <div key={c.id} className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 space-y-1">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-white/85">{c.contributor_name}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest ${c.status === 'approved' ? 'text-green-300 bg-green-400/10 border-green-400/20' : c.status === 'declined' ? 'text-red-300 bg-red-400/10 border-red-400/20' : 'text-white/40 bg-white/5 border-white/10'}`}>
                  {c.status}
                </span>
                <span className="text-[10px] text-white/25">
                  {new Date(c.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-white/35">{c.city}{c.country ? ` · ${c.country}` : ''}</p>
            <p className="text-sm text-white/60 leading-relaxed line-clamp-3">{c.tribute_text}</p>
          </div>
        ))}
      </div>

    </div>
  )
}