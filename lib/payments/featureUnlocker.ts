// FILE: lib/payments/featureUnlocker.ts
// PURPOSE: THE single source of truth mapping price keys to capsule activation.
//          Every price key in lc_pricing must have an entry in FEATURE_MAP.
//          Every new product or add-on: add one row here. Nowhere else.
//          Called by webhook handler after payment confirmed.
//          Never called speculatively.
// ARCHITECTURE: LC04 Payment Engine
// UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
//   -- access_codes key added (was missing -- caused B1 activation failure)
//   -- additional_phase key added (was missing)
//   -- access_code_system legacy alias corrected to map to access_codes

import { createClient } from '@supabase/supabase-js'

// ============================================================
// SECTION 1 -- DB client (server-only)
// ============================================================

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// SECTION 2 -- Feature definition type
// updates:    direct column assignments on the capsules table
// components: component IDs to append to capsule.components array
// ============================================================

interface FeatureDefinition {
  updates?:    Record<string, unknown>
  components?: string[]
}

// ============================================================
// SECTION 3 -- Feature map
// Maps lc_pricing.key to feature activation definition.
//
// page_state valid values:
//   pending_verification  - created, email not verified
//   pending_payment       - verified, awaiting Stripe confirmation
//   active                - live
//   expired               - Phase 2+
//   suspended             - admin action
//
// RULE: 'tribute_collection' is a retired page_state. Never use it.
// RULE: components array drives ALL UI visibility.
// ============================================================

const FEATURE_MAP: Record<string, FeatureDefinition> = {

  // -- CAPSULE ACTIVATION ---------------------------------------------------
  capsule_activation: {
    updates: { page_state: 'active' },
  },

  // -- BASE TIERS -----------------------------------------------------------
  capture_preserve_base: {
    updates: { page_state: 'active', tier: 'capture_preserve' },
  },

  full_platform_base: {
    updates: { page_state: 'active', tier: 'full_platform' },
  },

  // -- CAPTURE PILLAR -------------------------------------------------------
  audio_tributes: { components: ['audio_tributes'] },
  video_tributes: { components: ['video_tributes'] },

  // -- COORDINATE PILLAR ----------------------------------------------------
  guest_management: { components: ['guest_management'] },
  attire:           { components: ['attire'] },

  // -- ACCESS & EVENT MANAGEMENT --------------------------------------------
  // access_codes is the canonical key used by ServicesTab and lc_pricing
  access_codes:     { components: ['access_codes'] },

  // additional_phase adds one more event phase to the capsule
  additional_phase: { components: ['additional_phase'] },

  // -- PRESERVE PILLAR ------------------------------------------------------
  publication:       { components: ['publication'] },
  ways_to_honour:    { components: ['ways_to_honour'] },
  expression_of_honour: { components: ['ways_to_honour'] },
  community_stories: { components: ['community_stories'] },

  // -- VALIDITY EXTENSIONS --------------------------------------------------
  extended_validity: { components: ['extended_validity'] },

  // -- CAPACITY PACKS (cumulative) ------------------------------------------
  capacity_pack_growth:      { components: ['capacity_pack_growth'] },
  capacity_pack_celebration: { components: ['capacity_pack_celebration'] },
  capacity_pack_grand:       { components: ['capacity_pack_grand'] },

  // -- LEGACY KEY ALIASES ---------------------------------------------------
  // Kept for backward compatibility with historical payments.
  // access_code_system previously mapped to guest_management (wrong).
  // Now correctly maps to access_codes.
  access_code_system: { components: ['access_codes'] },
  fabric_attire:      { components: ['attire'] },
  voice_tribute:      { components: ['audio_tributes'] },
  video_tribute_30s:  { components: ['video_tributes'] },
  video_tribute_60s:  { components: ['video_tributes'] },
  save_the_date:      { updates: { save_the_date_active: true } },
  table_management:   { components: ['guest_management'] },
  table_card_generation: { updates: { table_cards_active: true } },
  permanent_archive:  { updates: { permanent_archive: true } },
  white_label_branding: { updates: { white_label_active: true } },
  custom_domain:      { updates: { custom_domain_active: true } },
}

// ============================================================
// SECTION 4 -- Main unlock function
// Called by webhook after payment confirmed.
// ============================================================

export async function unlockCapsuleFeatures(payment_id: string): Promise<void> {

  // Fetch payment record
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
    console.warn(`[featureUnlocker] Skipped -- payment status is: ${payment.status}`)
    return
  }

  if (!payment.capsule_id) {
    console.error(`[featureUnlocker] No capsule_id on payment ${payment_id}`)
    return
  }

  // Resolve price keys -- check both package_tier and metadata.feature_ids
  const tierKeys: string[]  = (payment.package_tier ?? '').split(',').map((k: string) => k.trim()).filter(Boolean)
  const metaIds: string[]   = Array.isArray(payment.metadata?.feature_ids) ? payment.metadata.feature_ids : []
  const priceKeys: string[] = [...new Set([...tierKeys, ...metaIds])]

  const directUpdates: Record<string, unknown> = {}
  const componentsToAdd: string[] = []

  for (const key of priceKeys) {
    const def = FEATURE_MAP[key]
    if (!def) {
      console.warn(`[featureUnlocker] No FEATURE_MAP entry for price key: "${key}" -- add it to FEATURE_MAP`)
      continue
    }
    if (def.updates)    Object.assign(directUpdates, def.updates)
    if (def.components) componentsToAdd.push(...def.components)
  }

  if (Object.keys(directUpdates).length === 0 && componentsToAdd.length === 0) {
    console.warn(`[featureUnlocker] No features resolved for payment ${payment_id}. Keys received: ${priceKeys.join(', ')}`)
    return
  }

  // Fetch current components if we need to append
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
    const merged = [...new Set([...current, ...componentsToAdd])]
    directUpdates.components = merged
  }

  // Apply all updates in one operation
  const { error: updateError } = await db
    .from('capsules')
    .update(directUpdates)
    .eq('id', payment.capsule_id)

  if (updateError) {
    console.error('[featureUnlocker] Capsule update failed:', updateError)
    return
  }

  console.log(
    `[featureUnlocker] Capsule ${payment.capsule_id} unlocked -- payment ${payment_id}:`,
    JSON.stringify({ keys: priceKeys, updates: directUpdates })
  )
}
