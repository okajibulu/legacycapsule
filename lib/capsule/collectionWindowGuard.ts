// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/capsule/collectionWindowGuard.ts
// PURPOSE:   Shared helper — checks whether a capsule's collection window is
//            still open. Called by every submission endpoint so expiry is
//            enforced consistently without a cron job.
//
//            The "collection window" is the period during which guests can
//            contribute tributes and upload photos. When it closes, the capsule
//            itself (and its publication) remains permanently accessible.
//
// ARCHITECTURE: replaces the advisory-only free_tier_expires_at display.
//               Cron-based page_state flip was considered but avoided (Vercel
//               cron requires Pro plan). Instead each submission endpoint calls
//               this guard and rejects post-window requests directly.
//
// BUILT BY:  AI31 · Claude Sonnet 4.6 · 28 September 2026
// VERSION:   AI31v2.x.2
// ─────────────────────────────────────────────────────────────────────────────

// ═══ SECTION 1 — Types ═══

export interface WindowGuardResult {
  open:   boolean
  reason: 'active' | 'expired' | 'suspended' | 'closed'
}

// ═══ SECTION 2 — Guard function ═══

/**
 * Returns whether the capsule's collection window is open for guest submissions.
 *
 * @param pageState          capsule.page_state from DB
 * @param freeTierExpiresAt  capsule.free_tier_expires_at from DB (nullable)
 *
 * Priority order:
 *   1. suspended → always closed (admin override)
 *   2. page_state = 'closed' → closed (manual or future cron)
 *   3. free_tier_expires_at in the past → expired
 *   4. otherwise → open
 */
export function checkCollectionWindow(
  pageState:         string | null,
  freeTierExpiresAt: string | null,
): WindowGuardResult {
  if (pageState === 'suspended') {
    return { open: false, reason: 'suspended' }
  }

  if (pageState === 'closed') {
    return { open: false, reason: 'closed' }
  }

  if (freeTierExpiresAt) {
    const expiresAt = new Date(freeTierExpiresAt)
    if (expiresAt < new Date()) {
      return { open: false, reason: 'expired' }
    }
  }

  return { open: true, reason: 'active' }
}

// ═══ SECTION 3 — Human-readable error messages ═══

export const WINDOW_CLOSED_MESSAGES: Record<string, string> = {
  suspended: 'This tribute wall is currently unavailable.',
  closed:    'The contribution window for this tribute wall has closed.',
  expired:   'The contribution window for this tribute wall has closed.',
}
