// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/email.ts
// PURPOSE:   Core transactional email functions for LegacyCapsule.
//            Exports: sendKeepsakeCard, sendOrganiserWelcome.
//            SERVER-SIDE ONLY — never import into 'use client' components.
//            Always call via API routes from client components.
// ARCHITECTURE: D27 — Keepsake Card sent on organiser approval.
//               sendOrganiserWelcome called from /api/email/verify-organiser.
//               All copy compliant with LC_EMOTIONAL_COMMUNICATION_STANDARD.md.
// BUILT BY:  AI13 · Claude Opus 4.6 · 22 July 2026
// UPDATED:   AI20 · Claude Sonnet 4.6 · 11 August 2026
//            — Standard file header added
//            — Duplicate Stories invitation block removed from Keepsake Card
//            — sendKeepsakeCard subject upgraded: permanence-first framing
//            — sendOrganiserWelcome subject upgraded: ECS weight-first
//            — Unicode ornaments replaced with HTML entities (AI13 — email safety)
// VERSION:   AI20v2.11.92
// DATE:      11 August 2026
// FROM:      noreply@itslegacycapsule.com — confirmed Resend sending domain
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from 'resend'
import { getParticipationLanguage } from '@/lib/utils/getParticipationLanguage'

// ═══ SECTION 1 — Resend client ═══

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM   = 'LegacyCapsule <noreply@itslegacycapsule.com>'

// ═══ SECTION 2 — Types ═══

interface ApprovalEmailParams {
  contributorEmail: string
  contributorName:  string
  subjectName:      string
  eventType:        string
  tributeText:      string
  capsuleSlug:      string
  city:             string
  country:          string
  refCode?:         string | null
  editLink?:        string | null
}

interface OrganisingWelcomeParams {
  organiserEmail: string
  subjectName:    string
  capsuleSlug:    string
  verifyUrl:      string
  manageUrl:      string
}

// ═══ SECTION 3 — Keepsake Card email (D27) ═══
// Sent when organiser approves a voice/tribute/appreciation.
// Design: deep purple #0D0820 outer, ivory #F5F3EE inner card,
// antique gold #D4AE2A accents, Georgia serif headline.
// Must feel like receiving a beautiful physical card in the post.
// ECS: Permanence + Belonging + Privilege pillars applied throughout.
// FIXED: Duplicate Stories invitation block removed (was appearing twice).

function buildKeepsakeCardHtml(params: ApprovalEmailParams): string {
  const {
    contributorName,
    subjectName,
    eventType,
    tributeText,
    capsuleSlug,
    city,
    country,
  } = params

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
  const capsuleUrl = appUrl + '/for/' + capsuleSlug
  const editUrl    = params.editLink ?? null

  const lang       = getParticipationLanguage(eventType)
  const isMemorial = eventType === 'memorial'
  const isWedding  = eventType === 'wedding'

  // ECS: headline communicates permanence, not platform status ("now live")
  const headline = isMemorial
    ? 'Your tribute for ' + subjectName + ' is now part of this record'
    : isWedding
    ? 'Your blessing for ' + subjectName + ' is now part of this record'
    : 'Your ' + lang.singular.toLowerCase() + ' for ' + subjectName + ' is now part of this record'

  const keepsakeLabel = isMemorial
    ? 'A tribute in memory of ' + subjectName
    : isWedding
    ? 'A blessing for ' + subjectName
    : 'A ' + lang.singular.toLowerCase() + ' for ' + subjectName

  const locationLine = city + (country ? ' &middot; ' + country : '')
  const initials     = contributorName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0820;font-family:'DM Sans',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0820;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Brand -->
        <tr><td align="center" style="padding-bottom:36px;">
          <p style="margin:0 0 4px;font-size:10px;color:rgba(212,174,42,0.6);letter-spacing:0.25em;text-transform:uppercase;">LegacyCapsule</p>
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:0.1em;">RevoWorldTech &middot; VALNEX, UNIPESSOAL LDA</p>
        </td></tr>

        <!-- Gold ornament -->
        <tr><td align="center" style="padding-bottom:20px;">
          <p style="margin:0;font-size:28px;line-height:1;color:#D4AE2A;">&#10022;</p>
        </td></tr>

        <!-- Headline -->
        <tr><td align="center" style="padding-bottom:36px;">
          <h1 style="margin:0;font-family:Georgia,'Playfair Display',serif;font-size:26px;font-weight:700;color:#F5F3EE;line-height:1.35;text-align:center;">
            ${headline}
          </h1>
          <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.8;text-align:center;">
            What you wrote will remain — long after the occasion has passed.<br/>
            A keepsake of your ${lang.singular.toLowerCase()} is preserved below.
          </p>
        </td></tr>

        <!-- Keepsake card — gold border frame -->
        <tr><td style="padding:3px;border-radius:18px;background:linear-gradient(135deg,#D4AE2A,#B8960C,#D4AE2A);">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;border-radius:16px;overflow:hidden;">

            <!-- Card top bar -->
            <tr><td style="height:4px;background:linear-gradient(90deg,#2D1B69,#D4AE2A,#2D1B69);font-size:0;">&nbsp;</td></tr>

            <!-- Card content -->
            <tr><td style="padding:32px 36px 36px;">

              <!-- Keepsake label -->
              <p style="margin:0 0 20px;font-size:10px;color:#B8960C;letter-spacing:0.2em;text-transform:uppercase;text-align:center;">
                &mdash; ${keepsakeLabel} &mdash;
              </p>

              <!-- Contributor row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:40px;height:40px;border-radius:50%;background-color:#2D1B69;text-align:center;line-height:40px;">
                      <span style="color:#D4AE2A;font-size:14px;font-weight:700;">${initials}</span>
                    </div>
                  </td>
                  <td style="padding-left:12px;" valign="middle">
                    <p style="margin:0;font-family:Georgia,'Playfair Display',serif;font-size:16px;font-weight:600;color:#1a1a2e;">${contributorName}</p>
                    <p style="margin:3px 0 0;font-size:12px;color:#6b6b80;">${locationLine}</p>
                  </td>
                </tr>
              </table>

              <!-- Gold rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);margin:0 0 20px;"></div>

              <!-- Voice text -->
              <p style="margin:0;font-family:Georgia,'Playfair Display',serif;font-size:15px;line-height:1.85;color:#2a2a3e;font-style:italic;">
                &ldquo;${tributeText}&rdquo;
              </p>

              <!-- Bottom rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.4),transparent);margin:24px 0 20px;"></div>

              <!-- Attribution -->
              <p style="margin:0;font-size:12px;color:#9090a0;text-align:right;letter-spacing:0.05em;">
                ${contributorName} &mdash; ${new Date().getFullYear()}
              </p>

            </td></tr>
          </table>
        </td></tr>

        <!-- Spacer -->
        <tr><td style="height:32px;"></td></tr>

        <!-- Return CTA -->
        <tr><td style="text-align:center;padding-bottom:28px;">
          <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.7;">
            Your ${lang.singular.toLowerCase()} is now part of a permanent record honouring ${subjectName}.<br/>
            Return to see the voices of everyone else who is part of this story.
          </p>
          <a href="${capsuleUrl}" style="display:inline-block;padding:12px 32px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.05em;">
            Return to ${subjectName}&rsquo;s Record
          </a>
        </td></tr>

        <!-- Share prompt — one block only (duplicate removed) -->
        <tr><td style="padding:24px 28px;border-radius:12px;border:1px solid rgba(212,174,42,0.15);background-color:rgba(212,174,42,0.04);margin-bottom:36px;">
          <p style="margin:0 0 8px;font-size:12px;color:rgba(212,174,42,0.7);text-transform:uppercase;letter-spacing:0.1em;">Pass it on</p>
          <p style="margin:0 0 14px;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
            Is there someone else whose voice belongs in this record? Share this link with them — the more voices that arrive, the richer the record becomes.
          </p>
          ${editUrl ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);text-align:center;margin:0 0 10px;">Want to make a change? <a href="${editUrl}" style="color:rgba(226,195,107,0.7);text-decoration:underline;">Edit your ${lang.singular.toLowerCase()}</a></p>` : ''}
          <a href="${params.refCode ? capsuleUrl + '?ref=' + params.refCode : capsuleUrl}" style="display:inline-block;padding:10px 24px;border-radius:8px;background:rgba(212,174,42,0.12);border:1px solid rgba(212,174,42,0.25);color:rgba(212,174,42,0.8);font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.03em;">
            Share the Record &#8594;
          </a>
          <p style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.2);word-break:break-all;">
            ${params.refCode ? capsuleUrl + '?ref=' + params.refCode : capsuleUrl}
          </p>
          <!-- Stories invitation — one occurrence only -->
          <p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.7;border-top:1px solid rgba(226,195,107,0.08);padding-top:16px;">
            Have a longer story or memory about ${subjectName}?<br/>
            <a href="${capsuleUrl}/stories" style="color:rgba(226,195,107,0.65);text-decoration:underline;">Share it in the Stories room &mdash; every word belongs in this record.</a>
          </p>
        </td></tr>

        <!-- Spacer -->
        <tr><td style="height:36px;"></td></tr>

        <!-- LC end note -->
        <tr><td align="center" style="padding-bottom:24px;">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.22);line-height:1.7;max-width:400px;font-style:italic;">
            LegacyCapsule preserves the voices that matter most &mdash;<br/>
            for the people being celebrated, and for those who come after.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center">
          <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.1em;text-transform:uppercase;">
            VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech
          </p>
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.08);">itslegacycapsule.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`
}

// ═══ SECTION 4 — sendKeepsakeCard ═══
// Called from /api/email/approval route on organiser approval.
// ECS: subject communicates permanence, not platform status.
// Previous: "Your appreciation for [Name] is now live" → system status language
// Updated:  "Your voice for [Name] is now part of this record" → permanence

export async function sendKeepsakeCard(params: ApprovalEmailParams): Promise<void> {
  const { contributorEmail, subjectName } = params

  const html       = buildKeepsakeCardHtml(params)
  const lang       = getParticipationLanguage(params.eventType)
  const isMemorial = params.eventType === 'memorial'

  // ECS: "is now part of this record" → permanence pillar
  // Not: "is now live" → platform/system language
  const subject = isMemorial
    ? 'Your tribute for ' + subjectName + ' is now part of this record'
    : 'Your ' + lang.singular.toLowerCase() + ' for ' + subjectName + ' is now part of this record'

  const { error } = await resend.emails.send({
    from: FROM,
    to:   contributorEmail,
    subject,
    html,
  })

  if (error) {
    console.error('[sendKeepsakeCard] Resend error:', error)
    throw new Error('Failed to send Keepsake Card: ' + error.message)
  }
}

// ═══ SECTION 5 — sendOrganiserWelcome ═══
// Called from /api/email/verify-organiser on capsule creation.
// Sends verification + welcome email. First LC email the organiser receives.
// ECS: subject honours the weight of what they've started.
// Previous: "[Name]'s capsule is ready — one step to go" → administrative
// Updated:  "Something important begins here — [Name]'s capsule awaits you"

export async function sendOrganiserWelcome(params: OrganisingWelcomeParams): Promise<void> {
  const { organiserEmail, subjectName, verifyUrl, manageUrl } = params

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your capsule for ${subjectName} is ready</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0820;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Brand mark -->
        <tr><td align="center" style="padding-bottom:32px;">
          <p style="margin:0;font-size:11px;color:rgba(212,174,42,0.6);letter-spacing:0.25em;text-transform:uppercase;font-weight:600;">LegacyCapsule</p>
          <p style="margin:5px 0 0;font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:0.12em;">itslegacycapsule.com</p>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background-color:#F5F3EE;border-radius:16px;border-top:4px solid #D4AE2A;padding:44px 40px;">

          <!-- Ornament -->
          <p style="margin:0 0 24px;text-align:center;font-size:28px;color:#D4AE2A;">&#10022;</p>

          <!-- Heading -->
          <h1 style="margin:0 0 20px;font-family:Georgia,'Playfair Display',serif;font-size:24px;font-weight:700;color:#1a1a2e;text-align:center;line-height:1.35;">
            ${subjectName}&rsquo;s capsule is ready.
          </h1>

          <!-- Emotional body — ECS: honour the weight of what they've started -->
          <p style="margin:0 0 28px;font-size:14px;color:#4a4a5e;text-align:center;line-height:1.8;">
            You have started something meaningful. One step remains — verify your email
            to open the capsule to the voices that belong in it.
          </p>

          <!-- Verify CTA -->
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${verifyUrl}" style="display:inline-block;padding:13px 36px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
              Open ${subjectName}&rsquo;s Capsule
            </a>
          </div>

          <!-- Gold divider -->
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 24px;"></div>

          <!-- Dashboard link -->
          <p style="margin:0 0 8px;font-size:13px;color:#6b6b80;text-align:center;line-height:1.7;">
            Once verified, your capsule dashboard is here — everything you need
            to shape the record is waiting for you:
          </p>
          <p style="margin:0;text-align:center;">
            <a href="${manageUrl}" style="font-size:13px;color:#B8960C;text-decoration:none;">${manageUrl}</a>
          </p>

          <!-- Gold divider -->
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.15),transparent);margin:24px 0 20px;"></div>

          <!-- Permanence close -->
          <p style="margin:0;font-size:13px;color:#5a5a70;text-align:center;line-height:1.8;font-style:italic;">
            Every great occasion deserves a permanent record.<br/>
            This one starts here.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.12em;text-transform:uppercase;">
            VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech
          </p>
          <p style="margin:0;font-size:10px;color:rgba(212,174,42,0.25);">itslegacycapsule.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      organiserEmail,
    // ECS: weight-first — "Something important begins here" not "one step to go"
    subject: 'Something important begins here \u2014 ' + subjectName + '\u2019s capsule awaits you',
    html,
  })

  if (error) {
    console.error('[sendOrganiserWelcome] Resend error:', error)
    throw new Error('Failed to send organiser welcome: ' + error.message)
  }
}