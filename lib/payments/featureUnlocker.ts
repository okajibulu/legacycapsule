// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/payments/featureUnlocker.ts
// PURPOSE:   THE single source of truth mapping price keys to capsule activation.
//            Every price key in lc_pricing must have an entry in FEATURE_MAP.
//            Every new product or add-on: add one row here. Nowhere else.
//            Called by webhook handler after payment confirmed.
//            Never called speculatively — only after payment.status = succeeded.
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY:  AI13 · Claude Opus 4.6 · 22 July 2026
// UPDATED:   AI20 · Claude Opus 4.6 · 11 August 2026
//            — capsule_extend_3mo key added (pay-to-extend +3 months)
//            — publication auto-extension: buying publication adds +3 months
//            — essential_preset + signature_preset keys added (alias resolution)
//            — extendCapsuleValidity() helper added
//            — Free tier limit enforcement: NOT here — limits are read from
//              capsule_limits table at query time, not enforced in unlocker.
//              The unlocker only ACTIVATES paid features.
//            AI13 additions:
//            — access_codes key (was missing — caused B1 activation failure)
//            — additional_phase key (was missing)
//            — access_code_system legacy alias corrected
// VERSION:   AI20v2.11.97
// DATE:      11 August 2026
//
// VALIDITY EXTENSION RULES (per founder spec):
//   Free tier:           90 days from first tribute (set at tribute creation, not here)
//   capsule_extend_3mo:  +3 months from current expiry (or from now if none set)
//   publication key:     automatic +3 months — same mechanic as capsule_extend_3mo
//   Annual archive:      12 months from purchase — max 1 year at a time
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client (server-only) ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Feature definition type ═══
// updates:    direct column assignments on the capsules table
// components: component IDs to append to capsule.components array
// extends:    validity extension in months (applied after column updates)

interface FeatureDefinition {
  updates?:    Record<string, unknown>
  components?: string[]
  extends?:    number   // months to add to capsule validity
}

// ═══ SECTION 3 — Feature map ═══
// Maps lc_pricing.key → feature activation definition.
//
// page_state valid values:
//   pending_verification  — created, email not verified
//   pending_payment       — verified, awaiting payment confirmation
//   active                — live
//   expired               — past validity date
//   suspended             — admin action
//
// RULE: 'tribute_collection' is a retired page_state. Never use it.
// RULE: components array drives ALL UI visibility.
// RULE: extends value is ADDITIVE — always adds to existing expiry, never resets.

const FEATURE_MAP: Record<string, FeatureDefinition> = {

  // ── Capsule activation ────────────────────────────────────────────────────
  capsule_activation: {
    updates: { page_state: 'active' },
  },

  // ── Base tiers ────────────────────────────────────────────────────────────
  capture_preserve_base: {
    updates: { page_state: 'active', tier: 'capture_preserve' },
  },

  full_platform_base: {
    updates: { page_state: 'active', tier: 'full_platform' },
  },

  // ── Validity extensions ───────────────────────────────────────────────────
  // Pay-to-extend: +3 months from current expiry (or from now if none set)
  capsule_extend_3mo: {
    extends: 3,
  },

  // Annual archive: 12 months from purchase. Max 1 year at a time.
  // RULE: do not chain multiple annual archives — renew only at expiry.
  extended_validity: {
    extends: 12,
    components: ['extended_validity'],
  },

  // ── Capture pillar ────────────────────────────────────────────────────────
  audio_tributes: { components: ['audio_tributes'] },
  video_tributes: { components: ['video_tributes'] },

  // ── Preserve pillar ───────────────────────────────────────────────────────
  // publication: activates Digital Capsule Publication AND grants +3 months
  // This is the automatic validity bonus for purchasing the publication.
  publication: {
    components: ['publication'],
    extends:    3,
  },

  ways_to_honour:       { components: ['ways_to_honour'] },
  expression_of_honour: { components: ['ways_to_honour'] },   // alias
  community_stories:    { components: ['community_stories'] },

  // ── Coordinate pillar ─────────────────────────────────────────────────────
  guest_management: { components: ['guest_management'] },
  attire:           { components: ['attire'] },

  // ── Access & event management ─────────────────────────────────────────────
  access_codes:     { components: ['access_codes'] },
  additional_phase: { components: ['additional_phase'] },

  // ── Capacity packs (cumulative) ───────────────────────────────────────────
  capacity_pack_growth:      { components: ['capacity_pack_growth']      },
  capacity_pack_celebration: { components: ['capacity_pack_celebration'] },
  capacity_pack_grand:       { components: ['capacity_pack_grand']       },

  // ── Preset aliases ────────────────────────────────────────────────────────
  // When a preset key appears in package_tier, resolve to its component keys.
  // The bundle route already expands presets to individual feature keys before
  // creating the payment record — these aliases are a safety net only.
  essential_preset: {
    components: ['publication', 'audio_tributes', 'video_tributes'],
    extends:    3,
  },
  signature_preset: {
    components: ['publication', 'audio_tributes', 'video_tributes', 'access_codes', 'ways_to_honour', 'additional_phase'],
    extends:    3,
  },

  // ── Legacy key aliases ────────────────────────────────────────────────────
  // Kept for backward compatibility with historical payments.
  access_code_system:   { components: ['access_codes'] },
  fabric_attire:        { components: ['attire'] },
  voice_tribute:        { components: ['audio_tributes'] },
  video_tribute_30s:    { components: ['video_tributes'] },
  video_tribute_60s:    { components: ['video_tributes'] },
  save_the_date:        { updates: { save_the_date_active: true } },
  table_management:     { components: ['guest_management'] },
  table_card_generation:{ updates: { table_cards_active: true } },
  permanent_archive:    { extends: 12, components: ['extended_validity'] },
  white_label_branding: { updates: { white_label_active: true } },
  custom_domain:        { updates: { custom_domain_active: true } },
}

// ═══ SECTION 4 — Validity extension helper ═══
// Adds months to capsule.expires_at.
// If expires_at is null or in the past, starts from today.
// Always additive — never resets existing expiry.
// Max 1 year per extension (guard against abuse).

async function extendCapsuleValidity(
  capsule_id: string,
  months: number
): Promise<void> {
  // Cap at 12 months per call — enforces "max 1 year at a time" for archive
  const safeMonths = Math.min(months, 12)

  const { data: capsule, error } = await db
    .from('capsules')
    .select('expires_at')
    .eq('id', capsule_id)
    .single()

  if (error || !capsule) {
    console.error(`[featureUnlocker] Could not fetch capsule for validity extension: ${capsule_id}`)
    return
  }

  // Start from current expiry if in the future, otherwise start from today
  const base = capsule.expires_at && new Date(capsule.expires_at) > new Date()
    ? new Date(capsule.expires_at)
    : new Date()

  const newExpiry = new Date(base)
  newExpiry.setMonth(newExpiry.getMonth() + safeMonths)

  await db
    .from('capsules')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('id', capsule_id)

  console.log(
    `[featureUnlocker] Capsule ${capsule_id} validity extended +${safeMonths} months → ${newExpiry.toISOString().slice(0, 10)}`
  )
}

// ═══ SECTION 5 — Main unlock function ═══
// Called by webhook handler after payment confirmed.
// Resolves price keys → feature activations → applies all in one DB operation.
// Validity extensions applied after column updates.

export async function unlockCapsuleFeatures(payment_id: string): Promise<void> {

  // ── Fetch payment record ──────────────────────────────────────────────────
  const { data: payment, error } = await db
    .from('payments')
    .select('capsule_id, package_tier, metadata, status')
    .eq('id', payment_id)
    .single()

  if (error || !payment) {
    console.error(`[featureUnlocker] Payment not found: ${payment_id}`)
    return
  }

  if (payment.status !== 'succeeded') {
    console.warn(`[featureUnlocker] Skipped — payment status is: ${payment.status}`)
    return
  }

  if (!payment.capsule_id) {
    console.error(`[featureUnlocker] No capsule_id on payment ${payment_id}`)
    return
  }

  // ── Resolve price keys ────────────────────────────────────────────────────
  // Check both package_tier (comma-separated) and metadata.feature_ids (array)
  const tierKeys: string[]  = (payment.package_tier ?? '').split(',').map((k: string) => k.trim()).filter(Boolean)
  const metaIds: string[]   = Array.isArray(payment.metadata?.feature_ids)
    ? payment.metadata.feature_ids
    : []
  const priceKeys: string[] = [...new Set([...tierKeys, ...metaIds])]

  const directUpdates: Record<string, unknown> = {}
  const componentsToAdd: string[] = []
  let   totalExtensionMonths = 0

  for (const key of priceKeys) {
    const def = FEATURE_MAP[key]
    if (!def) {
      console.warn(`[featureUnlocker] No FEATURE_MAP entry for: "${key}" — add it to FEATURE_MAP`)
      continue
    }
    if (def.updates)    Object.assign(directUpdates, def.updates)
    if (def.components) componentsToAdd.push(...def.components)
    if (def.extends)    totalExtensionMonths += def.extends
  }

  if (Object.keys(directUpdates).length === 0 && componentsToAdd.length === 0 && totalExtensionMonths === 0) {
    console.warn(`[featureUnlocker] No features resolved for payment ${payment_id}. Keys: ${priceKeys.join(', ')}`)
    return
  }

  // ── Merge components ──────────────────────────────────────────────────────
  if (componentsToAdd.length > 0) {
    const { data: capsule, error: fetchError } = await db
      .from('capsules')
      .select('components')
      .eq('id', payment.capsule_id)
      .single()

    if (fetchError || !capsule) {
      console.error(`[featureUnlocker] Could not fetch capsule ${payment.capsule_id}`)
      return
    }

    const current: string[] = capsule.components ?? []
    directUpdates.components = [...new Set([...current, ...componentsToAdd])]
  }

  // ── Apply column updates ──────────────────────────────────────────────────
  if (Object.keys(directUpdates).length > 0) {
    const { error: updateError } = await db
      .from('capsules')
      .update(directUpdates)
      .eq('id', payment.capsule_id)

    if (updateError) {
      console.error('[featureUnlocker] Capsule update failed:', updateError)
      return
    }
  }

  // ── Apply validity extension ──────────────────────────────────────────────
  // Run after column updates — separate operation, non-blocking if it fails.
  if (totalExtensionMonths > 0) {
    try {
      await extendCapsuleValidity(payment.capsule_id, totalExtensionMonths)
    } catch (extErr) {
      // Log but do not fail the unlock — features already activated above
      console.error('[featureUnlocker] Validity extension failed (non-fatal):', extErr)
    }
  }

  console.log(
    `[featureUnlocker] Capsule ${payment.capsule_id} unlocked — payment ${payment_id}:`,
    JSON.stringify({
      keys:       priceKeys,
      updates:    directUpdates,
      extended:   totalExtensionMonths > 0 ? `+${totalExtensionMonths} months` : 'none',
    })
  )
}