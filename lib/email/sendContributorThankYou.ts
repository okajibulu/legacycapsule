// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/email/sendContributorThankYou.ts
// PURPOSE:   Sends a warm ECS-compliant thank-you email to contributors
//            after gallery photo uploads or story submissions.
//            Encourages further contribution and sharing the capsule link.
//            Non-blocking — caller should .catch() and continue.
// ARCHITECTURE: CG-SPEC-001 — Contributor Gallery
//               LC_EMOTIONAL_COMMUNICATION_STANDARD.md
// BUILT BY:  AI25 · Claude Opus 4.6
// VERSION:   AI25v2.12.33
// DATE:      24 August 2026
// ─────────────────────────────────────────────────────────────────────────────

import { Resend } from 'resend'

// ═══ SECTION 1 — Client ═══

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Types ═══

interface ThankYouParams {
  recipientEmail: string
  recipientName:  string
  honoureeName:   string
  capsuleSlug:    string
  contentType:    'photos' | 'story'
  count?:         number  // number of photos uploaded (for photos type)
}

// ═══ SECTION 3 — Email builder ═══

function buildThankYouHtml(params: ThankYouParams): string {
  const { recipientName, honoureeName, capsuleSlug, contentType, count } = params
  const firstName  = recipientName.split(' ')[0]
  const capsuleUrl = `${APP_URL}/for/${capsuleSlug}`

  const contentLine = contentType === 'photos'
    ? `Your ${count === 1 ? 'photo has' : `${count} photos have`} been added to ${honoureeName}'s Contributor Gallery.`
    : `Your story has been submitted to ${honoureeName}'s capsule and is now awaiting review.`

  const encourageLine = contentType === 'photos'
    ? 'Feel free to add more photos, share a story, or leave a voice on the tribute wall.'
    : 'Feel free to share more stories, upload photos to the Contributor Gallery, or leave a voice on the tribute wall.'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Thank you — ${honoureeName}'s LegacyCapsule</title>
</head>
<body style="margin:0;padding:0;background:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0820;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Brand -->
        <tr><td align="center" style="padding-bottom:36px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
        </td></tr>

        <!-- Gold ornament -->
        <tr><td align="center" style="padding-bottom:20px;">
          <p style="margin:0;font-size:28px;color:#D4AE2A;">&#10022;</p>
        </td></tr>

        <!-- Headline -->
        <tr><td align="center" style="padding-bottom:32px;">
          <h1 style="margin:0 0 10px;font-family:Georgia,'Playfair Display',serif;font-size:22px;font-weight:700;color:#F5F3EE;line-height:1.35;">
            Thank you, ${firstName}.
          </h1>
          <p style="margin:0;font-size:14px;color:rgba(226,195,107,0.75);font-style:italic;">
            Every contribution helps preserve ${honoureeName}'s story.
          </p>
        </td></tr>

        <!-- Card -->
        <tr><td style="padding:3px;border-radius:18px;background:linear-gradient(135deg,#D4AE2A,#B8960C,#D4AE2A);">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:16px;overflow:hidden;">
            <tr><td height="4" style="background:linear-gradient(90deg,#2D1B69,#D4AE2A,#2D1B69);font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:32px 36px 36px;">

              <p style="margin:0 0 16px;font-size:14px;color:#4a4a5e;line-height:1.85;">
                ${contentLine}
              </p>

              <p style="margin:0 0 16px;font-size:14px;color:#4a4a5e;line-height:1.85;">
                ${encourageLine}
              </p>

              <p style="margin:0 0 24px;font-size:14px;color:#4a4a5e;line-height:1.85;">
                And if someone in your circle would want to be part of this, share the link with them — every voice matters.
              </p>

              <!-- Gold rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);margin:0 0 24px;"></div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${capsuleUrl}"
                   style="display:inline-block;padding:14px 40px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.05em;">
                  Visit the Capsule &rarr;
                </a>
              </div>

              <!-- Bottom rule -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 18px;"></div>

              <p style="margin:0;font-size:12px;color:#9090a0;text-align:center;line-height:1.7;">
                This email was sent because you contributed to ${honoureeName}'s LegacyCapsule.
              </p>

            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:32px;">
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

// ═══ SECTION 4 — Send function ═══

export async function sendContributorThankYou(params: ThankYouParams): Promise<void> {
  const subject = `Thank you for adding to ${params.honoureeName}'s story`
  const html    = buildThankYouHtml(params)

  const { error } = await resend.emails.send({
    from:    'LegacyCapsule <noreply@itslegacycapsule.com>',
    to:      params.recipientEmail,
    subject,
    html,
  })

  if (error) {
    console.error('[sendContributorThankYou] Resend error:', error)
    throw error
  }
}
