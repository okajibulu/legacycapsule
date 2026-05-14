import { getCapsules } from '@/lib/admin/queries'
import Link from 'next/link'

const STATE_COLORS: Record<string, string> = {
  active:               'text-green-300 bg-green-400/10 border-green-400/20',
  pending_verification: 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  pending_payment:      'text-yellow-300 bg-yellow-400/10 border-yellow-400/20',
  suspended:            'text-red-300 bg-red-400/10 border-red-400/20',
  expired:              'text-orange-300 bg-orange-400/10 border-orange-400/20',
  free:                 'text-white/40 bg-white/5 border-white/10',
}

const TIER_LABELS: Record<string, string> = {
  free:    'Free',
  honour:  'Honour',
  premier: 'Premier',
}

export default async function CapsulesPage({
  searchParams,
}: {
  searchParams: { state?: string; tier?: string }
}) {
  const { data: capsules } = await getCapsules({
    state: searchParams.state,
    tier: searchParams.tier,
  })

  const filterState = searchParams.state
  const filterTier = searchParams.tier

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
            Capsules
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {capsules?.length ?? 0} result{capsules?.length !== 1 ? 's' : ''}
            {filterState ? ` · filtered: ${filterState.replace(/_/g, ' ')}` : ''}
            {filterTier ? ` · tier: ${filterTier}` : ''}
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap justify-end">
          {[
            { label: 'All', state: undefined },
            { label: 'Active', state: 'active' },
            { label: 'Pending Verification', state: 'pending_verification' },
            { label: 'Suspended', state: 'suspended' },
          ].map(({ label, state }) => (
            <Link
              key={label}
              href={state ? `/admin/capsules?state=${state}` : '/admin/capsules'}
              className={`text-[10px] px-3 py-1 rounded-full border uppercase tracking-widest
                transition-all duration-150
                ${
                  filterState === state || (!filterState && !state)
                    ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300'
                    : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50'
                }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {(capsules ?? []).length === 0 && (
          <p className="text-white/30 text-sm text-center py-16">
            No capsules match this filter.
          </p>
        )}
        {(capsules ?? []).map((c: any) => (
          <Link
            key={c.id}
            href={`/admin/capsules/${c.id}`}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/8
              bg-white/4 hover:border-yellow-400/20 hover:bg-yellow-400/4
              transition-all duration-150 group"
          >
            {/* Name + slug */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90 font-medium truncate">
                {c.honouree_name}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5 truncate">
                /{c.slug} · {c.organiser_email}
              </p>
            </div>

            {/* Tier */}
            <span className="text-[10px] text-white/35 hidden lg:block">
              {TIER_LABELS[c.tier] ?? c.tier}
            </span>

            {/* Event type */}
            <span className="text-[10px] text-white/30 hidden lg:block truncate max-w-[100px]">
              {c.event_type?.replace(/_/g, ' ')}
            </span>

            {/* State badge */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest flex-shrink-0
                ${STATE_COLORS[c.page_state] ?? 'text-white/40 bg-white/5 border-white/10'}`}
            >
              {c.page_state.replace(/_/g, ' ')}
            </span>

            {/* Date */}
            <span className="text-[10px] text-white/25 flex-shrink-0">
              {new Date(c.created_at).toLocaleDateString('en-GB')}
            </span>

            <span className="text-white/20 group-hover:text-yellow-400/50 text-sm flex-shrink-0">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}