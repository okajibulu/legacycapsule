import { getResellerSummary } from '@/lib/admin/queries'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ResellersPage() {
  const { data } = await getResellerSummary()

  // Aggregate by reseller code
  const codeMap = new Map<string, { count: number; capsuleIds: string[] }>()
  for (const row of data ?? []) {
    if (!row.reseller_code) continue
    const existing = codeMap.get(row.reseller_code)
    if (existing) {
      existing.count++
      existing.capsuleIds.push(row.id)
    } else {
      codeMap.set(row.reseller_code, { count: 1, capsuleIds: [row.id] })
    }
  }

  // Get revenue per reseller code
  const resellers = await Promise.all(
    Array.from(codeMap.entries()).map(async ([code, { count, capsuleIds }]) => {
      const { data: payments } = await adminClient
        .from('payments')
        .select('amount')
        .eq('reseller_code', code)
        .eq('status', 'succeeded')
      const revenue = (payments ?? []).reduce(
        (s: number, p: { amount: number }) => s + Number(p.amount),
        0
      )
      return { code, count, revenue }
    })
  )

  resellers.sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
          Resellers
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          {resellers.length} active reseller code{resellers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {resellers.length === 0 && (
        <div className="rounded-xl border border-white/8 bg-white/4 p-12 text-center">
          <p className="text-white/25 text-sm">No resellers active yet.</p>
          <p className="text-white/15 text-xs mt-1">
            Reseller codes appear here automatically when used during capsule creation.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {resellers.map(({ code, count, revenue }) => (
          <div
            key={code}
            className="flex items-center justify-between px-4 py-3 rounded-xl
              border border-white/8 bg-white/4"
          >
            <div>
              <p className="text-sm font-mono text-yellow-300">{code}</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {count} attributed capsule{count !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                €{revenue.toFixed(2)}
              </p>
              <p className="text-[10px] text-white/25">attributed revenue</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}