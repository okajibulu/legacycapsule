import { getDashboardStats } from '@/lib/admin/queries'
import StatCard from '@/components/admin/StatCard'
import Link from 'next/link'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
          Dashboard
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          LegacyCapsule platform overview
        </p>
      </div>

      {/* Stat grid — row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Capsules"
          value={stats.totalCapsules}
          sub="all time"
        />
        <StatCard
          label="Active Capsules"
          value={stats.activeCapsules}
          sub="page_state: active"
          highlight
        />
        <StatCard
          label="Pending Verification"
          value={stats.pendingVerification}
          sub="awaiting organiser email"
          alert={stats.pendingVerification > 20}
        />
        <StatCard
          label="New Today"
          value={stats.newCapsulesCreatedToday}
          sub="capsules created today"
        />
      </div>

      {/* Stat grid — row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Pending Moderation"
          value={stats.pendingMod}
          sub="contributions in queue"
          alert={stats.pendingMod > 10}
        />
        <StatCard
          label="Approved Tributes"
          value={stats.totalApprovedContributions}
          sub="total across all capsules"
        />
        <StatCard
          label="Revenue Today"
          value={`€${stats.revenueToday.toFixed(2)}`}
          sub="EUR gross — Stripe"
          highlight={stats.revenueToday > 0}
        />
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              label: 'Review pending moderation',
              href: '/admin/moderation',
              alert: stats.pendingMod > 0,
            },
            {
              label: 'View pending verification',
              href: '/admin/capsules?state=pending_verification',
              alert: stats.pendingVerification > 0,
            },
            {
              label: 'Review all capsules',
              href: '/admin/capsules',
              alert: false,
            },
            {
              label: 'Check transactions',
              href: '/admin/transactions',
              alert: false,
            },
            {
              label: 'Edit pricing',
              href: '/admin/pricing',
              alert: false,
            },
            {
              label: 'Edit content',
              href: '/admin/content',
              alert: false,
            },
          ].map(({ label, href, alert }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-3 rounded-xl border text-sm transition-all duration-150
                ${
                  alert
                    ? 'border-red-400/25 bg-red-400/5 text-red-200/80 hover:border-red-400/40 hover:bg-red-400/10'
                    : 'border-yellow-400/15 bg-yellow-400/5 text-yellow-100/60 hover:border-yellow-400/30 hover:text-yellow-200 hover:bg-yellow-400/10'
                }`}
            >
              {label} →
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}