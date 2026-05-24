/* =========================================================
   app/admin/dashboard/page.tsx — LCAdmin Dashboard
========================================================= */
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getDashboardStats } from '@/lib/admin/actions'
import Link from 'next/link'

const gold = '#E2C36B'
const cardBg = 'rgba(255,255,255,0.04)'
const cardBorder = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.30)'

function StatCard({ label, value, sub, accent, alert }: { label: string; value: string | number; sub?: string; accent?: boolean; alert?: boolean }) {
  return (
    <div style={{
      padding: '16px', borderRadius: '12px',
      background: alert ? 'rgba(248,113,113,0.05)' : accent ? 'rgba(226,195,107,0.06)' : cardBg,
      border: `1px solid ${alert ? 'rgba(248,113,113,0.2)' : accent ? 'rgba(226,195,107,0.2)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 800, color: alert ? 'rgba(248,113,113,0.9)' : accent ? gold : textPrimary, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '10px', color: textFaint, marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}

function QuickAction({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link href={href} style={{
      display: 'block', padding: '14px 16px', borderRadius: '10px',
      background: cardBg, border: `1px solid ${cardBorder}`,
      textDecoration: 'none', transition: 'all 0.15s',
    }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: gold, marginBottom: '3px' }}>{label} →</p>
      <p style={{ fontSize: '11px', color: textFaint }}>{sub}</p>
    </Link>
  )
}

export default async function DashboardPage() {
  if (!await isAdminAuthenticated()) redirect('/admin')
  const stats = await getDashboardStats()

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: textFaint }}>LegacyCapsule platform overview</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        <StatCard label="Total Capsules" value={stats.totalCapsules} sub="all time" />
        <StatCard label="Active" value={stats.activeCapsules} sub="live capsules" accent />
        <StatCard label="Pending Verify" value={stats.pendingVerification} sub="awaiting email" alert={stats.pendingVerification > 0} />
        <StatCard label="Pending Moderation" value={stats.pendingModeration} sub="in queue" alert={stats.pendingModeration > 5} />
        <StatCard label="Approved Tributes" value={stats.approvedTributes} sub="total approved" accent />
        <StatCard label="New Today" value={stats.newToday} sub="capsules created" />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          <QuickAction href="/admin/moderation" label="Review Moderation" sub={`${stats.pendingModeration} tributes awaiting review`} />
          <QuickAction href="/admin/capsules" label="View All Capsules" sub="Search, filter, manage" />
          <QuickAction href="/admin/clients" label="Client Accounts" sub="Organisers and their capsules" />
          <QuickAction href="/admin/pricing" label="Pricing Config" sub="Edit component prices" />
          <QuickAction href="/admin/flags" label="Feature Flags" sub="Toggle platform features" />
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(226,195,107,0.04)', border: `1px solid rgba(226,195,107,0.1)`, marginTop: '20px' }}>
        <p style={{ fontSize: '11px', color: textFaint, lineHeight: 1.7 }}>
          ✦ Revenue tracking activates when Stripe/Paystack integration is live.
          Platform phase: <strong style={{ color: gold }}>Phase 1 — MVP</strong>
        </p>
      </div>
    </div>
  )
}
