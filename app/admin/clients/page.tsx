import { getClients } from '@/lib/admin/queries'
import Link from 'next/link'

const STATE_COLORS: Record<string, string> = {
  active:               'text-green-300 bg-green-400/10 border-green-400/20',
  pending_verification: 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  suspended:            'text-red-300 bg-red-400/10 border-red-400/20',
  expired:              'text-orange-300 bg-orange-400/10 border-orange-400/20',
}

const TIER_LABELS: Record<string, string> = {
  free:    'Free',
  honour:  'Honour',
  premier: 'Premier',
}

export default async function ClientsPage() {
  const { data: capsules } = await getClients()

  // Group by organiser_email to show unique clients
  const clientMap = new Map<string, { email: string; capsules: any[] }>()
  for (const c of capsules ?? []) {
    if (!c.organiser_email) continue
    if (!clientMap.has(c.organiser_email)) {
      clientMap.set(c.organiser_email, { email: c.organiser_email, capsules: [] })
    }
    clientMap.get(c.organiser_email)!.capsules.push(c)
  }
  const clients = Array.from(clientMap.values()).sort(
    (a, b) => b.capsules.length - a.capsules.length
  )

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
          Clients
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          {clients.length} unique organiser{clients.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-2">
        {clients.length === 0 && (
          <p className="text-white/25 text-sm text-center py-16">
            No clients yet.
          </p>
        )}
        {clients.map(({ email, capsules: caps }) => (
          <div
            key={email}
            className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 space-y-2"
          >
            {/* Client header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/90">{email}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {caps.length} capsule{caps.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-[10px] text-yellow-400/50 uppercase tracking-widest">
                {caps.some((c) => c.tier === 'premier')
                  ? 'Premier'
                  : caps.some((c) => c.tier === 'honour')
                  ? 'Honour'
                  : 'Free'}
              </span>
            </div>

            {/* Capsule list for this client */}
            <div className="space-y-1 pt-1 border-t border-white/6">
              {caps.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/admin/capsules/${c.id}`}
                  className="flex items-center justify-between py-1 px-2 rounded-lg
                    hover:bg-white/5 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="text-xs text-white/70 truncate">
                      {c.honouree_name}
                    </p>
                    <p className="text-[10px] text-white/25 hidden lg:block">
                      /{c.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] text-white/30">
                      {TIER_LABELS[c.tier] ?? c.tier}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-widest
                        ${STATE_COLORS[c.page_state] ?? 'text-white/30 bg-white/5 border-white/10'}`}
                    >
                      {c.page_state?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-white/15 group-hover:text-yellow-400/40 text-xs">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
