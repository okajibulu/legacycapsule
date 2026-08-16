// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/payments/featureUnlocker.ts
// PURPOSE:   THE single source of truth mapping price keys to capsule activation.
//            Every price key in lc_pricing must have an entry in FEATURE_MAP.
//            Every new product or add-on: add one row here. Nowhere else.
//            Called by webhook handler after payment confirmed.
//            Never called speculatively — only after payment.status = succeeded.
// ARCHITECTURE: LC04 Payment Engine
// BUILT BY:  AI13 · Claude Opus 4.6 · 22 July 2026
// UPDATED:   AI20 · Claude Opus 4.6 · 11 August 2026 (v2.11.97)
//            — capsule_extend_3mo, publication auto-extension, preset aliases
// UPDATED:   AI20 · Claude Opus 4.6 · 13 August 2026 (v2.12.01)
//            — Sprint 2: all Sprint 1 commercial model keys added:
//              capsule_activation_base, contribution_tier_*,
//              access_code_*_block, capsule_extend_6mo,
//              capsule_reactivation_admin
//            — extendCapsuleValidity() now writes capsule_lifecycle_events
//            — logLifecycleEvent() helper added
//            — voice_ceiling column now updated on tier upgrades
//            — lifecycle_state, contribution_tier, activated_at now set
//              on base activation
//            — Estate-∞V sets voice_ceiling to NULL (unlimited)
// VERSION:   AI20v2.12.01
// DATE:      13 August 2026
//
// VALIDITY EXTENSION RULES (per founder spec):
//   Free tier:               90 days from first tribute (set at tribute creation)
//   capsule_activation_base: 6 months from first tribute (sets validity_months=6)
//   capsule_extend_6mo:      +6 months from current expiry
//   capsule_extend_3mo:      +3 months (legacy — kept for backward compat)
//   publication key:         automatic +3 months (bonus for buying publication)
//   Extended validity (archive): 6 months max per purchase
//
// TIER STRUCTURE (V = Voices = tributes + stories combined):
//   foundation_150v  → 150  voices ceiling (included in base activation)
//   growing_350v     → 350  voices ceiling
//   flourishing_700v → 700  voices ceiling
//   grand_1500v      → 1500 voices ceiling
//   estate_v         → NULL (unlimited)
//
// ACCESS CODE BLOCKS (G = Guests):
//   Standard-150G included in access_codes base purchase
//   extended_400g / large_800g / grand_2000g / estate_g are upgrade blocks
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

// ── Batch notify import (wall re-open trigger) ────────────────────────────────
// Dynamically resolved at runtime to avoid circular import risks.
// Called after contribution tier upgrades — never blocks payment unlock.
const TIER_UPGRADE_KEYS = new Set([
  'contribution_tier_growing_350v',
  'contribution_tier_flourishing_700v',
  'contribution_tier_grand_1500v',
  'contribution_tier_estate_v',
])

// ═══ SECTION 1 — DB client (server-only) ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Feature definition type ═══
// updates:      direct column assignments on the capsules table
// components:   component IDs to append to capsule.components array
// extends:      validity extension in months
// tier:         contribution_tier key to set on capsule
// voice_ceiling: new voice_ceiling value (null = unlimited for Estate-∞V)
// access_block: access_code_block key to set on capsule
// lifecycle:    lifecycle_state to set on capsule
// log_event:    event_type to write to capsule_lifecycle_events

interface FeatureDefinition {
  updates?:       Record<string, unknown>
  components?:    string[]
  extends?:       number
  tier?:          string                    // contribution_tier value
  voice_ceiling?: number | null             // null = unlimited
  access_block?:  string                    // access_code_block value
  lifecycle?:     string                    // lifecycle_state value
  log_event?:     string                    // event type for audit log
}

// ═══ SECTION 3 — Lifecycle event logger ═══
// Non-blocking — a failed log never stops the unlock.

async function logLifecycleEvent(
  capsule_id: string,
  event_type: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    await db.from('capsule_lifecycle_events').insert({
      capsule_id,
      event_type,
      payload:    payload ?? null,
      created_by: 'webhook',
    })
  } catch (err) {
    console.warn(`[featureUnlocker] logLifecycleEvent failed (non-fatal): ${event_type}`, err)
  }
}

// ═══ SECTION 4 — Feature map ═══
// Maps lc_pricing.key → feature activation definition.
//
// RULES:
//   'tribute_collection' page_state is retired — never use it.
//   components array drives ALL UI visibility.
//   extends value is ADDITIVE — always adds to existing expiry, never resets.
//   voice_ceiling: set on upgrade — null = unlimited (Estate-∞V).
//   Estate-∞V/G: sets respective column to a sentinel that the limits API
//   treats as unlimited (NULL in DB = no ceiling).

const FEATURE_MAP: Record<string, FeatureDefinition> = {

  // ── Base activation — NEW (Sprint 1) ─────────────────────────────────────
  // Sets lifecycle_state, contribution_tier, voice_ceiling, activated_at.
  // Extends validity by 6 months from first tribute.
  // Foundation-150V is the starting tier — included in base activation.
  capsule_activation_base: {
    updates: {
      page_state:        'active',
      lifecycle_state:   'active',
      contribution_tier: 'foundation_150v',
      voice_ceiling:     150,
      validity_months:   6,
      activated_at:      new Date().toISOString(),
    },
    extends:   6,
    log_event: 'activated',
  },

  // ── Legacy activation keys — kept for backward compat ────────────────────
  capsule_activation: {
    updates: { page_state: 'active', lifecycle_state: 'active' },
    log_event: 'activated',
  },
  capture_preserve_base: {
    updates: {
      page_state:        'active',
      lifecycle_state:   'active',
      tier:              'capture_preserve',
      contribution_tier: 'foundation_150v',
      voice_ceiling:     150,
      validity_months:   6,
    },
    extends:   6,
    log_event: 'activated',
  },
  full_platform_base: {
    updates: {
      page_state:        'active',
      lifecycle_state:   'active',
      tier:              'full_platform',
      contribution_tier: 'foundation_150v',
      voice_ceiling:     150,
      validity_months:   6,
    },
    extends:   6,
    log_event: 'activated',
  },

  // ── Contribution tier upgrades — NEW (Sprint 1) ───────────────────────────
  // Each upgrade sets contribution_tier + voice_ceiling on the capsule.
  // voice_ceiling NULL = unlimited (Estate-∞V).
  // Logs a tier_upgraded lifecycle event.

  contribution_tier_growing_350v: {
    updates:       { contribution_tier: 'growing_350v', voice_ceiling: 350 },
    log_event:     'tier_upgraded',
  },

  contribution_tier_flourishing_700v: {
    updates:       { contribution_tier: 'flourishing_700v', voice_ceiling: 700 },
    log_event:     'tier_upgraded',
  },

  contribution_tier_grand_1500v: {
    updates:       { contribution_tier: 'grand_1500v', voice_ceiling: 1500 },
    log_event:     'tier_upgraded',
  },

  contribution_tier_estate_v: {
    // NULL voice_ceiling = unlimited. Supabase allows null on numeric columns.
    updates:       { contribution_tier: 'estate_v', voice_ceiling: null },
    log_event:     'tier_upgraded',
  },

  // ── Access code volume block upgrades — NEW (Sprint 1) ────────────────────
  // Standard-150G is included in access_codes base purchase (no separate key).
  // Extended/Large/Grand/Estate upgrade the access_code_block on the capsule.

  access_code_extended_400g: {
    updates:   { access_code_block: 'extended_400g' },
    log_event: 'access_block_upgraded',
  },

  access_code_large_800g: {
    updates:   { access_code_block: 'large_800g' },
    log_event: 'access_block_upgraded',
  },

  access_code_grand_2000g: {
    updates:   { access_code_block: 'grand_2000g' },
    log_event: 'access_block_upgraded',
  },

  access_code_estate_g: {
    updates:   { access_code_block: 'estate_g' },
    log_event: 'access_block_upgraded',
  },

  // ── Validity extensions ───────────────────────────────────────────────────
  // 6-month extension — standard paid extension (replaces old 3mo for new model)
  capsule_extend_6mo: {
    extends:   6,
    log_event: 'extended',
  },

  // 3-month extension — kept for legacy payments + publication bonus
  capsule_extend_3mo: {
    extends:   3,
    log_event: 'extended',
  },

  // Annual archive: 12 months — max 1 year at a time
  extended_validity: {
    extends:    6,   // Updated: 6 months per founder spec (was 12)
    components: ['extended_validity'],
    log_event:  'extended',
  },

  // ── Reactivation admin charge — NEW (Sprint 1) ────────────────────────────
  // Admin fee component of reactivation payment.
  // No capsule column changes — the extension (capsule_extend_6mo) handles
  // the actual reactivation. This key just logs the admin charge was paid.
  capsule_reactivation_admin: {
    updates:   { lifecycle_state: 'active' },
    log_event: 'reactivated',
  },

  // ── Capture pillar ────────────────────────────────────────────────────────
  audio_tributes: { components: ['audio_tributes'] },
  video_tributes: { components: ['video_tributes'] },

  // ── Preserve pillar ───────────────────────────────────────────────────────
  // publication: activates Digital Capsule Publication + auto-grants +3 months
  publication: {
    components: ['publication'],
    extends:    3,
  },

  ways_to_honour:       { components: ['ways_to_honour'] },
  expression_of_honour: { components: ['ways_to_honour'] },  // alias
  community_stories:    { components: ['community_stories'] },

  // ── Coordinate pillar ─────────────────────────────────────────────────────
  // access_codes: activates the feature + sets Standard-150G block by default
  access_codes: {
    components: ['access_codes'],
    updates:    { access_code_block: 'standard_150g' },
  },
  guest_management: { components: ['guest_management'] },
  attire:           { components: ['attire'] },
  additional_phase: { components: ['additional_phase'] },

  // ── Legacy capacity packs ─────────────────────────────────────────────────
  // Superseded by access_code volume blocks for new model.
  // Kept for backward compatibility with historical payments.
  capacity_pack_growth:      { components: ['capacity_pack_growth']      },
  capacity_pack_celebration: { components: ['capacity_pack_celebration'] },
  capacity_pack_grand:       { components: ['capacity_pack_grand']       },

  // ── Preset aliases ────────────────────────────────────────────────────────
  essential_preset: {
    components: ['publication', 'audio_tributes', 'video_tributes'],
    extends:    3,
  },
  signature_preset: {
    components: ['publication', 'audio_tributes', 'video_tributes', 'access_codes', 'ways_to_honour', 'additional_phase'],
    updates:    { access_code_block: 'standard_150g' },
    extends:    3,
  },

  // ── Legacy key aliases ────────────────────────────────────────────────────
  access_code_system:    { components: ['access_codes'], updates: { access_code_block: 'standard_150g' } },
  fabric_attire:         { components: ['attire'] },
  voice_tribute:         { components: ['audio_tributes'] },
  video_tribute_30s:     { components: ['video_tributes'] },
  video_tribute_60s:     { components: ['video_tributes'] },
  save_the_date:         { updates: { save_the_date_active: true } },
  table_management:      { components: ['guest_management'] },
  table_card_generation: { updates: { table_cards_active: true } },
  permanent_archive:     { extends: 6,  components: ['extended_validity'] },
  white_label_branding:  { updates: { white_label_active: true } },
  custom_domain:         { updates: { custom_domain_active: true } },
}

// ═══ SECTION 5 — Validity extension helper ═══
// Adds months to capsule.expires_at.
// If expires_at is null or in the past, starts from today.
// Always additive — never resets existing expiry.
// Max 6 months per call (founder spec: max 6mo extension at a time).
// Writes a lifecycle event on success.

async function extendCapsuleValidity(
  capsule_id: string,
  months: number,
  logEvent = true
): Promise<void> {
  const safeMonths = Math.min(months, 6)  // max 6 months per extension

  const { data: capsule, error } = await db
    .from('capsules')
    .select('expires_at')
    .eq('id', capsule_id)
    .single()

  if (error || !capsule) {
    console.error(`[featureUnlocker] Could not fetch capsule for validity extension: ${capsule_id}`)
    return
  }

  const base = capsule.expires_at && new Date(capsule.expires_at) > new Date()
    ? new Date(capsule.expires_at)
    : new Date()

  const newExpiry = new Date(base)
  newExpiry.setMonth(newExpiry.getMonth() + safeMonths)

  await db
    .from('capsules')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('id', capsule_id)

  if (logEvent) {
    await logLifecycleEvent(capsule_id, 'extended', {
      months_added: safeMonths,
      new_expiry:   newExpiry.toISOString().slice(0, 10),
    })
  }

  console.log(
    `[featureUnlocker] Capsule ${capsule_id} validity extended +${safeMonths} months → ${newExpiry.toISOString().slice(0, 10)}`
  )
}

// ═══ SECTION 6 — Main unlock function ═══
// Called by webhook handler after payment confirmed.
// Resolves price keys → feature activations → applies all in one DB operation.
// Validity extensions and lifecycle events applied after column updates.

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
  const tierKeys: string[]  = (payment.package_tier ?? '').split(',').map((k: string) => k.trim()).filter(Boolean)
  const metaIds: string[]   = Array.isArray(payment.metadata?.feature_ids)
    ? payment.metadata.feature_ids
    : []
  const priceKeys: string[] = [...new Set([...tierKeys, ...metaIds])]

  const directUpdates: Record<string, unknown> = {}
  const componentsToAdd: string[] = []
  let   totalExtensionMonths = 0
  const lifecycleEvents: Array<{ event: string; payload?: Record<string, unknown> }> = []

  for (const key of priceKeys) {
    const def = FEATURE_MAP[key]
    if (!def) {
      console.warn(`[featureUnlocker] No FEATURE_MAP entry for: "${key}" — add it to FEATURE_MAP`)
      continue
    }
    if (def.updates)    Object.assign(directUpdates, def.updates)
    if (def.components) componentsToAdd.push(...def.components)
    if (def.extends)    totalExtensionMonths += def.extends
    if (def.log_event)  lifecycleEvents.push({
      event:   def.log_event,
      payload: { key, payment_id },
    })
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
  if (totalExtensionMonths > 0) {
    try {
      // logEvent = false here — lifecycle events written separately below
      await extendCapsuleValidity(payment.capsule_id, totalExtensionMonths, false)
    } catch (extErr) {
      console.error('[featureUnlocker] Validity extension failed (non-fatal):', extErr)
    }
  }

  // ── Write lifecycle events ────────────────────────────────────────────────
  // Non-blocking — written after all DB changes applied.
  for (const le of lifecycleEvents) {
    await logLifecycleEvent(
      payment.capsule_id,
      le.event,
      { ...le.payload, months_extended: totalExtensionMonths > 0 ? totalExtensionMonths : undefined }
    )
  }

  console.log(
    `[featureUnlocker] Capsule ${payment.capsule_id} unlocked — payment ${payment_id}:`,
    JSON.stringify({
      keys:       priceKeys,
      updates:    Object.keys(directUpdates),
      extended:   totalExtensionMonths > 0 ? `+${totalExtensionMonths} months` : 'none',
      events:     lifecycleEvents.map(e => e.event),
    })
  )

  // ── Batch notify — invite queued contributors back after tier upgrade ─────
  // Fires when any contribution tier upgrade key is in the payment.
  // Non-blocking — a notify failure never fails the payment unlock.
  // Requires capsule slug — fetched here so batch-notify route can build return URLs.
  const hasTierUpgrade = priceKeys.some(k => TIER_UPGRADE_KEYS.has(k))
  if (hasTierUpgrade) {
    try {
      const { data: slugRow } = await db
        .from('capsules')
        .select('slug')
        .eq('id', payment.capsule_id)
        .single()

      if (slugRow?.slug) {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

        // Fire and forget — do not await response, never throw
        fetch(`${appUrl}/api/capsule/batch-notify`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            capsule_id:   payment.capsule_id,
            capsule_slug: slugRow.slug,
          }),
        }).catch(err => {
          console.warn('[featureUnlocker] batch-notify fire failed (non-fatal):', err)
        })

        console.log(`[featureUnlocker] batch-notify triggered for capsule ${payment.capsule_id} (tier upgrade: ${priceKeys.filter(k => TIER_UPGRADE_KEYS.has(k)).join(', ')})`)
      }
    } catch (notifyErr) {
      // Truly non-fatal — log and move on
      console.warn('[featureUnlocker] batch-notify setup failed (non-fatal):', notifyErr)
    }
  }
}