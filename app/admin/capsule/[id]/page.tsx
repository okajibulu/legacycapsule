/* =========================================================
   app/admin/capsule/[id]/page.tsx
   
   Changes v1.2.6 (AI6 — T7):
   - Added Family Rep Portal Tokens panel below ComponentsPanel
   - Shows: rep email, issued date, last accessed, expires,
     and active/expired status badge
   - Fetches honouree_portal_tokens server-side via adminClient
========================================================= */
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getCapsuleById } from '@/lib/admin/actions'
import { createClient } from '@supabase/supabase-js'
import CapsuleActions from './CapsuleActions'
import ComponentsPanel from './ComponentsPanel'
import Link from 'next/link'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function CapsuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!await isAdminAuthenticated()) redirect('/admin')
  const { id } = await params
  const capsule = await getCapsuleById(id)
  if (!capsule) return (
    <div style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center' }}>
      Capsule not found
    </div>
  )

  // Fetch family rep portal tokens for this capsule
  const { data: portalTokens } = await adminClient
    .from('honouree_portal_tokens')
    .select('id, honouree_email, created_at, last_accessed_at, expires_at, session_type')
    .eq('capsule_id', id)
    .order('created_at', { ascending: false })

  const textPrimary = 'rgba(255,255,255,0.92)'
  const textFaint   = 'rgba(255,255,255,0.30)'
  const gold        = '#E2C36B'
  const cardBg      = 'rgba(255,255,255,0.03)'
  const cardBorder  = 'rgba(226,195,107,0.1)'

  const now = new Date()

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/capsule" style={{ fontSize: '12px', color: textFaint, textDecoration: 'none' }}>← Capsules</Link>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginTop: '8px' }}>
          {capsule.honouree_name}
        </h1>
        <p style={{ fontSize: '12px', color: textFaint }}>{capsule.slug} · {capsule.event_type}</p>
      </div>

      {/* ── Key fields grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: 'State',    value: capsule.page_state?.replace(/_/g, ' ') },
          { label: 'Tier',     value: capsule.tier ?? 'free' },
          { label: 'Organiser', value: capsule.organiser_email },
          { label: 'Created',  value: new Date(capsule.created_at).toLocaleDateString('en-GB') },
          { label: 'Verified', value: capsule.verified_at ? new Date(capsule.verified_at).toLocaleDateString('en-GB') : 'No' },
          { label: 'Expires',  value: capsule.free_tier_expires_at ? new Date(capsule.free_tier_expires_at).toLocaleDateString('en-GB') : '—' },
        ].map(f => (
          <div key={f.label} style={{ padding: '12px', borderRadius: '10px', background: cardBg, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '9px', color: textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>{f.label}</p>
            <p style={{ fontSize: '13px', color: textPrimary, fontWeight: 500, wordBreak: 'break-all' as const }}>{f.value}</p>
          </div>
        ))}
      </div>

      {/* ── Quick links ── */}
      <div style={{ padding: '14px 16px', borderRadius: '10px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', color: textFaint, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quick links</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <a href={`https://itslegacycapsule.com/for/${capsule.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: gold, textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(226,195,107,0.2)` }}>Tribute Wall ↗</a>
          <a href={`https://itslegacycapsule.com/manage/${capsule.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: gold, textDecoration: 'none', padding: '4px 10px', borderRadius: '6px', border: `1px solid rgba(226,195,107,0.2)` }}>Manage Dashboard ↗</a>
        </div>
      </div>

      {/* ── Premium Components Panel ── */}
      <ComponentsPanel
        capsuleId={capsule.id}
        components={capsule.components ?? []}
      />

      {/* ── T7: Family Rep Portal Tokens Panel ── */}
      <div style={{ padding: '14px 16px', borderRadius: '12px', background: cardBg, border: `1px solid ${cardBorder}`, marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Family Rep Portal Access
        </p>

        {!portalTokens || portalTokens.length === 0 ? (
          <p style={{ fontSize: '12px', color: textFaint, fontStyle: 'italic' }}>
            No portal access links issued for this capsule.
          </p>
        ) : (
          <div>
            {portalTokens.map((token: any) => {
              const isExpired  = token.expires_at && new Date(token.expires_at) < now
              const issuedDate = new Date(token.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              const lastAccess = token.last_accessed_at
                ? new Date(token.last_accessed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Never'
              const expiresDate = token.expires_at
                ? new Date(token.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'

              return (
                <div key={token.id} style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid rgba(255,255,255,0.06)`, background: 'rgba(255,255,255,0.02)', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '4px' }}>
                      {token.honouree_email}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '10px', color: textFaint }}>Issued: {issuedDate}</span>
                      <span style={{ fontSize: '10px', color: textFaint }}>Last accessed: {lastAccess}</span>
                      <span style={{ fontSize: '10px', color: textFaint }}>Expires: {expiresDate}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '6px',
                    flexShrink: 0,
                    background: isExpired ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                    border: `1px solid ${isExpired ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
                    color: isExpired ? 'rgba(248,113,113,0.8)' : 'rgba(134,239,172,0.9)',
                  }}>
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CapsuleActions capsuleId={capsule.id} currentState={capsule.page_state} />
    </div>
  )
}
