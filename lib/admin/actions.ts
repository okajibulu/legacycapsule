/* =========================================================
   lib/admin/actions.ts
   All admin DB actions with audit trail.
   Uses service role key for admin-level access.
   Every mutation writes to admin_audit_log.
========================================================= */

import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ── AUDIT LOG ── */
interface AuditEntry {
  module: string
  action: string
  recordId?: string
  prev?: any
  next?: any
  reason?: string
}

async function writeAuditLog(entry: AuditEntry) {
  await adminClient.from('admin_audit_log').insert({
    module: entry.module,
    action: entry.action,
    record_id: entry.recordId ?? null,
    prev_state: entry.prev ?? null,
    next_state: entry.next ?? null,
    reason: entry.reason ?? null,
  })
}

/* ── DASHBOARD STATS ── */
export async function getDashboardStats() {
  const [capsuleRes, activeRes, pendingVerifyRes, pendingModRes, approvedRes] = await Promise.all([
    adminClient.from('capsules').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    adminClient.from('capsules').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('page_state', ['active', 'tribute_collection']),
    adminClient.from('capsules').select('id', { count: 'exact', head: true }).is('deleted_at', null).is('verified_at', null),
    adminClient.from('contributions').select('id', { count: 'exact', head: true }).is('deleted_at', null).in('status', ['pending_review', 'pending']),
    adminClient.from('contributions').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'approved'),
  ])

  // Today's capsule count
  const today = new Date(); today.setHours(0,0,0,0)
  const { count: todayCount } = await adminClient.from('capsules').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()).is('deleted_at', null)

  return {
    totalCapsules: capsuleRes.count ?? 0,
    activeCapsules: activeRes.count ?? 0,
    pendingVerification: pendingVerifyRes.count ?? 0,
    pendingModeration: pendingModRes.count ?? 0,
    approvedTributes: approvedRes.count ?? 0,
    newToday: todayCount ?? 0,
  }
}

/* ── CAPSULE ACTIONS ── */
export async function getAllCapsules() {
  const { data } = await adminClient.from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, page_state, tier, organiser_email, approved_contrib_count, created_at, verified_at, free_tier_expires_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getCapsuleById(id: string) {
  const { data } = await adminClient.from('capsules')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function suspendCapsule(id: string, reason: string) {
  await adminClient.from('capsules').update({ page_state: 'suspended' }).eq('id', id)
  await writeAuditLog({ module: 'LCAdmin', action: 'capsule_suspended', recordId: id, next: { page_state: 'suspended' }, reason })
}

export async function activateCapsule(id: string) {
  await adminClient.from('capsules').update({ page_state: 'active' }).eq('id', id)
  await writeAuditLog({ module: 'LCAdmin', action: 'capsule_activated', recordId: id, next: { page_state: 'active' }, reason: 'Admin activation' })
}

export async function extendCapsule(id: string, days: number, reason: string) {
  const { data: capsule } = await adminClient.from('capsules').select('free_tier_expires_at').eq('id', id).single()
  if (!capsule) return
  const current = capsule.free_tier_expires_at ? new Date(capsule.free_tier_expires_at) : new Date()
  const newDate = new Date(current.getTime() + days * 86400000)
  await adminClient.from('capsules').update({ free_tier_expires_at: newDate.toISOString() }).eq('id', id)
  await writeAuditLog({ module: 'LCAdmin', action: 'capsule_extended', recordId: id, prev: { free_tier_expires_at: capsule.free_tier_expires_at }, next: { free_tier_expires_at: newDate.toISOString(), days_added: days }, reason })
}

/* ── CLIENT ACTIONS ── */
export async function getClients() {
  const { data: capsules } = await adminClient.from('capsules')
    .select('id, slug, honouree_name, organiser_email, event_type, event_tag, tier, page_state, created_at')
    .is('deleted_at', null)
    .order('organiser_email')
  if (!capsules) return []
  // Group by email
  const grouped: Record<string, { email: string; capsules: typeof capsules }> = {}
  for (const c of capsules) {
    if (!grouped[c.organiser_email]) grouped[c.organiser_email] = { email: c.organiser_email, capsules: [] }
    grouped[c.organiser_email].capsules.push(c)
  }
  return Object.values(grouped)
}

/* ── MODERATION ACTIONS ── */
export async function getPendingContributions() {
  const { data } = await adminClient.from('contributions')
    .select('id, capsule_id, contributor_name, city, country, tribute_text, email, status, created_at, thumbnail_url')
    .is('deleted_at', null)
    .in('status', ['pending_review', 'pending'])
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export async function adminApproveContribution(id: string) {
  await adminClient.from('contributions').update({ status: 'approved' }).eq('id', id)
  await writeAuditLog({ module: 'LCAdmin', action: 'contribution_approved_admin', recordId: id, next: { status: 'approved' }, reason: 'Admin override' })
}

export async function adminRemoveContribution(id: string, reason: string) {
  await adminClient.from('contributions').update({ status: 'declined', deleted_at: new Date().toISOString() }).eq('id', id)
  await writeAuditLog({ module: 'LCAdmin', action: 'contribution_removed_admin', recordId: id, next: { status: 'declined' }, reason })
}

/* ── PRICING ACTIONS ── */
export async function getAllPricing() {
  const { data } = await adminClient.from('lc_pricing')
    .select('*')
    .order('label')
  return data ?? []
}

export async function updatePrice(key: string, eurPrice: number, ngnPrice: number, reason: string) {
  const { data: prev } = await adminClient.from('lc_pricing').select('eur_price, ngn_price, is_published').eq('key', key).single()
  await adminClient.from('lc_pricing').update({ eur_price: eurPrice, ngn_price: ngnPrice, updated_at: new Date().toISOString() }).eq('key', key)
  await writeAuditLog({ module: 'LCAdmin', action: 'price_updated', recordId: key, prev, next: { eur_price: eurPrice, ngn_price: ngnPrice }, reason })
}

export async function publishPrice(key: string, reason: string) {
  const { data: prev } = await adminClient.from('lc_pricing').select('is_published').eq('key', key).single()
  await adminClient.from('lc_pricing').update({ is_published: true, updated_at: new Date().toISOString() }).eq('key', key)
  await writeAuditLog({ module: 'LCAdmin', action: 'price_published', recordId: key, prev, next: { is_published: true }, reason })
}

export async function unpublishPrice(key: string, reason: string) {
  const { data: prev } = await adminClient.from('lc_pricing').select('is_published').eq('key', key).single()
  await adminClient.from('lc_pricing').update({ is_published: false, updated_at: new Date().toISOString() }).eq('key', key)
  await writeAuditLog({ module: 'LCAdmin', action: 'price_unpublished', recordId: key, prev, next: { is_published: false }, reason })
}

/* ── FEATURE FLAG ACTIONS ── */
export async function getAllFlags() {
  const { data } = await adminClient.from('lc_feature_flags')
    .select('*')
    .order('label')
  return data ?? []
}

export async function setFeatureFlag(key: string, enabled: boolean, reason: string) {
  await adminClient.from('lc_feature_flags').update({ enabled, updated_at: new Date().toISOString() }).eq('key', key)
  await writeAuditLog({ module: 'LCAdmin', action: 'feature_flag_toggled', recordId: key, next: { enabled }, reason })
}

/* ── EXPORT adminClient for direct queries ── */
export { adminClient }
