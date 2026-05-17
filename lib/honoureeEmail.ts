/**
 * ============================================================
 * LEGACYCAPSULE — lib/honoureeEmail.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * SERVER-SIDE ONLY. All email sends for the honouree portal.
 *
 * Functions:
 *   sendAppreciationEmail     — individual thank-you to one contributor
 *   sendCollectiveEmail       — one email to all reachable contributors
 *   sendBroadcastEmail        — organiser-triggered broadcast
 *   sendSupportThankYou       — "Ways to Honour" acknowledgement
 *
 * All functions:
 *   - Write to correspondence_log on send attempt
 *   - Use Resend for delivery
 *   - Never called directly from client — only from API routes
 *   - FROM name is event-type-aware via getAppreciationFromName (D59)
 *
 * Email design: dark background #0D0820, gold rule, cream inner
 * card #F5F3EE. Footer: LC attribution — dignified, not an ad.
 */

import { Resend }        from 'resend';
import { createClient }  from '@supabase/supabase-js';
import {
  getAppreciationFromName,
  getAppreciationSubject,
  getCollectiveOpeningLine,
  type EventType,
} from './eventLabels';

// ============================================================
// SECTION 1 — Clients
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY!);

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '');


// ============================================================
// SECTION 2 — Email wrapper HTML
//
// Shared outer shell. All email types use this wrapper.
// Inner content (cream card) varies per email type.
// ============================================================

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
      <table width="560" cellpadding="0" cellspacing="0"
        style="max-width:560px;width:100%;">

        <!-- LC wordmark -->
        <tr><td style="padding:0 0 24px;text-align:center;">
          <p style="margin:0;font-size:10px;color:#B8960C;
            letter-spacing:4px;text-transform:uppercase;">
            LegacyCapsule
          </p>
        </td></tr>

        <!-- Cream card -->
        <tr><td style="background:#F5F3EE;border-radius:16px;overflow:hidden;">
          <!-- Gold top rule -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="3"
              style="background:linear-gradient(90deg,transparent,#B8960C,transparent);">
            </td></tr>
          </table>

          <!-- Inner content -->
          ${innerHtml}

          <!-- Gold bottom rule -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="3"
              style="background:linear-gradient(90deg,transparent,#B8960C,transparent);">
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.25);">
            Sent via LegacyCapsule · Every event. Preserved.
          </p>
          <p style="margin:0;font-size:11px;">
            <a href="${APP_URL}"
              style="color:rgba(255,255,255,0.2);text-decoration:none;">
              itslegacycapsule.com
            </a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}


// ============================================================
// SECTION 3 — Correspondence log writer
// ============================================================

async function logCorrespondence(params: {
  capsuleId:      string;
  recipientName:  string;
  recipientEmail: string | null;
  messageType:    string;
  status:         'sent' | 'bounced' | 'pending' | 'failed';
  resendId?:      string | null;
  contributionId?: string | null;
}): Promise<void> {
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
  });
}


// ============================================================
// SECTION 4 — Individual appreciation email
// ============================================================

export interface AppreciationEmailParams {
  capsuleId:       string;
  eventType:       string;
  honoureeName:    string;
  familyRepName:   string | null;
  slug:            string;

  contributorId:   string;
  contributorName: string;
  contributorEmail: string;
  tributeExcerpt:  string;   // first ~120 chars of tribute text

  /** Custom body if rep has set one — otherwise LC default is used */
  customBody:      string | null;
}

/**
 * Send a personalised appreciation email to one contributor.
 * Returns the Resend message ID on success.
 */
export async function sendAppreciationEmail(
  params: AppreciationEmailParams
): Promise<{ ok: boolean; resendId?: string; error?: string }> {
  const fromName = getAppreciationFromName(
    params.eventType as EventType,
    params.honoureeName,
    params.familyRepName
  );
  const subject  = getAppreciationSubject(params.honoureeName);
  const capsuleUrl = `${APP_URL}/for/${params.slug}`;

  const firstName   = params.contributorName.split(' ')[0];
  const excerptHtml = params.tributeExcerpt
    ? `<p style="font-style:italic;color:#5F5E5A;font-size:13px;
        line-height:1.7;margin:0 0 20px;padding:16px;
        background:#FFFFFF;border-left:3px solid #B8960C;border-radius:4px;">
        &ldquo;${params.tributeExcerpt}${params.tributeExcerpt.length >= 120 ? '…' : ''}&rdquo;
       </p>`
    : '';

  const bodyContent = params.customBody
    ? `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
        ${params.customBody.replace(/\n/g, '<br/>')}
       </p>`
    : `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
        Dear ${firstName},
       </p>
       <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
        Thank you for the words you sent. They reached me, and they meant more than I can say.
       </p>
       ${excerptHtml}
       <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
        Knowing that you took the time to put your thoughts into words — and that those words
        are now preserved alongside so many others — is something I will carry with me.
       </p>
       <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">
        With sincere gratitude,<br/>
        <strong>${params.honoureeName}</strong>
       </p>`;

  const inner = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:36px 40px 32px;">
        ${bodyContent}
      </td></tr>
      <tr><td style="padding:0 40px 32px;text-align:center;">
        <a href="${capsuleUrl}"
          style="display:inline-block;padding:12px 28px;
          background:linear-gradient(180deg,#2D1B69,#1a0f35);
          color:#F5F3EE;font-size:13px;font-weight:bold;
          text-decoration:none;border-radius:8px;
          letter-spacing:0.5px;">
          View the Capsule
        </a>
      </td></tr>
    </table>`;

  try {
    const { data, error } = await resend.emails.send({
      from:    `${fromName} <noreply@itslegacycapsule.com>`,
      to:      params.contributorEmail,
      subject,
      html:    emailWrapper(inner),
    });

    const resendId = data?.id ?? null;
    const status   = error ? 'failed' : 'sent';

    await logCorrespondence({
      capsuleId:      params.capsuleId,
      recipientName:  params.contributorName,
      recipientEmail: params.contributorEmail,
      messageType:    'individual_appreciation',
      status,
      resendId,
      contributionId: params.contributorId,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, resendId: resendId ?? undefined };

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Send failed';
    await logCorrespondence({
      capsuleId:      params.capsuleId,
      recipientName:  params.contributorName,
      recipientEmail: params.contributorEmail,
      messageType:    'individual_appreciation',
      status:         'failed',
      contributionId: params.contributorId,
    });
    return { ok: false, error: msg };
  }
}


// ============================================================
// SECTION 5 — Collective appreciation email
// ============================================================

export interface CollectiveEmailParams {
  capsuleId:      string;
  eventType:      string;
  honoureeName:   string;
  familyRepName:  string | null;
  slug:           string;
  totalCount:     number;
  countryCount:   number;
  reachableCount: number;
  customBody:     string | null;

  /** Array of {name, email} for all reachable contributors */
  recipients: Array<{ name: string; email: string; contributionId: string }>;
}

/**
 * Send a collective appreciation to all reachable contributors.
 * Each email is personalised with the recipient's name.
 * Returns counts of sent and failed.
 */
export async function sendCollectiveEmail(
  params: CollectiveEmailParams
): Promise<{ sent: number; failed: number }> {
  const fromName = getAppreciationFromName(
    params.eventType as EventType,
    params.honoureeName,
    params.familyRepName
  );
  const subject  = getAppreciationSubject(params.honoureeName);
  const capsuleUrl = `${APP_URL}/for/${params.slug}`;

  const openingLine = getCollectiveOpeningLine(
    params.eventType as EventType,
    params.honoureeName,
    params.totalCount,
    params.countryCount,
    params.reachableCount
  );

  let sent   = 0;
  let failed = 0;

  for (const recipient of params.recipients) {
    const firstName = recipient.name.split(' ')[0];

    const bodyContent = params.customBody
      ? `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Dear ${firstName},
         </p>
         <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
          ${params.customBody.replace(/\n/g, '<br/>')}
         </p>
         <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">
          With sincere gratitude,<br/>
          <strong>${params.honoureeName}</strong>
         </p>`
      : `<p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Dear ${firstName},
         </p>
         <p style="color:#1C1C1E;font-size:14px;line-height:1.8;
           color:#5F5E5A;font-style:italic;margin:0 0 20px;">
          ${openingLine}
         </p>
         <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Every word matters. Every name on that wall matters.
          This Capsule exists because of people like you, who chose to show up — wherever in the world you are.
         </p>
         <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">
          Thank you, ${firstName}. Truly.<br/><br/>
          With deep gratitude,<br/>
          <strong>${params.honoureeName}</strong>
         </p>`;

    const inner = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:36px 40px 32px;">${bodyContent}</td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <a href="${capsuleUrl}"
            style="display:inline-block;padding:12px 28px;
            background:linear-gradient(180deg,#2D1B69,#1a0f35);
            color:#F5F3EE;font-size:13px;font-weight:bold;
            text-decoration:none;border-radius:8px;">
            View the Capsule
          </a>
        </td></tr>
      </table>`;

    try {
      const { data, error } = await resend.emails.send({
        from:    `${fromName} <noreply@itslegacycapsule.com>`,
        to:      recipient.email,
        subject,
        html:    emailWrapper(inner),
      });

      const status = error ? 'failed' : 'sent';
      await logCorrespondence({
        capsuleId:      params.capsuleId,
        recipientName:  recipient.name,
        recipientEmail: recipient.email,
        messageType:    'collective',
        status,
        resendId:       data?.id ?? null,
        contributionId: recipient.contributionId,
      });

      if (error) { failed++; } else { sent++; }

    } catch {
      failed++;
      await logCorrespondence({
        capsuleId:      params.capsuleId,
        recipientName:  recipient.name,
        recipientEmail: recipient.email,
        messageType:    'collective',
        status:         'failed',
        contributionId: recipient.contributionId,
      });
    }

    // Rate limiting — 200ms between sends (D56 — backend always batches)
    await new Promise(r => setTimeout(r, 200));
  }

  return { sent, failed };
}


// ============================================================
// SECTION 6 — Broadcast email
// ============================================================

export interface BroadcastEmailParams {
  capsuleId:    string;
  broadcastId:  string;
  honoureeName: string;
  slug:         string;
  subject:      string;
  body:         string;
  recipients:   Array<{ name: string; email: string }>;
}

export async function sendBroadcastEmail(
  params: BroadcastEmailParams
): Promise<{ sent: number; failed: number }> {
  let sent = 0; let failed = 0;
  const capsuleUrl = `${APP_URL}/for/${params.slug}`;

  for (const recipient of params.recipients) {
    const firstName = recipient.name.split(' ')[0];

    const inner = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:36px 40px 32px;">
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 16px;">
            Dear ${firstName},
          </p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 24px;">
            ${params.body.replace(/\n/g, '<br/>')}
          </p>
          <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">
            <strong>${params.honoureeName}</strong>
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <a href="${capsuleUrl}"
            style="display:inline-block;padding:12px 28px;
            background:linear-gradient(180deg,#2D1B69,#1a0f35);
            color:#F5F3EE;font-size:13px;font-weight:bold;
            text-decoration:none;border-radius:8px;">
            View the Capsule
          </a>
        </td></tr>
      </table>`;

    try {
      const { data, error } = await resend.emails.send({
        from:    `${params.honoureeName} via LegacyCapsule <noreply@itslegacycapsule.com>`,
        to:      recipient.email,
        subject: params.subject,
        html:    emailWrapper(inner),
      });

      const status = error ? 'failed' : 'sent';
      await logCorrespondence({
        capsuleId:      params.capsuleId,
        recipientName:  recipient.name,
        recipientEmail: recipient.email,
        messageType:    'broadcast',
        status,
        resendId:       data?.id ?? null,
      });

      if (error) { failed++; } else { sent++; }

      // Update running sent_count on broadcast row
      if (!error) {
        await adminClient.from('honouree_broadcasts')
          .update({ sent_count: sent })
          .eq('id', params.broadcastId);
      }

    } catch {
      failed++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  return { sent, failed };
}


// ============================================================
// SECTION 7 — Support thank-you email
//
// Sent immediately when a supporter submits "I've sent a gift".
// FROM: honouree name (all event types — this is a direct thank-you
// for a gift they said they sent, not a post-event dispatch).
// ============================================================

export interface SupportThankYouParams {
  capsuleId:      string;
  eventType:      string;
  honoureeName:   string;
  slug:           string;
  supporterName:  string;
  supporterEmail: string;
  methodLabel:    string;
}

export async function sendSupportThankYou(
  params: SupportThankYouParams
): Promise<{ ok: boolean }> {
  const capsuleUrl  = `${APP_URL}/for/${params.slug}`;
  const firstName   = params.supporterName.split(' ')[0];

  const inner = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:36px 40px 32px;">
        <p style="color:#B8960C;font-size:10px;letter-spacing:3px;
          text-transform:uppercase;margin:0 0 16px;">
          With heartfelt thanks
        </p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Dear ${firstName},
        </p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 20px;">
          Thank you for your generous gift. It has been received with deep gratitude
          and warmth.
        </p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0 0 24px;">
          Your kindness means a great deal.
        </p>
        <p style="color:#1C1C1E;font-size:15px;line-height:1.8;margin:0;">
          With sincere thanks,<br/>
          <strong>${params.honoureeName}</strong>
        </p>
      </td></tr>
      <tr><td style="padding:0 40px 32px;text-align:center;">
        <a href="${capsuleUrl}"
          style="display:inline-block;padding:12px 28px;
          background:linear-gradient(180deg,#2D1B69,#1a0f35);
          color:#F5F3EE;font-size:13px;font-weight:bold;
          text-decoration:none;border-radius:8px;">
          View the Capsule
        </a>
      </td></tr>
    </table>`;

  try {
    await resend.emails.send({
      from:    `${params.honoureeName} via LegacyCapsule <noreply@itslegacycapsule.com>`,
      to:      params.supporterEmail,
      subject: `Your gift has been received — with thanks from ${params.honoureeName}`,
      html:    emailWrapper(inner),
    });

    await logCorrespondence({
      capsuleId:      params.capsuleId,
      recipientName:  params.supporterName,
      recipientEmail: params.supporterEmail,
      messageType:    'support_thankyou',
      status:         'sent',
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
