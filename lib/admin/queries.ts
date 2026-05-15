import { createClient } from '@supabase/supabase-js'

// Service role — server-side only. Never import this in 'use client' components.
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  const [
    allCapsules,
    activeCapsules,
    pendingVerification,
    pendingMod,
    newCapsulestoday,
    approvedContributions,
    revenueToday,
  ] = await Promise.all([
    adminClient.from('capsules').select('id', { count: 'exact', head: true }),
    adminClient
      .from('capsules')
      .select('id', { count: 'exact', head: true })
      .eq('page_state', 'active'),
    adminClient
      .from('capsules')
      .select('id', { count: 'exact', head: true })
      .eq('page_state', 'pending_verification'),
    adminClient
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review'),
    adminClient
      .from('capsules')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayISO),
    adminClient
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved'),
    adminClient
      .from('payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('created_at', todayISO),
  ])

  const todayRevenue = (revenueToday.data ?? []).reduce(
    (sum: number, p: { amount: number }) => sum + p.amount,
    0
  )

  return {
    totalCapsules: allCapsules.count ?? 0,
    activeCapsules: activeCapsules.count ?? 0,
    pendingVerification: pendingVerification.count ?? 0,
    pendingMod: pendingMod.count ?? 0,
    newCapsulesCreatedToday: newCapsulestoday.count ?? 0,
    totalApprovedContributions: approvedContributions.count ?? 0,
    revenueToday: todayRevenue,
  }
}

// ── CAPSULES ──────────────────────────────────────────────────────────────────

export async function getCapsules(filters?: {
  state?: string
  tier?: string
  reseller?: string
}) {
  let q = adminClient
    .from('capsules')
    .select(
      'id, slug, honouree_name, page_state, event_type, tier, created_at, reseller_code, organiser_email'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.state) q = q.eq('page_state', filters.state)
  if (filters?.tier) q = q.eq('tier', filters.tier)
  if (filters?.reseller) q = q.eq('reseller_code', filters.reseller)

  return q
}

export async function getCapsuleById(id: string) {
  return adminClient.from('capsules').select('*').eq('id', id).single()
}

export async function getCapsuleContributions(capsuleId: string) {
  return adminClient
    .from('contributions')
    .select('id, contributor_name, tribute_text, status, created_at, city, country')
    .eq('capsule_id', capsuleId)
    .order('created_at', { ascending: false })
}

// ── CLIENT ACCOUNTS ───────────────────────────────────────────────────────────
// Clients = unique organisers derived from capsules table (no Supabase auth in Phase 1)

export async function getClients() {
  return adminClient
    .from('capsules')
    .select('id, slug, honouree_name, organiser_email, page_state, tier, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
}

export async function getClientCapsules(organiserEmail: string) {
  return adminClient
    .from('capsules')
    .select('id, slug, honouree_name, page_state, tier, created_at')
    .eq('organiser_email', organiserEmail)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

export async function getTransactions(filters?: {
  processor?: string
  status?: string
  dateFrom?: string
}) {
  let q = adminClient
    .from('payments')
    .select(
      'id, capsule_id, processor, amount, currency, package_tier, status, reseller_code, created_at'
    )
    .order('created_at', { ascending: false })

  if (filters?.processor) q = q.eq('processor', filters.processor)
  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom)

  return q
}

export async function getRevenueByPeriod(days: number) {
  const from = new Date(Date.now() - days * 86_400_000).toISOString()
  return adminClient
    .from('payments')
    .select('amount, currency, created_at')
    .eq('status', 'succeeded')
    .gte('created_at', from)
}

// ── RESELLERS ─────────────────────────────────────────────────────────────────

export async function getResellerSummary() {
  return adminClient
    .from('capsules')
    .select('reseller_code, id')
    .not('reseller_code', 'is', null)
    .is('deleted_at', null)
}

export async function getResellerAttributions(resellerCode: string) {
  return adminClient
    .from('capsules')
    .select('id, slug, honouree_name, page_state, tier, created_at')
    .eq('reseller_code', resellerCode)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
}

export async function getResellerRevenue(resellerCode: string) {
  return adminClient
    .from('payments')
    .select('id, amount, currency, status, created_at')
    .eq('reseller_code', resellerCode)
    .eq('status', 'succeeded')
}

// ── MODERATION ────────────────────────────────────────────────────────────────

export async function getEscalatedContent() {
  return adminClient
    .from('contributions')
    .select(
      'id, capsule_id, contributor_name, tribute_text, status, created_at'
    )
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })
}

// ── LC_CONTENT ────────────────────────────────────────────────────────────────

export async function getAllContent() {
  return adminClient
    .from('lc_content')
    .select('id, key, label, value, group_key, sort_order, updated_at')
    .order('group_key')
    .order('sort_order')
}

export async function getContentByGroup(groupKey: string) {
  return adminClient
    .from('lc_content')
    .select('id, key, label, value, group_key, sort_order, updated_at')
    .eq('group_key', groupKey)
    .order('sort_order')
}

// ── LC_PRICING_ZONES ──────────────────────────────────────────────────────────

export async function getPricingZones() {
  return adminClient
    .from('lc_pricing_zones')
    .select('*')
    .order('zone_name')
}
