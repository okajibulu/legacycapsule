// ─────────────────────────────────────────────────────────────────────────────
// lib/email.ts
// All transactional email functions for LegacyCapsule.
// FROM: noreply@itslegacycapsule.com — confirmed Resend domain.
// Never import this file into 'use client' components — server-side only.
// Always call via API routes from client components.
// D27: Keepsake Card replaces plain approval email on organiser approval.
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from 'resend'

// ─────────────────────────────────────────────────────────────────────────────
// RESEND CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = 'LegacyCapsule <noreply@itslegacycapsule.com>'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface ApprovalEmailParams {
  contributorEmail: string
  contributorName: string
  subjectName: string
  eventType: string
  tributeText: string
  capsuleSlug: string
  city: string
  country: string
}

interface OrganisingWelcomeParams {
  organiserEmail: string
  subjectName: string
  capsuleSlug: string
  verifyUrl: string
  manageUrl: string
}

// ─────────────────────────────────────────────────────────────────────────────
// KEEPSAKE CARD EMAIL — D27
// Sent when organiser approves a tribute. Replaces plain approval email.
// Design: deep purple #0D0820 outer, ivory #F5F3EE inner card,
// antique gold #D4AE2A accents, Playfair Display / Georgia serif headline.
// Full inline styles for email client compatibility.
// Must feel like receiving a beautiful physical card — worth screenshotting.
// ─────────────────────────────────────────────────────────────────────────────
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
  const capsuleUrl = appUrl + '/for/' + capsuleSlug

  const isMemorial = eventType === 'Memorial & Funeral'
  const isWedding = eventType === 'Wedding'

  // Event-appropriate headline
  const headline = isMemorial
    ? 'Your tribute for ' + subjectName + ' is now live'
    : isWedding
    ? 'Your message for the couple is now live'
    : 'Your tribute for ' + subjectName + ' is now live'

  // Event-appropriate keepsake label
  const keepsakeLabel = isMemorial
    ? 'A tribute in memory of ' + subjectName
    : isWedding
    ? 'A message for ' + subjectName
    : 'A tribute for ' + subjectName

  // Location line
  const locationLine = city + (country ? ' · ' + country : '')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0820;font-family:'DM Sans',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#0D0820;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- ── HEADER AREA ───────────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <!-- Brand wordmark -->
              <p style="margin:0 0 4px;font-size:10px;
                color:rgba(212,174,42,0.6);
                letter-spacing:0.25em;text-transform:uppercase;">
                LegacyCapsule
              </p>
              <p style="margin:0;font-size:10px;
                color:rgba(255,255,255,0.18);letter-spacing:0.1em;">
                RevoWorldTech · VALNEX, UNIPESSOAL LDA
              </p>
            </td>
          </tr>

          <!-- ── GOLD ORNAMENT ROW ─────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <p style="margin:0;font-size:28px;line-height:1;">✦</p>
            </td>
          </tr>

          <!-- ── APPROVAL HEADLINE ─────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <h1 style="margin:0;
                font-family:Georgia,'Playfair Display',serif;
                font-size:26px;font-weight:700;
                color:#F5F3EE;line-height:1.35;
                text-align:center;">
                ${headline}
              </h1>
              <p style="margin:12px 0 0;font-size:14px;
                color:rgba(255,255,255,0.4);line-height:1.7;
                text-align:center;">
                Your words are now part of the tribute wall.
                We have preserved a keepsake of your tribute below.
              </p>
            </td>
          </tr>

          <!-- ── KEEPSAKE CARD ─────────────────────────────────────────── -->
          <!-- Outer gold border frame -->
          <tr>
            <td style="padding:3px;border-radius:18px;
              background:linear-gradient(135deg,#D4AE2A,#B8960C,#D4AE2A);">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#F5F3EE;border-radius:16px;overflow:hidden;">

                <!-- Card top accent bar -->
                <tr>
                  <td style="height:4px;
                    background:linear-gradient(90deg,#2D1B69,#D4AE2A,#2D1B69);">
                  </td>
                </tr>

                <!-- Card content -->
                <tr>
                  <td style="padding:32px 36px 36px;">

                    <!-- Keepsake label -->
                    <p style="margin:0 0 20px;font-size:10px;
                      color:#B8960C;letter-spacing:0.2em;
                      text-transform:uppercase;text-align:center;">
                      ── ${keepsakeLabel} ──
                    </p>

                    <!-- Contributor info row -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="margin-bottom:20px;">
                      <tr>
                        <!-- Initials circle -->
                        <td width="44" valign="top">
                          <div style="width:40px;height:40px;border-radius:50%;
                            background-color:#2D1B69;
                            display:inline-flex;align-items:center;
                            justify-content:center;">
                            <span style="color:#D4AE2A;font-size:14px;
                              font-weight:700;line-height:40px;
                              display:block;text-align:center;width:40px;">
                              ${contributorName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                        </td>
                        <!-- Name + location -->
                        <td style="padding-left:12px;" valign="middle">
                          <p style="margin:0;
                            font-family:Georgia,'Playfair Display',serif;
                            font-size:16px;font-weight:600;color:#1a1a2e;">
                            ${contributorName}
                          </p>
                          <p style="margin:3px 0 0;font-size:12px;color:#6b6b80;">
                            ${locationLine}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Gold rule -->
                    <div style="height:1px;
                      background:linear-gradient(90deg,transparent,#D4AE2A,transparent);
                      margin:0 0 20px;">
                    </div>

                    <!-- Tribute text -->
                    <p style="margin:0;
                      font-family:Georgia,'Playfair Display',serif;
                      font-size:15px;line-height:1.85;
                      color:#2a2a3e;font-style:italic;">
                      &ldquo;${tributeText}&rdquo;
                    </p>

                    <!-- Bottom rule -->
                    <div style="height:1px;
                      background:linear-gradient(90deg,transparent,rgba(212,174,42,0.4),transparent);
                      margin:24px 0 20px;">
                    </div>

                    <!-- Subject name attribution -->
                    <p style="margin:0;font-size:12px;
                      color:#9090a0;text-align:right;
                      letter-spacing:0.05em;">
                      — ${keepsakeLabel}
                    </p>

                  </td>
                </tr>

                <!-- Card bottom accent bar -->
                <tr>
                  <td style="height:2px;background-color:#2D1B69;"></td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ── SPACER ────────────────────────────────────────────────── -->
          <tr><td style="height:36px;"></td></tr>

          <!-- ── VIEW ON WALL CTA ──────────────────────────────────────── -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <p style="margin:0 0 16px;font-size:13px;
                color:rgba(255,255,255,0.4);line-height:1.6;">
                Your tribute is now part of a growing collection of voices
                honouring ${subjectName}.
              </p>
              <a href="${capsuleUrl}"
                style="display:inline-block;padding:12px 32px;
                  border-radius:10px;
                  background:linear-gradient(135deg,#D4AE2A,#B8960C);
                  color:#0D0820;font-size:14px;font-weight:700;
                  text-decoration:none;letter-spacing:0.05em;">
                View the Tribute Wall
              </a>
            </td>
          </tr>

          <!-- ── SHARE PROMPT ──────────────────────────────────────────── -->
          <tr>
            <td style="padding:24px 28px;border-radius:12px;
              border:1px solid rgba(212,174,42,0.15);
              background-color:rgba(212,174,42,0.04);
              margin-bottom:36px;">
              <p style="margin:0 0 8px;font-size:12px;
                color:rgba(212,174,42,0.7);
                text-transform:uppercase;letter-spacing:0.1em;">
                Share the wall
              </p>
              <p style="margin:0 0 14px;font-size:13px;
                color:rgba(255,255,255,0.35);line-height:1.6;">
                Know someone who would like to add their tribute?
                Share the wall with them.
              </p>
              <a href="${capsuleUrl}"
                style="font-size:13px;color:rgba(212,174,42,0.6);
                  text-decoration:none;word-break:break-all;">
                ${capsuleUrl}
              </a>
            </td>
          </tr>

          <!-- ── SPACER ────────────────────────────────────────────────── -->
          <tr><td style="height:36px;"></td></tr>

          <!-- ── FOOTER ────────────────────────────────────────────────── -->
          <tr>
            <td align="center">
              <p style="margin:0 0 4px;font-size:10px;
                color:rgba(255,255,255,0.12);
                letter-spacing:0.1em;text-transform:uppercase;">
                VALNEX, UNIPESSOAL LDA · RevoWorldTech
              </p>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.08);">
                itslegacycapsule.com
              </p>
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

// ─────────────────────────────────────────────────────────────────────────────
// SEND KEEPSAKE CARD — called from /api/email/approval route
// D27: Replaces plain approval email. Sent on organiser approval action.
// ─────────────────────────────────────────────────────────────────────────────
export async function sendKeepsakeCard(params: ApprovalEmailParams): Promise<void> {
  const { contributorEmail, contributorName, subjectName } = params

  const html = buildKeepsakeCardHtml(params)

  const isMemorial = params.eventType === 'Memorial & Funeral'
  const subject = isMemorial
    ? 'Your tribute for ' + subjectName + ' is live — LegacyCapsule'
    : 'Your tribute for ' + subjectName + ' has been approved — LegacyCapsule'

  const { error } = await resend.emails.send({
    from: FROM,
    to: contributorEmail,
    subject,
    html,
  })

  if (error) {
    console.error('Keepsake Card send error:', error)
    throw new Error('Failed to send Keepsake Card: ' + error.message)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND ORGANISER WELCOME — called from /api/email/verify-organiser
// Sends verification + welcome email to organiser on capsule creation.
// ─────────────────────────────────────────────────────────────────────────────
export async function sendOrganiserWelcome(params: OrganisingWelcomeParams): Promise<void> {
  const { organiserEmail, subjectName, verifyUrl, manageUrl } = params

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your LegacyCapsule</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0820;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:10px;color:rgba(212,174,42,0.5);letter-spacing:0.2em;text-transform:uppercase;">
                LegacyCapsule
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#F5F3EE;border-radius:16px;border-top:4px solid #D4AE2A;padding:40px 36px;">

              <p style="margin:0 0 20px;text-align:center;font-size:28px;">✦</p>

              <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;
                font-weight:700;color:#1a1a2e;text-align:center;">
                Your capsule for ${subjectName} is ready
              </h1>

              <p style="margin:0 0 28px;font-size:14px;color:#5a5a70;
                text-align:center;line-height:1.7;">
                Verify your email to activate the tribute wall and start
                receiving tributes.
              </p>

              <div style="text-align:center;margin-bottom:28px;">
                <a href="${verifyUrl}"
                  style="display:inline-block;padding:13px 36px;border-radius:10px;
                    background:linear-gradient(135deg,#D4AE2A,#B8960C);
                    color:#0D0820;font-size:15px;font-weight:700;
                    text-decoration:none;letter-spacing:0.04em;">
                  Verify Email &amp; Go Live
                </a>
              </div>

              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 24px;"></div>

              <p style="margin:0 0 8px;font-size:13px;color:#6b6b80;text-align:center;">
                Once verified, manage your tribute wall here:
              </p>
              <p style="margin:0;text-align:center;">
                <a href="${manageUrl}" style="font-size:13px;color:#B8960C;text-decoration:none;">
                  ${manageUrl}
                </a>
              </p>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.15);letter-spacing:0.1em;text-transform:uppercase;">
                VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const { error } = await resend.emails.send({
    from: FROM,
    to: organiserEmail,
    subject: 'Verify your email — ' + subjectName + ' tribute wall',
    html,
  })

  if (error) {
    console.error('Organiser welcome send error:', error)
    throw new Error('Failed to send organiser welcome: ' + error.message)
  }
}