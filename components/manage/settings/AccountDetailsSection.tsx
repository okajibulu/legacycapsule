'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: components/manage/settings/AccountDetailsSection.tsx
// PURPOSE:   Shows the current user's account details, access level, and
//            a summary of who else has access to this capsule.
//            Placed in the Capsule settings sub-tab, above the Danger Zone.
//            Account type descriptions are accurate and complete — not
//            generic or misleading.
//            Co-admins see their specific granted module list.
//            ECS: warm, plain English, dignified. Never says "role".
//            Idea 3: shows count of others with access (Org/FRFA see names).
//            Idea 4: session indicator — "Signed in as [Access Level]".
// ARCHITECTURE: CA-SPEC-001 — Step 15a.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.15
// DATE:      16 August 2026
// PROPS:
//   capsuleId    — for fetching access summary
//   accountType  — 'organiser' | 'family_rep_elder' | 'family_rep_full_access' | 'coadmin'
//   accountName  — display name of the logged-in person
//   accountEmail — email of the logged-in person
//   permissions  — array of permission keys (co-admin only, otherwise empty)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ═══ SECTION 1 — Theme ═══

const gold        = '#E2C36B'
const goldFaint   = 'rgba(226,195,107,0.12)'
const goldMuted   = 'rgba(226,195,107,0.55)'
const cardBg      = 'rgba(255,255,255,0.04)'
const cardBorder  = 'rgba(226,195,107,0.12)'
const textPrimary = 'rgba(255,255,255,0.92)'
const textSecondary = 'rgba(255,255,255,0.55)'
const textFaint   = 'rgba(255,255,255,0.28)'

// ═══ SECTION 2 — Account type display config ═══

const ACCOUNT_CONFIG: Record<string, {
  label:       string
  badgeColour: string
  description: string
}> = {
  organiser: {
    label:       'Organiser',
    badgeColour: 'rgba(226,195,107,0.8)',
    description: 'You created this capsule. You have full access to all settings, services, and orders for this capsule.',
  },
  family_rep_elder: {
    label:       'Family Rep',
    badgeColour: 'rgba(147,197,253,0.8)',
    description: 'You can view and respond to all voices and acknowledgements, set the Family Appreciation message, and access Stories, Attire, Access Codes, and Guest Management on behalf of the family.',
  },
  family_rep_full_access: {
    label:       'Family Rep Full Access',
    badgeColour: 'rgba(134,239,172,0.8)',
    description: 'You have full access to everything on this capsule — the same as the organiser, plus the ability to respond to voices and acknowledgements and set the Family Appreciation on behalf of the family.',
  },
  coadmin: {
    label:       'Co-admin',
    badgeColour: 'rgba(196,181,253,0.8)',
    description: 'You have access to specific sections of this capsule as configured by the organiser. Your access is listed below.',
  },
}

// ═══ SECTION 3 — Permission display names ═══
// Maps permission keys to plain English labels

const PERMISSION_LABELS: Record<string, string> = {
  contributions:    'Contribution Review',
  stories:          'Community Stories',
  guest_management: 'Guest Management',
  access_codes:     'Access Codes',
  gift_collection:  'Gift Collection',
  event_display:    'Event Display',
  publication:      'Publication',
  attire:           'Attire Coordination',
  event_moments:    'Event Moments',
}

// ═══ SECTION 4 — Props ═══

interface AccountDetailsSectionProps {
  capsuleId:    string
  accountType:  string
  accountName:  string
  accountEmail: string
  permissions:  string[]
}

// ═══ SECTION 5 — Access summary (who else has access) ═══

interface AccessSummary {
  elder_count:  number
  frfa_exists:  boolean
  frfa_name:    string | null
  coadmin_count: number
}

// ═══ SECTION 6 — Component ═══

export default function AccountDetailsSection({
  capsuleId,
  accountType,
  accountName,
  accountEmail,
  permissions,
}: AccountDetailsSectionProps) {
  const [summary, setSummary] = useState<AccessSummary | null>(null)

  const config      = ACCOUNT_CONFIG[accountType] ?? ACCOUNT_CONFIG.organiser
  const isOrganiser = accountType === 'organiser'
  const isFRFA      = accountType === 'family_rep_full_access'
  const isCoadmin   = accountType === 'coadmin'
  const canSeeNames = isOrganiser || isFRFA

  // ── Fetch access summary ────────────────────────────────────────────────
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res  = await fetch(`/api/team/accounts?capsule_id=${capsuleId}`)
        const data = await res.json()
        const accounts = data.accounts ?? []

        const frfaAccount = accounts.find((a: any) => a.account_type === 'family_rep_full_access')
        setSummary({
          elder_count:   accounts.filter((a: any) => a.account_type === 'family_rep_elder').length,
          frfa_exists:   !!frfaAccount,
          frfa_name:     frfaAccount?.name ?? null,
          coadmin_count: accounts.filter((a: any) => a.account_type === 'coadmin').length,
        })
      } catch {}
    }
    fetchSummary()
  }, [capsuleId])

  return (
    <div style={{ marginBottom: '24px' }}>

      {/* ── Section header ── */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{
          fontSize: '10px', fontWeight: 700, color: goldMuted,
          textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px',
        }}>
          My Account
        </p>
        <p style={{ fontSize: '11px', color: textFaint, margin: 0, lineHeight: 1.6 }}>
          Your access details for this capsule.
        </p>
      </div>

      {/* ── Account card ── */}
      <div style={{
        borderRadius: '14px', background: goldFaint,
        border: `1px solid rgba(226,195,107,0.2)`,
        padding: '16px',
      }}>

        {/* ── Name + access level badge ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '15px', fontWeight: 700, color: textPrimary,
              fontFamily: "'Playfair Display', serif",
              margin: '0 0 3px', lineHeight: 1.3,
            }}>
              {accountName || 'Organiser'}
            </p>
            <p style={{ fontSize: '12px', color: goldMuted, margin: 0 }}>
              {accountEmail}
            </p>
          </div>

          {/* ── Access level badge — Idea 4 ── */}
          <span style={{
            flexShrink: 0, marginLeft: '10px',
            fontSize: '9px', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: '10px',
            background: 'rgba(0,0,0,0.2)',
            border: `1px solid ${config.badgeColour}33`,
            color: config.badgeColour,
          }}>
            {config.label}
          </span>
        </div>

        {/* ── Gold divider ── */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,195,107,0.3), transparent)', marginBottom: '12px' }} />

        {/* ── Access description ── */}
        <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.75, margin: 0 }}>
          {config.description}
        </p>

        {/* ── Co-admin permission list ── */}
        {isCoadmin && permissions.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <p style={{
              fontSize: '10px', fontWeight: 700, color: goldMuted,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
            }}>
              Your access includes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {permissions.map(key => (
                <div
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(196,181,253,0.06)',
                    border: '1px solid rgba(196,181,253,0.12)',
                  }}
                >
                  <span style={{ color: 'rgba(196,181,253,0.6)', fontSize: '10px' }}>✦</span>
                  <span style={{ fontSize: '12px', color: textSecondary }}>
                    {PERMISSION_LABELS[key] ?? key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Co-admin no permissions edge case ── */}
        {isCoadmin && permissions.length === 0 && (
          <p style={{ fontSize: '12px', color: textFaint, marginTop: '12px', fontStyle: 'italic' }}>
            No specific access has been configured yet. Contact the organiser.
          </p>
        )}
      </div>

      {/* ── Who else has access — Idea 3 ── */}
      {summary && (summary.elder_count > 0 || summary.frfa_exists || summary.coadmin_count > 0) && (
        <div style={{
          marginTop: '10px', padding: '12px 14px', borderRadius: '10px',
          background: cardBg, border: `1px solid ${cardBorder}`,
        }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, color: goldMuted,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
          }}>
            Others with access
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {summary.frfa_exists && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: textSecondary }}>Family Rep Full Access</span>
                <span style={{ fontSize: '12px', color: canSeeNames ? textPrimary : textFaint }}>
                  {canSeeNames && summary.frfa_name ? summary.frfa_name : '1 person'}
                </span>
              </div>
            )}
            {summary.elder_count > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: textSecondary }}>Family Rep</span>
                <span style={{ fontSize: '12px', color: textFaint }}>
                  {summary.elder_count} {summary.elder_count === 1 ? 'person' : 'people'}
                </span>
              </div>
            )}
            {summary.coadmin_count > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: textSecondary }}>Co-admins</span>
                <span style={{ fontSize: '12px', color: textFaint }}>
                  {summary.coadmin_count} {summary.coadmin_count === 1 ? 'person' : 'people'}
                </span>
              </div>
            )}
          </div>

          <p style={{ fontSize: '10px', color: textFaint, marginTop: '8px', fontStyle: 'italic', lineHeight: 1.6 }}>
            Access is private to this capsule only.
          </p>
        </div>
      )}
    </div>
  )
}
