// lib/payments/promoClaim.ts
// LegacyCapsule — Promo Slot Claim Helper
// AI29 · 25 September 2026
//
// ─── PURPOSE ───────────────────────────────────────────────────────────────
// Called from Stripe and Paystack webhook handlers immediately after a
// payment is confirmed as completed. Calls the atomic Postgres function
// lc_claim_promo_slot() which handles race conditions at the DB level.
//
// Both webhook handlers (app/api/webhooks/stripe/route.ts and
// app/api/webhooks/paystack/route.ts) should call tryClaimPromoSlot()
// after featureUnlocker runs, passing the verified payment's email,
// capsule_id, and payment row id.
//
// ─── SECTIONS ──────────────────────────────────────────────────────────────
//   1. tryClaimPromoSlot() — main entry point for webhook handlers
//   2. isFirstTimeCustomer() — check before slot claim (optional pre-check)
// ───────────────────────────────────────────────────────────────────────────

import { createClient }          from '@supabase/supabase-js'
import { invalidatePromoCache }  from './promoResolver'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── 1. tryClaimPromoSlot() ────────────────────────────────────────────────

export interface PromoClaimResult {
  claimed:       boolean | null  // null = no active promo
  slot?:         number          // which slot number they got (1-based)
  reason?:       string          // if claimed = false
  promo_label?:  string
  discount_pct?: number
}

/**
 * Attempts to consume a promo slot for a newly-verified paying customer.
 * Safe to call on every payment — the DB function handles:
 *   - No active promo  → returns { claimed: null }
 *   - Already claimed  → returns { claimed: false, reason: 'already_claimed' }
 *   - Limit reached    → returns { claimed: false, reason: 'limit_reached' }
 *   - Success          → returns { claimed: true, slot: N }
 *
 * After a successful claim, the in-memory promo cache is invalidated
 * so the next counter fetch reflects the updated count immediately.
 */
export async function tryClaimPromoSlot(
  organiserEmail: string,
  capsuleId:      string,
  paymentId:      string
): Promise<PromoClaimResult> {
  try {
    const { data, error } = await supabase.rpc('lc_claim_promo_slot', {
      p_organiser_email: organiserEmail.toLowerCase().trim(),
      p_capsule_id:      capsuleId,
      p_payment_id:      paymentId,
    })

    if (error) throw error

    const result = data as PromoClaimResult

    // Invalidate cache so banner reflects new count within 1 request cycle
    if (result.claimed === true) {
      invalidatePromoCache()
      console.log(
        `[promoClaim] Slot ${result.slot} claimed by ${organiserEmail} — promo: ${result.promo_label}`
      )
    }

    return result
  } catch (err) {
    // Non-fatal — promo claim failure must never break payment activation
    console.error('[promoClaim] tryClaimPromoSlot error (non-fatal):', err)
    return { claimed: null, reason: 'error' }
  }
}

// ── 2. isFirstTimeCustomer() ──────────────────────────────────────────────

/**
 * Returns true if the given email has no prior completed payments.
 * Used as a fast pre-check before calling the atomic DB function
 * (avoids the FOR UPDATE lock when clearly not a new customer).
 *
 * Note: the DB function also checks this — so this is optional
 * optimisation, not a safety gate.
 */
export async function isFirstTimeCustomer(organiserEmail: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .eq('organiser_email', organiserEmail.toLowerCase().trim())

    if (error) throw error
    return (count ?? 0) === 0
  } catch (err) {
    console.error('[promoClaim] isFirstTimeCustomer error:', err)
    return false  // safe default: don't attempt claim if we can't verify
  }
}
