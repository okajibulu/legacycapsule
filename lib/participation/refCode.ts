// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/participation/refCode.ts
// PURPOSE: Attribution engine utilities for LC-PARTICIPATION-001
// OWNER: AI7 — Phase 1
// SERVER-SIDE ONLY — never import into 'use client' components
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Supabase service client
// ─────────────────────────────────────────────────────────────────────────────

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Ref code generation
// 8-char alphanumeric, no ambiguous characters (I, O, 0, 1)
// Same convention as verification codes used elsewhere in the platform
// Generated ONLY at tribute approval time — never at submission
// ─────────────────────────────────────────────────────────────────────────────

const REF_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 chars — no I, O, 0, 1
const REF_LENGTH = 8

/**
 * Generate a cryptographically random ref code.
 * Uses crypto.randomBytes mapped to the safe charset.
 * Uniqueness enforced by UNIQUE constraint on contributions.ref_code.
 */
export function generateRefCode(): string {
  const bytes = crypto.randomBytes(REF_LENGTH)
  let code = ''
  for (let i = 0; i < REF_LENGTH; i++) {
    code += REF_CHARSET[bytes[i] % REF_CHARSET.length]
  }
  return code
}

/**
 * Generate a ref code with retry logic for the rare case of a collision.
 * Writes the code to the contribution record.
 * Returns the generated ref code.
 */
export async function assignRefCode(contributionId: string): Promise<string> {
  const MAX_RETRIES = 3
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateRefCode()
    const { error } = await adminClient
      .from('contributions')
      .update({ ref_code: code })
      .eq('id', contributionId)
      .is('ref_code', null) // only write if not already assigned

    if (!error) return code

    // If error is a unique constraint violation, retry with new code
    if (error.code === '23505') continue

    // Any other error — log and throw
    console.error('[assignRefCode] Unexpected error:', error)
    throw new Error(`Failed to assign ref code: ${error.message}`)
  }

  throw new Error('[assignRefCode] Exhausted retries — ref code collision')
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Participation summary update
// Called from the approval API after every tribute approval (K5).
// Upserts capsule_participation_summary with fresh counts.
// Must be fast — runs synchronously in the approval response.
// If it fails, the error is logged but does NOT block the approval.
// ─────────────────────────────────────────────────────────────────────────────

export async function updateParticipationSummary(capsuleId: string): Promise<void> {
  try {
    // 1. Count approved contributions → contributor_count
    const { count: contributorCount } = await adminClient
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)

    // 2. Count approved contributions with photos → photo_count
    const { count: photoCount } = await adminClient
      .from('contributions')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .not('thumbnail_url', 'is', null)

    // 3. Count distinct countries from approved contributions → country_count
    const { data: countryData } = await adminClient
      .from('contributions')
      .select('country')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)

    const uniqueCountries = new Set(
      (countryData ?? []).map(r => r.country).filter(Boolean)
    )

    // 4. Count share events → share_count
    const { count: shareCount } = await adminClient
      .from('capsule_share_events')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)

    // 5. Count approved contributions WITH attribution rows → attributed_contrib_count
    //    These are contributions where someone arrived via a ref link
    const { data: attributedData } = await adminClient
      .from('contribution_attribution')
      .select('contribution_id')
      .eq('capsule_id', capsuleId)

    const attributedIds = new Set((attributedData ?? []).map(r => r.contribution_id))

    // Cross-check: only count attributions where the contribution is actually approved
    let attributedApprovedCount = 0
    if (attributedIds.size > 0) {
      const { count } = await adminClient
        .from('contributions')
        .select('id', { count: 'exact', head: true })
        .eq('capsule_id', capsuleId)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .in('id', Array.from(attributedIds))

      attributedApprovedCount = count ?? 0
    }

    // 6. Count legacy builders → legacy_builder_count
    const { count: builderCount } = await adminClient
      .from('capsule_legacy_builders')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)

    // 7. Upsert into capsule_participation_summary
    const { error: upsertError } = await adminClient
      .from('capsule_participation_summary')
      .upsert(
        {
          capsule_id: capsuleId,
          contributor_count: contributorCount ?? 0,
          photo_count: photoCount ?? 0,
          country_count: uniqueCountries.size,
          share_count: shareCount ?? 0,
          legacy_builder_count: builderCount ?? 0,
          attributed_contrib_count: attributedApprovedCount,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'capsule_id' }
      )

    if (upsertError) {
      console.error('[updateParticipationSummary] Upsert failed:', upsertError)
    }
  } catch (err) {
    // Log but never block the approval response
    console.error('[updateParticipationSummary] Error (non-fatal):', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ExistingBuilder = {
  contribution_id: string
  rank_position: number | null
  milestone_1_sent: boolean
  milestone_2_sent: boolean
  milestone_3_sent: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Legacy Builder recalculation
// Called after participation summary update.
// Only runs if attributed_contrib_count >= activation threshold.
// Recalculates top 5 contributors by ref_count, assigns tiers,
// respects consent for display name, checks milestone emails.
//
// Phase 1: ORDER BY ref_count DESC (raw count)
// Phase 2: Will use diversity_score / ranking_score columns
//          — no migration needed, columns already present
// ─────────────────────────────────────────────────────────────────────────────

export async function recalculateLegacyBuilders(capsuleId: string): Promise<void> {
  try {
    // ── Check activation threshold ──
    const { data: capsuleData } = await adminClient
      .from('capsules')
      .select('legacy_builder_activation_threshold')
      .eq('id', capsuleId)
      .single()

    const threshold = capsuleData?.legacy_builder_activation_threshold ?? 10

    const { data: summaryData } = await adminClient
      .from('capsule_participation_summary')
      .select('attributed_contrib_count')
      .eq('capsule_id', capsuleId)
      .single()

    const attributedCount = summaryData?.attributed_contrib_count ?? 0

    if (attributedCount < threshold) {
      // Below threshold — no legacy builders to display yet
      return
    }

    // ── Get all approved contributions that have ref codes ──
    const { data: refContribs } = await adminClient
      .from('contributions')
      .select('id, contributor_name, ref_code, legacy_builder_consent')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .not('ref_code', 'is', null)

    if (!refContribs || refContribs.length === 0) return

    // ── For each contribution with a ref_code, count how many
    //    OTHER approved contributions have attribution rows pointing to it ──
    const builderScores: Array<{
      contributionId: string
      contributorName: string
      refCode: string
      consent: boolean
      refCount: number
    }> = []

    for (const contrib of refContribs) {
      // Count approved contributions attributed to this ref code
      const { data: attributedContribs } = await adminClient
        .from('contribution_attribution')
        .select('contribution_id')
        .eq('ref_code', contrib.ref_code)
        .eq('capsule_id', capsuleId)

      // Cross-check: only count if the attributed contribution is approved
      let approvedRefCount = 0
      if (attributedContribs && attributedContribs.length > 0) {
        const attrIds = attributedContribs.map(a => a.contribution_id)
        const { count } = await adminClient
          .from('contributions')
          .select('id', { count: 'exact', head: true })
          .eq('capsule_id', capsuleId)
          .eq('status', 'approved')
          .is('deleted_at', null)
          .in('id', attrIds)

        approvedRefCount = count ?? 0
      }

      if (approvedRefCount > 0) {
        builderScores.push({
          contributionId: contrib.id,
          contributorName: contrib.contributor_name,
          refCode: contrib.ref_code,
          consent: contrib.legacy_builder_consent ?? false,
          refCount: approvedRefCount,
        })
      }
    }

    // ── Sort by ref_count descending, take top 5 ──
    // Phase 1: raw ref_count sort
    // Phase 2: replace with ranking_score / diversity_score composite
    builderScores.sort((a, b) => b.refCount - a.refCount)
    const top5 = builderScores.slice(0, 5)

    // ── Fetch existing builder rows for milestone tracking ──
const { data: rawBuilders } = await adminClient
      .from('capsule_legacy_builders')
      .select('contribution_id, rank_position, milestone_1_sent, milestone_2_sent, milestone_3_sent')
      .eq('capsule_id', capsuleId)


const existingBuilders: ExistingBuilder[] = (rawBuilders ?? []) as unknown as ExistingBuilder[]

    const existingMap = new Map<string, ExistingBuilder>(
      existingBuilders.map(b => [b.contribution_id, b])
    )

    // ── Assign tiers and upsert ──
    for (let i = 0; i < top5.length; i++) {
      const builder = top5[i]
      const position = i + 1
      const tier =
        position === 1
          ? 'lead_legacy_builder'
          : position <= 3
            ? 'legacy_builder'
            : 'community_builder'

      const displayName = builder.consent
        ? builder.contributorName
        : 'Community Member'

      const existing: ExistingBuilder | undefined = existingMap.get(builder.contributionId)

      const { error: upsertError } = await adminClient
        .from('capsule_legacy_builders')
        .upsert(
          {
            capsule_id: capsuleId,
            contribution_id: builder.contributionId,
            contributor_name: builder.contributorName,
            display_name: displayName,
            ref_code: builder.refCode,
            ref_count: builder.refCount,
            recognition_tier: tier,
            rank_position: position,
            // Preserve milestone flags from existing record
            milestone_1_sent: existing?.milestone_1_sent ?? false,
            milestone_2_sent: existing?.milestone_2_sent ?? false,
            milestone_3_sent: existing?.milestone_3_sent ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'capsule_id,contribution_id' }
        )

      if (upsertError) {
        console.error('[recalculateLegacyBuilders] Upsert failed:', upsertError)
        continue
      }

      // ── Milestone email checks ──
      // Milestone 1: New entry into top 5 AND not already sent
      if (!existing?.milestone_1_sent) {
        await sendMilestoneEmail(capsuleId, builder.contributionId, 1)
      }

      // Milestone 2: New entry into top 3 AND not already sent
if (position <= 3 && !existing?.milestone_2_sent) {        const wasInTop3 = existing?.rank_position != null && existing.rank_position <= 3
        if (!wasInTop3) {
          await sendMilestoneEmail(capsuleId, builder.contributionId, 2)
        }
      }

      // Milestone 3: Position #1 AND not already sent
      if (position === 1 && !existing?.milestone_3_sent) {
        const wasPosition1 = existing?.rank_position === 1
        if (!wasPosition1) {
          await sendMilestoneEmail(capsuleId, builder.contributionId, 3)
        }
      }
    }

    // ── Remove builders who fell out of top 5 ──
    // Rankings never reset (K6), but position data updates
    const top5Ids = top5.map(b => b.contributionId)
    if (existingBuilders && existingBuilders.length > 0) {
      const droppedIds = existingBuilders
        .map(b => b.contribution_id)
        .filter(id => !top5Ids.includes(id))

      if (droppedIds.length > 0) {
        // Set rank_position to null but keep the record (K6: rankings never reset)
        await adminClient
          .from('capsule_legacy_builders')
          .update({ rank_position: null, updated_at: new Date().toISOString() })
          .eq('capsule_id', capsuleId)
          .in('contribution_id', droppedIds)
      }
    }

    // ── Update legacy_builder_count in summary ──
    const { count: finalBuilderCount } = await adminClient
      .from('capsule_legacy_builders')
      .select('id', { count: 'exact', head: true })
      .eq('capsule_id', capsuleId)
      .not('rank_position', 'is', null)

    await adminClient
      .from('capsule_participation_summary')
      .update({
        legacy_builder_count: finalBuilderCount ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('capsule_id', capsuleId)

  } catch (err) {
    // Log but never block the approval response
    console.error('[recalculateLegacyBuilders] Error (non-fatal):', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Milestone email dispatch
// Sends recognition emails when a contributor crosses a milestone threshold.
// Each milestone fires once only — flag set to true after send.
// Email content per Section 8 of the handoff document.
// ─────────────────────────────────────────────────────────────────────────────

async function sendMilestoneEmail(
  capsuleId: string,
  contributionId: string,
  milestone: 1 | 2 | 3
): Promise<void> {
  try {
    // Fetch contributor details
    const { data: contrib } = await adminClient
      .from('contributions')
      .select('contributor_name, email')
      .eq('id', contributionId)
      .single()

    if (!contrib?.email) return // No email — skip silently

    // Fetch capsule details
    const { data: capsule } = await adminClient
      .from('capsules')
      .select('honouree_name, slug, event_type')
      .eq('id', capsuleId)
      .single()

    if (!capsule) return

    // Fetch summary for impact stats
    const { data: summary } = await adminClient
      .from('capsule_participation_summary')
      .select('contributor_count, photo_count, country_count')
      .eq('capsule_id', capsuleId)
      .single()

    const firstName = contrib.contributor_name.split(' ')[0]
    const honoureeName = capsule.honouree_name
    const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${capsule.slug}`

    // Impact summary HTML
    const impactHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          <td style="text-align:center;padding:12px 8px;">
            <p style="font-size:20px;font-weight:800;color:#2D1B69;margin:0;">${summary?.contributor_count ?? 0}</p>
            <p style="font-size:9px;color:#5F5E5A;letter-spacing:0.12em;text-transform:uppercase;margin:4px 0 0;">Contributors</p>
          </td>
          <td style="text-align:center;padding:12px 8px;">
            <p style="font-size:20px;font-weight:800;color:#2D1B69;margin:0;">${summary?.photo_count ?? 0}</p>
            <p style="font-size:9px;color:#5F5E5A;letter-spacing:0.12em;text-transform:uppercase;margin:4px 0 0;">Photos</p>
          </td>
          <td style="text-align:center;padding:12px 8px;">
            <p style="font-size:20px;font-weight:800;color:#2D1B69;margin:0;">${summary?.country_count ?? 0}</p>
            <p style="font-size:9px;color:#5F5E5A;letter-spacing:0.12em;text-transform:uppercase;margin:4px 0 0;">Countries</p>
          </td>
        </tr>
      </table>
    `

    // ── Milestone-specific content ──
    let subject: string
    let bodyHtml: string

    switch (milestone) {
      case 1:
        subject = "You've helped preserve something meaningful"
        bodyHtml = `
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">Dear ${firstName},</p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">You've become a recognised <strong>Community Builder</strong> for ${honoureeName}'s collection.</p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">By sharing the capsule with others, you've helped bring more voices into this tribute — and that matters more than you might realise.</p>
          <p style="color:#B8960C;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;margin:0 0 4px;">Your Impact</p>
          ${impactHtml}
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">With gratitude,<br/><strong>LegacyCapsule</strong></p>
        `
        break

      case 2:
        subject = "You're helping preserve this story"
        bodyHtml = `
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">Dear ${firstName},</p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">Your contributions are helping build one of the richest collections in ${honoureeName}'s capsule.</p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">You've been recognised as a <strong>Legacy Builder</strong> — someone whose effort to bring others into this collection has made a real difference.</p>
          <p style="color:#B8960C;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;margin:0 0 4px;">Collection Impact</p>
          ${impactHtml}
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">With gratitude,<br/><strong>LegacyCapsule</strong></p>
        `
        break

      case 3:
        subject = 'Thank you for helping build this collection'
        bodyHtml = `
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">Dear ${firstName},</p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">You are the <strong>Lead Legacy Builder</strong> for ${honoureeName}'s collection.</p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">No one has done more to help grow this tribute than you. The people you brought into this capsule have enriched it in ways that will be preserved long after the event itself.</p>
          <p style="color:#B8960C;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;margin:0 0 4px;">Collection Impact</p>
          ${impactHtml}
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">With deep gratitude,<br/><strong>LegacyCapsule</strong></p>
        `
        break
    }

    // ── Send via Resend ──
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY!)

    const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

    // Reuse the platform email wrapper pattern
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>LegacyCapsule</title></head>
<body style="margin:0;padding:0;background:#0D0820;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0820;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 24px;text-align:center;">
          <p style="margin:0;font-size:10px;color:#B8960C;letter-spacing:4px;text-transform:uppercase;">LegacyCapsule</p>
        </td></tr>
        <tr><td style="background:#F5F3EE;border-radius:16px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="3" style="background:linear-gradient(90deg,transparent,#B8960C,transparent);">&nbsp;</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 32px;">
              ${bodyHtml}
            </td></tr>
            <tr><td style="padding:0 40px 32px;text-align:center;">
              <a href="${capsuleUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(180deg,#2D1B69,#1a0f35);color:#F5F3EE;font-size:13px;font-weight:bold;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">View the Collection</a>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="3" style="background:linear-gradient(90deg,transparent,#B8960C,transparent);">&nbsp;</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.25);">Sent via LegacyCapsule · Every event. Preserved.</p>
          <p style="margin:0;font-size:11px;"><a href="${APP_URL}" style="color:rgba(255,255,255,0.2);text-decoration:none;">itslegacycapsule.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const { error: sendError } = await resend.emails.send({
      from: 'LegacyCapsule <noreply@itslegacycapsule.com>',
      to: contrib.email,
      subject,
      html: fullHtml,
    })

    if (sendError) {
      console.error(`[sendMilestoneEmail] Milestone ${milestone} send failed:`, sendError)
      return
    }

    // ── Mark milestone as sent ──
    const milestoneField =
      milestone === 1 ? 'milestone_1_sent' :
      milestone === 2 ? 'milestone_2_sent' : 'milestone_3_sent'

    await adminClient
      .from('capsule_legacy_builders')
      .update({ [milestoneField]: true, updated_at: new Date().toISOString() })
      .eq('capsule_id', capsuleId)
      .eq('contribution_id', contributionId)

  } catch (err) {
    // Log but never block — milestone emails are non-critical
    console.error(`[sendMilestoneEmail] Milestone ${milestone} error (non-fatal):`, err)
  }
}
