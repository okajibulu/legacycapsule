// ───────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/activity/logAction.ts
// PURPOSE:   Shared utility for writing to capsule_activity_log.
//            Called by every API route that performs a logged action.
//            NEVER throws — activity log failure must never fail the
//            parent operation. Fire and forget pattern.
//            SERVER-SIDE ONLY. Never import in client components.
// ARCHITECTURE: CA-SPEC-001 — Step 2.
//               capsule_activity_log is append-only.
//               action_label is plain English, stored at write time.
//               Never computed from action_key at display time.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.09
// DATE:      16 August 2026
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — Types ═══

export type ActorType =
  | 'organiser'
  | 'family_rep_elder'
  | 'family_rep_full_access'
  | 'coadmin'
  | 'system'

export interface LogActionParams {
  capsule_id:    string
  actor_type:    ActorType
  actor_id?:     string    // account UUID | 'organiser' | 'system'
  actor_name?:   string    // display name at time of action
  actor_email?:  string    // email at time of action
  action_key:    string    // e.g. 'contribution.approved', 'team.elder_invited'
  action_label:  string    // plain English — e.g. 'Fatima approved a tribute from James'
  entity_type?:  string    // e.g. 'contribution', 'capsule_account', 'gift_credential'
  entity_id?:    string    // UUID of affected entity
  payload?:      Record<string, unknown>  // additional context
}

// ═══ SECTION 3 — Log writer ═══
// Non-blocking — never throws.
// Always resolves, even on DB error.

export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const { error } = await db
      .from('capsule_activity_log')
      .insert({
        capsule_id:   params.capsule_id,
        actor_type:   params.actor_type,
        actor_id:     params.actor_id     ?? null,
        actor_name:   params.actor_name   ?? null,
        actor_email:  params.actor_email  ?? null,
        action_key:   params.action_key,
        action_label: params.action_label,
        entity_type:  params.entity_type  ?? null,
        entity_id:    params.entity_id    ?? null,
        payload:      params.payload      ?? null,
      })

    if (error) {
      // Log to server console only — never surface to caller
      console.warn('[logAction] Failed to write activity log entry:', error.message, {
        action_key: params.action_key,
        capsule_id: params.capsule_id,
      })
    }
  } catch (err) {
    // Truly non-fatal — swallow completely
    console.warn('[logAction] Unexpected error:', err)
  }
}

// ═══ SECTION 4 — Action key conventions ═══
// Reference: [domain].[verb]
// Import these constants in API routes to avoid typos.

export const ACTION_KEYS = {
  // Contributions
  CONTRIBUTION_APPROVED:     'contribution.approved',
  CONTRIBUTION_REJECTED:     'contribution.rejected',
  CONTRIBUTION_DELETED:      'contribution.deleted',
  CONTRIBUTION_EDITED:       'contribution.edited',

  // Stories
  STORY_APPROVED:            'story.approved',
  STORY_REJECTED:            'story.rejected',
  STORY_DELETED:             'story.deleted',
  STORY_EDITED:              'story.edited',

  // Tributes — family rep response
  TRIBUTE_RESPONSE_POSTED:   'tribute.response_posted',
  TRIBUTE_RESPONSE_EDITED:   'tribute.response_edited',
  TRIBUTE_RESPONSE_DELETED:  'tribute.response_deleted',

  // EOH
  EOH_ACKNOWLEDGED:          'eoh.acknowledged',

  // Family Appreciation
  APPRECIATION_CREATED:      'appreciation.created',
  APPRECIATION_EDITED:       'appreciation.edited',

  // Capsule details
  CAPSULE_FIELD_UPDATED:     'capsule.field_updated',
  CAPSULE_THEME_CHANGED:     'capsule.theme_changed',

  // Team accounts
  TEAM_ELDER_INVITED:        'team.elder_invited',
  TEAM_ELDER_REVOKED:        'team.elder_revoked',
  TEAM_ELDER_RESENT:         'team.elder_resent',
  TEAM_FULL_ACCESS_INVITED:  'team.full_access_invited',
  TEAM_FULL_ACCESS_REVOKED:  'team.full_access_revoked',
  TEAM_COADMIN_INVITED:      'team.coadmin_invited',
  TEAM_COADMIN_REVOKED:      'team.coadmin_revoked',
  TEAM_COADMIN_PERMISSIONS:  'team.coadmin_permissions_updated',
  TEAM_ORGANISER_UPGRADED:   'team.organiser_upgraded_to_full_access',

  // Orders
  ORDER_PLACED:              'order.placed',

  // Settings
  NOTIFICATIONS_UPDATED:     'settings.notifications_updated',

  // Danger zone
  CAPSULE_DELETE_ATTEMPTED:  'capsule.delete_attempted',
  CAPSULE_DELETED:           'capsule.deleted',

  // Gift Collection (GCS)
  GIFT_MANIFEST_ITEM_ADDED:  'gift.manifest_item_added',
  GIFT_CODE_GENERATED:       'gift.code_generated',
  GIFT_CODE_BLOCKED:         'gift.code_blocked',
  GIFT_COLLECTED:            'gift.collected',
  GIFT_OVERRIDE:             'gift.organiser_override',

  // Event Display (EDS)
  DISPLAY_STARTED:           'display.started',
  DISPLAY_STOPPED:           'display.stopped',
  DISPLAY_PHOTO_APPROVED:    'display.photo_approved',
  DISPLAY_PHOTO_REMOVED:     'display.photo_removed',
  DISPLAY_EXPORTED:          'display.exported',

  // Publication
  PUBLICATION_EXPORTED:      'publication.exported',
} as const