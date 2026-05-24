/* =========================================================
   app/admin/capsule/page.tsx — Capsule List
========================================================= */
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getAllCapsules } from '@/lib/admin/actions'
import Link from 'next/link'

const gold = '#E2C36B'
const cardBg = 'rgba(255,255,255,0.03)'
const cardBorder = 'rgba(255,255,255,0.06)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.30)'
const textMuted = 'rgba(255,255,255,0.55)'

const STATE_COLORS: Record<string, { bg: string; color: string }> = {
  active:               { bg: 'rgba(74,222,128,0.1)',  color: 'rgba(134,239,172,0.9)' },
  tribute_collection:   { bg: 'rgba(74,222,128,0.1)',  color: 'rgba(134,239,172,0.9)' },
  pending_payment:      { bg: 'rgba(251,191,36,0.1)',  color: 'rgba(251,191,36,0.9)'  },
  pending_verification: { bg: 'rgba(251,191,36,0.1)',  color: 'rgba(251,191,36,0.9)'  },
  suspended:            { bg: 'rgba(248,113,113,0.1)', color: 'rgba(248,113,113,0.9)' },
  draft:                { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
}

function StateTag({ state }: { state: string }) {
  const c = STATE_COLORS[state] ?? STATE_COLORS.draft
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' as const }}>
      {state.replace(/_/g, ' ')}
    </span>
  )
}

export default async function CapsulesPage() {
  if (!await isAdminAuthenticated()) redirect('/admin')
  const capsules = await getAllCapsules()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Capsules</h1>
          <p style={{ fontSize: '12px', color: textFaint }}>{capsules.length} total</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {capsules.map(c => (
          <Link key={c.id} href={`/admin/capsules/${c.id}`} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '10px',
            background: cardBg, border: `1px solid ${cardBorder}`,
            textDecoration: 'none', transition: 'all 0.15s',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.honouree_name}</p>
                <StateTag state={c.page_state} />
              </div>
              <p style={{ fontSize: '11px', color: textFaint }}>{c.organiser_email} · {c.event_type}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: gold }}>{c.approved_contrib_count}</p>
              <p style={{ fontSize: '9px', color: textFaint }}>tributes</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
