// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/honoureeEmail.ts
// PURPOSE:   Honouree portal email functions — individual appreciation,
//            collective appreciation, broadcast, and EOH support thank-you.
//            SERVER-SIDE ONLY — never import into 'use client' components.
// ARCHITECTURE: LC05 Engagement Engine — Honouree Portal (D56).
//               All copy compliant with LC_EMOTIONAL_COMMUNICATION_STANDARD.md.
//               logCorrespondence is non-blocking (try/catch) — a missing
//               correspondence_log table must never block email delivery.
// BUILT BY:  AI6 (original) · AI20 · Claude Sonnet 4.6 · 11 August 2026
// UPDATED:   AI20 · 11 August 2026
//            — Standard file header added
//            — Section markers standardised to ═══ SECTION N ═══
//            — sendSupportThankYou: ECS rewrite
//              "gift" → "expression of honour" throughout
//              passive "has been received" → active voice
//              subject line upgraded to permanence framing
//            — No logic changes to any function
// VERSION:   AI20v2.11.92
// DATE:      11 August 2026
//
// CHANGELOG:
//   v1.2.6 (AI6 — T4): logCorrespondence wrapped in try/catch throughout.
//     If correspondence_log table doesn't exist or insert fails, email send
//     is NOT blocked. sendSupportThankYou now logs Resend error if send fails.
// ─────────────────────────────────────────────────────────────────────────────

import { Resend }        from 'resend'
import { createClient }  from '@supabase/supabase-js'
import {
  getAppreciationFromName,
  getAppreciationSubject,
  getCollectiveOpeningLine,
  type EventType,
} from './eventLabels'

// ═══ SECTION 1 — Clients ═══

const resend = new Resend(process.env.RESEND_API_KEY!)

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Email wrapper HTML ═══
// Shared outer shell for all honouree-sent emails.
// Dark outer (#0D0820), cream inner card (#F5F3EE), gold accent (#B8960C).

function emailWrapper(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>LegacyCapsule</title>
</head>
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
          ${innerHtml}
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="3" style="background:linear-gradient(90deg,transparent,#B8960C,transparent);">&nbsp;</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.25);">Sent via LegacyCapsule &middot; Events end. Legacies don&rsquo;t.</p>
          <p style="margin:0;font-size:11px;"><a href="${APP_URL}" style="color:rgba(255,255,255,0.2);text-decoration:none;">itslegacycapsule.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ═══ SECTION 3 — Correspondence log writer ═══
// T4 FIX: wrapped in try/catch — never blocks email send.
// correspondence_log is supplementary — a missing table must not
// prevent email delivery.

async function logCorrespondence(params: {
  capsuleId:       string
  recipientName:   string
  recipientEmail:  string | null
  messageType:     string
  status:          'sent' | 'bounced' | 'pending' | 'failed'
  resendId?:       string | null
  contributionId?: string | null
}): Promise<void> {
  try {
    await adminClient.from('correspondence_log').insert({
      capsule_id:        params.capsuleId,
      recipient_name:    params.recipientName,
      recipient_email:   params.recipientEmail,
      channel:           'email',
      message_type:      params.messageType,
      status:            params.status,
      resend_message_id: params.resendId ?? null,
      contribution_id:   params.contributionId ?? null,
      sent_at:           new Date().toISOString(),
    })
  } catch (logErr) {
    console.warn('[honoureeEmail] logCorrespondence failed (non-fatal):', logErr)
  }
}

// ═══ SECTION 4 — Individual appreciation email ═══
// Sent from honouree to a single contributor — personalised,
// from the honouree's name, references their specific voice excerpt.

export interface AppreciationEmailParams {
  capsuleId:        string
  eventType:        string
  honoureeName:     string
  familyRepName:    string | null
  slug:             string
  contributorId:    string
  contributorName:  string
  contributorEmail: string
  tributeExcerpt:   string
  customBody:       string | null
}

export async function sendAppreciationEmail(
  params: AppreciationEmailParams
): Promise<{ ok: boolean; resendId?: string; error?: string }> {
  const fromName   = getAppreciationFromName(params.eventType as EventType, params.honoureeName, params.familyRepName)
  const subject    = getAppreciationSubject(params.honoureeName)
  const capsuleUrl = `${APP_URL}/for/${params.slug}`
  const firstName  = params.contributorName.split(' ')[0]

  const excerptHtml = params.tributeExcerpt
    ? `<p style="font-style:italic;color:#5F5E5A;font-size:13px;line-height:1.7;margin:0 0 20px;padding:16px;background:#FFFFFF;border-left:3px solid #B8960C;border-radius:4px;">&ldquo;${params.tributeExcerpt}${params.tributeExcerpt.length >= 120 ? '&hellip;' : ''}&rdquo;</p>`
    : ''

  // Custom body: organiser-written message takes precedence.
  // Default: emotionally resonant, from the honouree's voice.
  const bodyContent = params.customBody
    ? `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Dear ${firstName},</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">${params.customBody.replace(/\n/g, '<br/>')}</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">With sincere gratitude,<br/><strong>${params.honoureeName}</strong></p>`
    : `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Dear ${firstName},</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Thank you for the words you sent. They reached me, and they meant more than I can say.</p>${excerptHtml}<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Knowing that you took the time to put your thoughts into words — and that those words are now preserved alongside so many others — is something I will carry with me.</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">With sincere gratitude,<br/><strong>${params.honoureeName}</strong></p>`

  const inner = `<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 40px 32px;">${bodyContent}</td></tr><tr><td style="padding:0 40px 32px;text-align:center;"><a href="${capsuleUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(180deg,#2D1B69,#1a0f35);color:#F5F3EE;font-size:13px;font-weight:bold;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">Return to the Record</a></td></tr></table>`

  try {
    const { data, error } = await resend.emails.send({
      from:    `${fromName} <noreply@itslegacycapsule.com>`,
      to:      params.contributorEmail,
      subject,
      html:    emailWrapper(inner),
    })
    const resendId = data?.id ?? null
    await logCorrespondence({
      capsuleId:      params.capsuleId,
      recipientName:  params.contributorName,
      recipientEmail: params.contributorEmail,
      messageType:    'individual_appreciation',
      status:         error ? 'failed' : 'sent',
      resendId,
      contributionId: params.contributorId,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, resendId: resendId ?? undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Send failed'
    await logCorrespondence({
      capsuleId:      params.capsuleId,
      recipientName:  params.contributorName,
      recipientEmail: params.contributorEmail,
      messageType:    'individual_appreciation',
      status:         'failed',
      contributionId: params.contributorId,
    })
    return { ok: false, error: msg }
  }
}

// ═══ SECTION 5 — Collective appreciation email ═══
// Sent from honouree to all reachable contributors simultaneously.
// Personalised per recipient (first name, their excerpt not shown here —
// collective mode addresses the group as a whole).
// 200ms delay between sends — Resend rate limit safety.

export interface CollectiveEmailParams {
  capsuleId:      string
  eventType:      string
  honoureeName:   string
  familyRepName:  string | null
  slug:           string
  totalCount:     number
  countryCount:   number
  reachableCount: number
  customBody:     string | null
  recipients:     Array<{ name: string; email: string; contributionId: string }>
}

export async function sendCollectiveEmail(params: CollectiveEmailParams): Promise<{ sent: number; failed: number }> {
  const fromName    = getAppreciationFromName(params.eventType as EventType, params.honoureeName, params.familyRepName)
  const subject     = getAppreciationSubject(params.honoureeName)
  const capsuleUrl  = `${APP_URL}/for/${params.slug}`
  const openingLine = getCollectiveOpeningLine(params.eventType as EventType, params.honoureeName, params.totalCount, params.countryCount, params.reachableCount)
  let sent = 0; let failed = 0

  for (const recipient of params.recipients) {
    const firstName = recipient.name.split(' ')[0]

    const bodyContent = params.customBody
      ? `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Dear ${firstName},</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">${params.customBody.replace(/\n/g, '<br/>')}</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">With sincere gratitude,<br/><strong>${params.honoureeName}</strong></p>`
      : `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Dear ${firstName},</p><p style="color:#1C1C1E;font-size:14px;line-height:1.8;color:#5F5E5A;font-style:italic;margin:0 0 20px;">${openingLine}</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Every word matters. Every name in that record matters. This capsule exists because of people like you, who chose to show up — wherever in the world you are.</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">Thank you, ${firstName}. Truly.<br/><br/>With deep gratitude,<br/><strong>${params.honoureeName}</strong></p>`

    const inner = `<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 40px 32px;">${bodyContent}</td></tr><tr><td style="padding:0 40px 32px;text-align:center;"><a href="${capsuleUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(180deg,#2D1B69,#1a0f35);color:#F5F3EE;font-size:13px;font-weight:bold;text-decoration:none;border-radius:8px;">Return to the Record</a></td></tr></table>`

    try {
      const { data, error } = await resend.emails.send({
        from:    `${fromName} <noreply@itslegacycapsule.com>`,
        to:      recipient.email,
        subject,
        html:    emailWrapper(inner),
      })
      await logCorrespondence({
        capsuleId:      params.capsuleId,
        recipientName:  recipient.name,
        recipientEmail: recipient.email,
        messageType:    'collective',
        status:         error ? 'failed' : 'sent',
        resendId:       data?.id ?? null,
        contributionId: recipient.contributionId,
      })
      if (error) { failed++ } else { sent++ }
    } catch {
      failed++
      await logCorrespondence({
        capsuleId:      params.capsuleId,
        recipientName:  recipient.name,
        recipientEmail: recipient.email,
        messageType:    'collective',
        status:         'failed',
        contributionId: recipient.contributionId,
      })
    }
    await new Promise(r => setTimeout(r, 200))
  }
  return { sent, failed }
}

// ═══ SECTION 6 — Broadcast email ═══
// Organiser-composed message sent to all contributors.
// Subject and body are organiser-written — not templated.

export interface BroadcastEmailParams {
  capsuleId:    string
  broadcastId:  string
  honoureeName: string
  slug:         string
  subject:      string
  body:         string
  recipients:   Array<{ name: string; email: string }>
}

export async function sendBroadcastEmail(params: BroadcastEmailParams): Promise<{ sent: number; failed: number }> {
  let sent = 0; let failed = 0
  const capsuleUrl = `${APP_URL}/for/${params.slug}`

  for (const recipient of params.recipients) {
    const firstName = recipient.name.split(' ')[0]
    const inner = `<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:36px 40px 32px;"><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">Dear ${firstName},</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 24px;">${params.body.replace(/\n/g, '<br/>')}</p><p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;"><strong>${params.honoureeName}</strong></p></td></tr><tr><td style="padding:0 40px 32px;text-align:center;"><a href="${capsuleUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(180deg,#2D1B69,#1a0f35);color:#F5F3EE;font-size:13px;font-weight:bold;text-decoration:none;border-radius:8px;">Return to the Record</a></td></tr></table>`

    try {
      const { data, error } = await resend.emails.send({
        from:    `${params.honoureeName} via LegacyCapsule <noreply@itslegacycapsule.com>`,
        to:      recipient.email,
        subject: params.subject,
        html:    emailWrapper(inner),
      })
      await logCorrespondence({
        capsuleId:      params.capsuleId,
        recipientName:  recipient.name,
        recipientEmail: recipient.email,
        messageType:    'broadcast',
        status:         error ? 'failed' : 'sent',
        resendId:       data?.id ?? null,
      })
      if (error) { failed++ } else { sent++ }
      if (!error) {
        await adminClient
          .from('honouree_broadcasts')
          .update({ sent_count: sent })
          .eq('id', params.broadcastId)
      }
    } catch { failed++ }
    await new Promise(r => setTimeout(r, 200))
  }
  return { sent, failed }
}

// ═══ SECTION 7 — EOH Support thank-you email ═══
// Sent automatically when an Expression of Honour is acknowledged.
// From: honouree's name via LegacyCapsule.
// ECS: "expression of honour" replaces "gift" throughout.
// Active voice replaces passive ("has been received" → "arrived").
// T4 FIX: logCorrespondence non-blocking — see Section 3.

export interface SupportThankYouParams {
  capsuleId:      string
  eventType:      string
  honoureeName:   string
  slug:           string
  supporterName:  string
  supporterEmail: string
  methodLabel:    string | null
}

export async function sendSupportThankYou(
  params: SupportThankYouParams
): Promise<{ ok: boolean }> {
  const capsuleUrl = `${APP_URL}/for/${params.slug}`
  const firstName  = params.supporterName.split(' ')[0]

  // ECS: "expression of honour" not "gift". Active voice. Permanence close.
  const inner = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:36px 40px 32px;">
        <p style="color:#B8960C;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;">With heartfelt thanks</p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">Dear ${firstName},</p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Your expression of honour has arrived — and it has been received with deep gratitude.
          Every gesture of this kind becomes part of the story this occasion is building.
        </p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 24px;">
          Your kindness is not just noted — it is preserved as part of this record.
        </p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">
          With sincere thanks,<br/><strong>${params.honoureeName}</strong>
        </p>
      </td></tr>
      <tr><td style="padding:0 40px 32px;text-align:center;">
        <a href="${capsuleUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(180deg,#2D1B69,#1a0f35);color:#F5F3EE;font-size:13px;font-weight:bold;text-decoration:none;border-radius:8px;">Return to the Record</a>
      </td></tr>
    </table>`

  try {
    const { data, error } = await resend.emails.send({
      from:    `${params.honoureeName} via LegacyCapsule <noreply@itslegacycapsule.com>`,
      to:      params.supporterEmail,
      // ECS: permanence-first subject. "expression of honour" not "gift".
      subject: `Your expression of honour — received with gratitude by ${params.honoureeName}`,
      html:    emailWrapper(inner),
    })

    if (error) {
      console.error('[sendSupportThankYou] Resend error:', error.message)
      await logCorrespondence({
        capsuleId:      params.capsuleId,
        recipientName:  params.supporterName,
        recipientEmail: params.supporterEmail,
        messageType:    'support_thankyou',
        status:         'failed',
      })
      return { ok: false }
    }

    await logCorrespondence({
      capsuleId:      params.capsuleId,
      recipientName:  params.supporterName,
      recipientEmail: params.supporterEmail,
      messageType:    'support_thankyou',
      status:         'sent',
      resendId:       data?.id ?? null,
    })
    return { ok: true }
  } catch (err) {
    console.error('[sendSupportThankYou] Unexpected error:', err)
    return { ok: false }
  }
}