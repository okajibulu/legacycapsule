/* =========================================================
   app/admin/capsule/[id]/page.tsx — Individual Capsule
========================================================= */
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getCapsuleById } from '@/lib/admin/actions'
import CapsuleActions from './CapsuleActions'
import Link from 'next/link'

export default async function CapsuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminAuthenticated()) redirect('/admin')
  const { id } = await params
  const capsule = await getCapsuleById(id)
  if (!capsule) return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center' }}>Capsule not found</div>

  const textPrimary = 'rgba(255,255,255,0.92)'
  const textFaint = 'rgba(255,255,255,0.30)'
  const gold = '#E2C36B'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = 'rgba(226,195,107,0.1)'

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/capsule" style={{ fontSize: '12px', color: textFaint, textDecoration: 'none' }}>← Capsules</Link>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginTop: '8px' }}>{capsule.honouree_name}</h1>
        <p style={{ fontSize: '12px', color: textFaint }}>{capsule.slug} · {capsule.event_type}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'State', value: capsule.page_state?.replace(/_/g, ' ') },
          { label: 'Tier', value: capsule.tier ?? 'free' },
          { label: 'Organiser', value: capsule.organiser_email },
          { label: 'Created', value: new Date(capsule.created_at).toLocaleDateString('en-GB') },
          { label: 'Verified', value: capsule.verified_at ? new Date(capsule.verified_at).toLocaleDateString('en-GB') : 'No' },
          { label: 'Expires', value: capsule.free_tier_expires_at ? new Date(capsule.free_tier_expires_at).toLocaleDateString('en-GB') : '—' },
        ].map(f => (
          <div key={f.label} style={{ padding: '12px', borderRadius: '10px', background: cardBg, border: `1px solid rgba(255,255,255,0.06)` }}>
            <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>{f.label}</p>
            <p style={{ fontSize: '13px', color: textPrimary, fontWeight: 500, wordBreak: 'break-all' as const }}>{f.value}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px', borderRadius: '10px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', color: textFaint, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quick links</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <a href={`https://itslegacycapsule.com/for/${capsule.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: gold, textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(226,195,107,0.2)` }}>Tribute Wall ↗</a>
          <a href={`https://itslegacycapsule.com/manage/${capsule.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: gold, textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(226,195,107,0.2)` }}>Manage Dashboard ↗</a>
        </div>
      </div>

      <CapsuleActions capsuleId={capsule.id} currentState={capsule.page_state} />
    </div>
  )
}
