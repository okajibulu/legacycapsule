// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/email/inferCapsuleStatus.ts
// PURPOSE: Infer capsule completion status from platform signals alone.
//          No organiser input required. Used by expiry banner and expiry email.
//          Returns one of four statuses that determine communication tone.
// ARCHITECTURE: LC05 Engagement Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Types
// ─────────────────────────────────────────────────────────────────────────────

export type CapsuleCompletionStatus =
  | 'complete'     // Event done, story preserved — soft notification, no pressure
  | 'wrapping_up'  // Event done, publication not yet compiled — gentle nudge
  | 'active'       // Capsule in active use — straightforward renewal
  | 'underused'    // Barely used — help email, not renewal email

export interface CapsuleSignals {
  event_date:             string | null
  contribution_count:     number
  last_contribution_at:   string | null  // ISO timestamp of last approved contribution
  has_publication_pdf:    boolean        // pdf_url is not null
  has_distributed:        boolean        // distributed_at is not null
  recent_contribution:    boolean        // any contribution in last 7 days
  organiser_recent:       boolean        // organiser active in last 14 days
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Inference logic
// Priority: strong completion signals first, then active signals, then underused
// ─────────────────────────────────────────────────────────────────────────────

export function inferCapsuleStatus(signals: CapsuleSignals): CapsuleCompletionStatus {
  const now = new Date()

  // ── Parse event date ─────────────────────────────────────────────────────
  const eventDate = signals.event_date ? new Date(signals.event_date) : null
  const eventDaysAgo = eventDate
    ? Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // ── Parse last contribution ───────────────────────────────────────────────
  const lastContrib = signals.last_contribution_at
    ? new Date(signals.last_contribution_at)
    : null
  const daysSinceLastContrib = lastContrib
    ? Math.floor((now.getTime() - lastContrib.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // ── ACTIVE override — never show completion messaging if capsule is live ──
  if (signals.recent_contribution || signals.organiser_recent) {
    if (signals.contribution_count < 3) return 'underused'
    return 'active'
  }

  // ── STRONG COMPLETION signals (any one = complete) ────────────────────────
  if (signals.has_distributed) return 'complete'

  if (eventDaysAgo !== null && eventDaysAgo > 30 && signals.contribution_count > 0) {
    return signals.has_publication_pdf ? 'complete' : 'wrapping_up'
  }

  if (daysSinceLastContrib !== null && daysSinceLastContrib > 45 && signals.contribution_count > 5) {
    return signals.has_publication_pdf ? 'complete' : 'wrapping_up'
  }

  // ── SUPPORTING signals ────────────────────────────────────────────────────
  const eventPast = eventDaysAgo !== null && eventDaysAgo > 0
  const quietFor21Days = daysSinceLastContrib !== null && daysSinceLastContrib > 21
  const hasPublication = signals.has_publication_pdf

  const supportingCount = [eventPast, quietFor21Days, hasPublication].filter(Boolean).length

  if (supportingCount >= 2) {
    return hasPublication ? 'complete' : 'wrapping_up'
  }

  // ── UNDERUSED — low engagement, no clear event completion ─────────────────
  if (signals.contribution_count < 3) return 'underused'

  // ── Default: treat as active ──────────────────────────────────────────────
  return 'active'
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Banner copy per status
// Used by manage dashboard expiry banner
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpiryBannerContent {
  tone:    'success' | 'info' | 'warning' | 'muted'
  heading: string
  body:    string
  cta:     string | null
  ctaHref: string | null
}

export function getExpiryBannerContent(
  status: CapsuleCompletionStatus,
  honoureeName: string,
  daysUntilExpiry: number,
  capsuleSlug: string,
): ExpiryBannerContent {
  switch (status) {

    case 'complete':
      return {
        tone: 'success',
        heading: `${honoureeName}'s legacy is preserved`,
        body: `This capsule has gathered its community and told its story. It remains accessible at your link. If you'd like to extend its life permanently, Extended Validity is available from your Services tab.`,
        cta: null,
        ctaHref: null,
      }

    case 'wrapping_up':
      return {
        tone: 'info',
        heading: `Ready to compile the final record?`,
        body: `This capsule has ${daysUntilExpiry} days remaining. The tributes are gathered — a Digital Publication will preserve them permanently before the capsule closes.`,
        cta: 'Generate Publication',
        ctaHref: `/manage/${capsuleSlug}/publication`,
      }

    case 'active':
      return {
        tone: 'warning',
        heading: `Your capsule closes in ${daysUntilExpiry} days`,
        body: `Voices are still arriving. Extend your capsule to keep the tribute wall open and continue gathering contributions.`,
        cta: 'Extend Access',
        ctaHref: `/manage/${capsuleSlug}?tab=services`,
      }

    case 'underused':
      return {
        tone: 'muted',
        heading: `Your capsule is still waiting`,
        body: `${honoureeName}'s tribute wall hasn't gathered many voices yet. Share the link with friends and family — there's still time.`,
        cta: 'Share Your Capsule',
        ctaHref: `/for/${capsuleSlug}`,
      }
  }
}
