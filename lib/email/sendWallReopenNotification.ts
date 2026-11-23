// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/email/sendWallReopenNotification.ts
// PURPOSE:   Notifies a queued contributor that the capsule's contribution
//            wall has reopened following an organiser tier upgrade.
//            Called by /api/capsule/batch-notify for each queued row that
//            has a contributor_email.
//            Uses event-type-aware copy from lib/eventLabels.ts — never
//            hardcodes "tribute" or any single event frame.
//            Follows ECS (Emotional Communication Standard) across all five
//            pillars: Permanence, Belonging, Privilege, Weight, Craftsmanship.
// BUILT BY:  AI34 · Claude Sonnet 4.6
// VERSION:   AI34v2.12.76
// DATE:      23 November 2026
// ─────────────────────────────────────────────────────────────────────────────

import { Resend }           from 'resend'
import { getSubmitPageHeading, getSubjectRole } from '@/lib/eventLabels'

// ═══ SECTION 1 — Resend client ═══

const resend = new Resend(process.env.RESEND_API_KEY!)

// ═══ SECTION 2 — Types ═══

export interface WallReopenParams {
  recipientEmail:   string
  recipientName:    string | null   // contributor_name from queued_submissions; may be null
  honoureeName:     string          // capsules.honouree_name
  eventType:        string          // capsules.event_type
  capsuleSlug:      string          // used to build the return URL
  sessionToken:     string          // queued_submissions.session_token — restores their draft
}

// ═══ SECTION 3 — Copy helpers (event-type-aware, ECS-compliant) ═══

function getEmailSubject(eventType: string, honoureeName: string): string {
  const e = eventType.toLowerCase()
  if (e.includes('memorial'))   return `There is room for your voice — a memory for ${honoureeName}`
  if (e.includes('wedding'))    return `There is room for your message — the wall for ${honoureeName} is open`
  if (e.includes('birthday'))   return `There is room for your voice — the wall for ${honoureeName} is open`
  if (e.includes('retirement')) return `There is room for your voice — the wall for ${honoureeName} is open`
  return `There is room for your voice — the wall for ${honoureeName} is open`
}

function getBodyMoment(honoureeName: string, eventType: string): string {
  const heading = getSubmitPageHeading(eventType, honoureeName)
  return `When you visited, the space to ${heading.toLowerCase()} was full.\n\nThe organiser has expanded the collection — there is room for your voice now.`
}

function getBodyClose(eventType: string): string {
  return `Every voice matters to this story. Yours was not forgotten.`
}

function getCtaLabel(eventType: string): string {
  const e = eventType.toLowerCase()
  if (e.includes('memorial')) return `Share your voice`
  if (e.includes('wedding'))  return `Leave your message`
  return `Share your voice`
}

// ═══ SECTION 4 — HTML builder ═══

function buildEmailHtml(params: WallReopenParams & { returnUrl: string }): string {
  const { recipientName, honoureeName, eventType, returnUrl } = params

  const firstName  = recipientName ? recipientName.split(' ')[0] : null
  const greeting   = firstName ? `${firstName},` : 'Hello,'
  const momentText = getBodyMoment(honoureeName, eventType)
  const closeText  = getBodyClose(eventType)
  const ctaLabel   = getCtaLabel(eventType)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>There is room for your voice</title>
</head>
<body style="margin:0;padding:0;background:#0D0820;font-family:'Georgia',serif;">

  <!-- ═══ Outer wrapper ═══ -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#0D0820;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- ═══ Gold-gradient border card ═══ -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;background:linear-gradient(135deg,#C9A84C 0%,#F0D080 50%,#A07830 100%);border-radius:12px;padding:3px;">
          <tr>
            <td>

              <!-- ═══ Cream inner card ═══ -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#F5F3EE;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#4B2D8A 0%,#C9A84C 50%,#4B2D8A 100%);"></td>
                </tr>
                <tr>
                  <td style="padding:40px 36px 32px;">

                    <!-- Wordmark -->
                    <p style="margin:0 0 32px;font-family:'Georgia',serif;font-size:13px;
                               letter-spacing:0.18em;color:#8B7355;text-transform:uppercase;">
                      Legacy Capsule
                    </p>

                    <!-- Greeting -->
                    <p style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;
                               font-weight:600;color:#1A1033;line-height:1.3;">
                      ${greeting}
                    </p>

                    <!-- Opening moment -->
                    <p style="margin:0 0 24px;font-family:'Georgia',serif;font-size:17px;
                               font-style:italic;color:#4B2D8A;line-height:1.5;">
                      Something was held for you.
                    </p>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="margin:0 0 24px;">
                      <tr>
                        <td style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);"></td>
                      </tr>
                    </table>

                    <!-- Body -->
                    <p style="margin:0 0 20px;font-family:'Georgia',serif;font-size:15px;
                               color:#3D3528;line-height:1.75;white-space:pre-line;">
                      ${momentText}
                    </p>

                    <!-- Close / permanence -->
                    <p style="margin:0 0 32px;font-family:'Georgia',serif;font-size:14px;
                               color:#6B5D4F;line-height:1.65;font-style:italic;">
                      ${closeText}
                    </p>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#4B2D8A,#7B4DB8);
                                   border-radius:6px;padding:14px 32px;">
                          <a href="${returnUrl}"
                             style="font-family:'Georgia',serif;font-size:15px;
                                    color:#F5F3EE;text-decoration:none;
                                    letter-spacing:0.04em;white-space:nowrap;">
                            ${ctaLabel} →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Footer permanence line -->
                    <p style="margin:0;font-family:'Georgia',serif;font-size:12px;
                               color:#9B8E80;line-height:1.6;border-top:1px solid #DDD9D0;
                               padding-top:20px;">
                      Events end. Legacies don't. — LegacyCapsule
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim()
}

// ═══ SECTION 5 — Plain text fallback ═══

function buildEmailText(params: WallReopenParams & { returnUrl: string }): string {
  const { recipientName, honoureeName, eventType, returnUrl } = params
  const firstName  = recipientName ? recipientName.split(' ')[0] : null
  const greeting   = firstName ? `${firstName},` : 'Hello,'
  const momentText = getBodyMoment(honoureeName, eventType)
  const closeText  = getBodyClose(eventType)

  return [
    greeting,
    '',
    'Something was held for you.',
    '',
    momentText,
    '',
    closeText,
    '',
    `Continue here: ${returnUrl}`,
    '',
    "Events end. Legacies don't. — LegacyCapsule",
  ].join('\n')
}

// ═══ SECTION 6 — Send function ═══

export async function sendWallReopenNotification(
  params: WallReopenParams,
): Promise<void> {
  const { recipientEmail, honoureeName, eventType, capsuleSlug, sessionToken } = params

  const appUrl    = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')
  const returnUrl = `${appUrl}/for/${capsuleSlug}?restore=${sessionToken}`
  const enriched  = { ...params, returnUrl }

  try {
    await resend.emails.send({
      from:    'LegacyCapsule <noreply@itslegacycapsule.com>',
      to:      recipientEmail,
      subject: getEmailSubject(eventType, honoureeName),
      html:    buildEmailHtml(enriched),
      text:    buildEmailText(enriched),
    })
  } catch (err) {
    // Non-fatal — batch-notify route continues to next contributor on error
    console.error('[sendWallReopenNotification] Send failed for', recipientEmail, err)
    throw err   // let caller decide whether to log per-recipient or swallow
  }
}
