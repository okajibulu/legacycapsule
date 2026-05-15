import { getTransactions, getRevenueByPeriod } from '@/lib/admin/queries'

const STATUS_COLORS: Record<string, string> = {
  succeeded: 'text-green-300',
  pending:   'text-yellow-300',
  failed:    'text-red-400',
  refunded:  'text-orange-300',
}

export default async function TransactionsPage() {
  const [{ data: txns }, { data: rev30 }] = await Promise.all([
    getTransactions(),
    getRevenueByPeriod(30),
  ])

  const total30 = (rev30 ?? []).reduce(
    (s: number, p: { amount: number }) => s + Number(p.amount),
    0
  )

  const totalAll = (txns ?? [])
    .filter((t: any) => t.status === 'succeeded')
    .reduce((s: number, t: any) => s + Number(t.amount), 0)

  return (
    <div className="space-y-6 max-w-4xl">

      <div>
        <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
          Transactions
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          {txns?.length ?? 0} total records
        </p>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 space-y-1">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">
            30-Day Gross
          </p>
          <p className="text-2xl font-bold text-yellow-300">
            €{total30.toFixed(2)}
          </p>
          <p className="text-[10px] text-white/25">EUR · succeeded payments only</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/4 p-4 space-y-1">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">
            All-Time Gross
          </p>
          <p className="text-2xl font-bold text-white">
            €{totalAll.toFixed(2)}
          </p>
          <p className="text-[10px] text-white/25">EUR · succeeded payments only</p>
        </div>
      </div>

      {/* Empty state */}
      {(txns ?? []).length === 0 && (
        <div className="rounded-xl border border-white/8 bg-white/4 p-8 text-center space-y-2">
          <p className="text-white/30 text-sm">No transactions yet.</p>
          <p className="text-white/20 text-xs">
            Stripe integration active in Phase 1.5. Records will appear here once payments are processed.
          </p>
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-2">
        {(txns ?? []).map((t: any) => (
          <div
            key={t.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl
              border border-white/8 bg-white/4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">
                {t.package_tier ?? 'Unknown tier'}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {t.processor ?? 'Unknown processor'}
                {' · '}
                {new Date(t.created_at).toLocaleDateString('en-GB')}
                {t.reseller_code && (
                  <span className="ml-2 text-yellow-400/50">
                    Reseller: {t.reseller_code}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-yellow-300">
                {t.currency} {parseFloat(t.amount).toFixed(2)}
              </p>
              <p className={`text-[10px] mt-0.5 ${STATUS_COLORS[t.status] ?? 'text-white/30'}`}>
                {t.status}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
