import { createClient } from '@supabase/supabase-js'
import { writeAuditLog } from './audit'

// Service role — server-side only. Never import in 'use client' components.
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── CAPSULE ACTIONS ───────────────────────────────────────────────────────────

export async function changeCapsuleState(
  capsuleId: string,
  newState: string,
  reason: string
) {
  const { data: prev } = await adminClient
    .from('capsules')
    .select('page_state')
    .eq('id', capsuleId)
    .single()

  await adminClient
    .from('capsules')
    .update({ page_state: newState })
    .eq('id', capsuleId)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'capsule_state_change',
    recordId: capsuleId,
    prev: prev,
    next: { page_state: newState },
    reason,
  })
}

export async function suspendCapsule(capsuleId: string, reason: string) {
  await changeCapsuleState(capsuleId, 'suspended', reason)
}

export async function unsuspendCapsule(capsuleId: string, reason: string) {
  await changeCapsuleState(capsuleId, 'active', reason)
}

export async function extendCapsuleExpiry(
  capsuleId: string,
  newDate: string,
  reason: string
) {
  await adminClient
    .from('capsules')
    .update({ free_tier_expires_at: newDate })
    .eq('id', capsuleId)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'capsule_expiry_extended',
    recordId: capsuleId,
    prev: null,
    next: { free_tier_expires_at: newDate },
    reason,
  })
}

export async function addCapsuleNote(capsuleId: string, note: string) {
  await writeAuditLog({
    module: 'LCAdmin',
    action: 'capsule_note_added',
    recordId: capsuleId,
    prev: null,
    next: { note },
    reason: note,
  })
}

// ── MODERATION ACTIONS ────────────────────────────────────────────────────────

export async function approveContribution(
  contributionId: string,
  reason: string
) {
  await adminClient
    .from('contributions')
    .update({ status: 'approved' })
    .eq('id', contributionId)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'contribution_approved_admin',
    recordId: contributionId,
    prev: null,
    next: { status: 'approved' },
    reason,
  })
}

export async function removeContribution(
  contributionId: string,
  reason: string
) {
  await adminClient
    .from('contributions')
    .update({ status: 'declined', deleted_at: new Date().toISOString() })
    .eq('id', contributionId)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'contribution_removed_admin',
    recordId: contributionId,
    prev: null,
    next: { status: 'declined' },
    reason,
  })
}

// ── PRICING ACTIONS ───────────────────────────────────────────────────────────

export async function updatePrice(
  key: string,
  eurPrice: number,
  ngnPrice: number,
  reason: string
) {
  const { data: prev } = await adminClient
    .from('lc_pricing')
    .select('eur_price, ngn_price')
    .eq('key', key)
    .single()

  await adminClient
    .from('lc_pricing')
    .update({
      eur_price: eurPrice,
      ngn_price: ngnPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'price_updated',
    recordId: key,
    prev: prev,
    next: { eur_price: eurPrice, ngn_price: ngnPrice },
    reason,
  })
}

// ── FEATURE FLAG ACTIONS ──────────────────────────────────────────────────────

export async function setFeatureFlag(
  key: string,
  enabled: boolean,
  reason: string
) {
  await adminClient
    .from('lc_feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('key', key)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'feature_flag_toggled',
    recordId: key,
    prev: null,
    next: { enabled },
    reason,
  })
}

// ── LC_CONTENT ACTIONS ────────────────────────────────────────────────────────

export async function updateContentRow(
  key: string,
  value: string,
  reason: string
) {
  const { data: prev } = await adminClient
    .from('lc_content')
    .select('value')
    .eq('key', key)
    .single()

  await adminClient
    .from('lc_content')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'content_updated',
    recordId: key,
    prev: prev,
    next: { value },
    reason,
  })
}

export async function addContentFeature(
  groupKey: string,
  value: string,
  nextSortOrder: number
) {
  // Key pattern: group_key__feat_N  e.g. tier_honour__feat_8
  // Extract the N by counting existing feat_ keys for this group
  const featNum = nextSortOrder // caller computes this from current max sort_order
  const key = `${groupKey}__feat_${featNum}`
  const label = `Feature ${featNum}`

  await adminClient.from('lc_content').insert({
    key,
    label,
    value,
    group_key: groupKey,
    sort_order: nextSortOrder,
    updated_at: new Date().toISOString(),
  })

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'content_feature_added',
    recordId: key,
    prev: null,
    next: { key, value, group_key: groupKey },
    reason: 'New feature bullet added via LCAdmin',
  })
}

export async function deleteContentFeature(key: string) {
  await adminClient.from('lc_content').delete().eq('key', key)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'content_feature_deleted',
    recordId: key,
    prev: null,
    next: null,
    reason: 'Feature bullet deleted via LCAdmin',
  })
}

// ── LC_PRICING_ZONES ACTIONS ──────────────────────────────────────────────────

export async function updatePricingZone(
  zoneId: string,
  multiplier: number,
  currencySymbol: string,
  reason: string
) {
  const { data: prev } = await adminClient
    .from('lc_pricing_zones')
    .select('multiplier, currency_symbol')
    .eq('id', zoneId)
    .single()

  await adminClient
    .from('lc_pricing_zones')
    .update({ multiplier, currency_symbol: currencySymbol })
    .eq('id', zoneId)

  await writeAuditLog({
    module: 'LCAdmin',
    action: 'pricing_zone_updated',
    recordId: zoneId,
    prev: prev,
    next: { multiplier, currency_symbol: currencySymbol },
    reason,
  })
}