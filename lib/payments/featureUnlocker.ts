// -----------------------------------------------------------------------------
// featureUnlocker.ts
// THE single source of truth mapping price keys -> capsule feature fields.
// Every price key in lc_pricing must have an entry in FEATURE_MAP.
// Every new product or add-on: add one row here. Nowhere else.
// Called by webhook handler after payment confirmed. Never called speculatively.
//
// page_state valid values (current):
//   pending_verification  - created, email not verified
//   pending_payment       - verified, awaiting Stripe confirmation
//   active                - live (free tier immediate, paid tier post-webhook)
//   expired               - Phase 2+
//   suspended             - admin action
// -----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js'

// -- DB CLIENT (server-only) ---------------------------------------------------
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// -- FEATURE MAP ---------------------------------------------------------------
// Maps lc_pricing.key -> capsule column updates applied on confirmed payment.
//
// Base tiers set page_state: 'active'. This is the only valid live state.
// 'tribute_collection' was a retired value, never use it.

const FEATURE_MAP: Record<string, Record<string, unknown>> = {
  // -- BASE TIERS --------------------------------------------------------------
  capture_preserve_base: { page_state: 'active', tier: 'capture_preserve' },
  full_platform_base:    { page_state: 'active', tier: 'full_platform' },

  // -- COORDINATE PILLAR ADD-ONS (Phase 2) ------------------------------------
  fabric_attire:         { fabric_attire_active: true },
  table_management:      { table_management_active: true },
  access_code_system:    { access_codes_active: true },
  save_the_date:         { save_the_date_active: true },
  table_card_generation: { table_cards_active: true },

  // -- CAPTURE PILLAR ADD-ONS (Phase 2/3) -------------------------------------
  voice_tribute:         { voice_tributes_active: true },
  video_tribute_30s:     { video_tributes_30s_active: true },
  video_tribute_60s:     { video_tributes_60s_active: true },

  // -- PRESERVE PILLAR ADD-ONS (Phase 3+) -------------------------------------
  permanent_archive:     { permanent_archive: true },
  white_label_branding:  { white_label_active: true },
  custom_domain:         { custom_domain_active: true },

  // -- STRUCTURAL ADD-ONS ------------------------------------------------------
  // Note: additional_phase increments a counter, not a boolean set.
  // Phase 2 handler will use rpc('increment') rather than direct assignment.
  additional_phase:      { extra_phases: 1 },
}

// -- MAIN UNLOCK FUNCTION ------------------------------------------------------
export async function unlockCapsuleFeatures(payment_id: string): Promise<void> {
  // -- FETCH PAYMENT RECORD ----------------------------------------------------
  const { data: payment, error } = await db
    .from('payments')
    .select('capsule_id, package_tier, status')
    .eq('id', payment_id)
    .single()

  if (error || !payment) {
    console.error(`[featureUnlocker] Payment not found: ${payment_id}`)
    return
  }

  // -- GUARD: only unlock on confirmed payment --------------------------------
  if (payment.status !== 'succeeded') {
    console.warn(`[featureUnlocker] Skipped - payment status is: ${payment.status}`)
    return
  }

  if (!payment.capsule_id) {
    console.error(`[featureUnlocker] No capsule_id on payment ${payment_id}`)
    return
  }

  // -- BUILD FEATURE UPDATE OBJECT --------------------------------------------
  // package_tier is comma-separated; supports single purchase and future bundles.
  const priceKeys = (payment.package_tier ?? '').split(',').map((k: string) => k.trim())
  const updates: Record<string, unknown> = {}

  for (const key of priceKeys) {
    const featureUpdate = FEATURE_MAP[key]
    if (featureUpdate) {
      Object.assign(updates, featureUpdate)
    } else {
      console.warn(`[featureUnlocker] No FEATURE_MAP entry for price key: ${key}`)
    }
  }

  if (Object.keys(updates).length === 0) {
    console.warn(`[featureUnlocker] No features resolved for payment ${payment_id}`)
    return
  }

  // -- APPLY TO CAPSULE --------------------------------------------------------
  const { error: updateError } = await db
    .from('capsules')
    .update(updates)
    .eq('id', payment.capsule_id)

  if (updateError) {
    console.error('[featureUnlocker] Capsule update failed:', updateError)
    return
  }

  console.log(
    `[featureUnlocker] Capsule ${payment.capsule_id} unlocked - payment ${payment_id}:`,
    JSON.stringify(updates)
  )
}
