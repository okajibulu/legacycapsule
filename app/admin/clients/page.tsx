/* =========================================================
   app/admin/clients/page.tsx — Client Accounts
========================================================= */
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getClients } from '@/lib/admin/actions'

const gold = '#E2C36B'
const cardBg = 'rgba(255,255,255,0.03)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textFaint = 'rgba(255,255,255,0.30)'

const STATE_COLORS: Record<string, string> = {
  active: 'rgba(74,222,128,0.85)', tribute_collection: 'rgba(74,222,128,0.85)',
  pending_payment: 'rgba(251,191,36,0.85)', pending_verification: 'rgba(251,191,36,0.85)',
  suspended: 'rgba(248,113,113,0.85)', draft: 'rgba(255,255,255,0.3)',
}

export default async function ClientsPage() {
  if (!await isAdminAuthenticated()) redirect('/admin')
  const clients = await getClients()

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>Clients</h1>
        <p style={{ fontSize: '12px', color: textFaint }}>{clients.length} unique organisers</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {clients.map(client => (
          <div key={client.email} style={{ borderRadius: '12px', background: cardBg, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: gold }}>{client.email}</p>
              <p style={{ fontSize: '11px', color: textFaint }}>{client.capsules.length} capsule{client.capsules.length !== 1 ? 's' : ''}</p>
            </div>
            {client.capsules.map((c: any) => (
              <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.honouree_name}</p>
                  <p style={{ fontSize: '10px', color: textFaint }}>{c.event_type}{c.event_tag ? ` · ${c.event_tag}` : ''}</p>
                </div>
                <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: STATE_COLORS[c.page_state] ?? 'rgba(255,255,255,0.3)', border: `1px solid ${STATE_COLORS[c.page_state] ?? 'rgba(255,255,255,0.1)'}22`, whiteSpace: 'nowrap' as const, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>
                  {c.page_state?.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(226,195,107,0.06)', color: 'rgba(226,195,107,0.6)', border: '1px solid rgba(226,195,107,0.1)', whiteSpace: 'nowrap' as const }}>{c.tier ?? 'Free'}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
