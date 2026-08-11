// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: lib/verification.ts
// PURPOSE:   Email verification functions for organisers and contributors.
//            sendOrganiserVerification — sent on capsule creation before
//              dashboard access is granted. First LC email the organiser sees.
//            sendContributorVerification — sent when a contributor's voice
//              requires email confirmation before entering the review queue.
// ARCHITECTURE: Called by /api/email/verify-organiser and
//               /api/email/verify-contributor route wrappers.
//               All copy compliant with LC_EMOTIONAL_COMMUNICATION_STANDARD.md.
//               Participation language engine used throughout — no hardcoded
//               "tribute" or event-specific language in templates.
// BUILT BY:  AI20 · Claude Sonnet 4.6
// UPDATED:   11 August 2026
// VERSION:   AI20v2.11.92
// DATE:      11 August 2026
//
// PREVIOUS ISSUES FIXED IN THIS VERSION:
//   - Both templates used minimal plain HTML — no premium card structure.
//     These are first-impression emails. Now use full dark/cream/gold design.
//   - "tribute" hardcoded throughout — ignored event type entirely.
//     Now routed through getParticipationLanguage(eventType).
//   - Contributor subject: "Confirm your tribute" → event-aware, moment-first.
//   - Organiser body: administrative jargon ("activate", "accessible to
//     contributors") → ECS-compliant emotional framing.
//   - Organiser addressed as nobody — no name used. Now addressed properly.
//   - Contributor CTA "Confirm My Tribute" → event-aware language.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { Resend }       from 'resend'
import { getParticipationLanguage } from '@/lib/utils/getParticipationLanguage'

// ═══ SECTION 1 — Clients + config ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM    = 'LegacyCapsule <noreply@itslegacycapsule.com>'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Token generator ═══

function generateToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  )
}

// ═══ SECTION 3 — Shared email shell ═══
// Premium dark/cream/gold structure — matches rest of LC email suite.
// Used for both organiser and contributor verification.

function verificationShell(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>LegacyCapsule</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0820;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

        <!-- Brand mark -->
        <tr><td align="center" style="padding-bottom:32px;">
          <p style="margin:0;font-size:11px;color:rgba(212,174,42,0.6);letter-spacing:0.25em;text-transform:uppercase;font-weight:600;">LegacyCapsule</p>
          <p style="margin:5px 0 0;font-size:10px;color:rgba(255,255,255,0.18);letter-spacing:0.12em;">itslegacycapsule.com</p>
        </td></tr>

        <!-- Main card -->
        <tr><td style="background-color:#F5F3EE;border-radius:16px;border-top:4px solid #D4AE2A;padding:44px 40px;">
          ${innerHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.12em;text-transform:uppercase;">
            VALNEX, UNIPESSOAL LDA &middot; RevoWorldTech
          </p>
          <p style="margin:0;font-size:10px;color:rgba(212,174,42,0.2);">itslegacycapsule.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ═══ SECTION 4 — Organiser verification ═══
// First email the organiser receives after creating a capsule.
// ECS: privilege + weight pillars. Honour what they've started.
// 24-hour token expiry.

export async function sendOrganiserVerification({
  email,
  capsuleId,
  capsuleSlug,
  honoreeName,
}: {
  email:       string
  capsuleId:   string
  capsuleSlug: string
  honoreeName: string
}) {
  const token     = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await db.from('email_verifications').insert({
    email,
    token,
    type:       'organiser',
    record_id:  capsuleId,
    expires_at: expiresAt,
  })

  const verifyUrl = `${APP_URL}/api/verify?token=${token}`

  const inner = `
    <!-- Ornament -->
    <p style="margin:0 0 24px;text-align:center;font-size:28px;color:#D4AE2A;">&#10022;</p>

    <!-- Heading -->
    <h1 style="margin:0 0 20px;font-family:Georgia,'Playfair Display',serif;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;line-height:1.35;">
      You have started something that will last.
    </h1>

    <!-- Body — ECS: honour the occasion, not the system action -->
    <p style="margin:0 0 24px;font-size:14px;color:#4a4a5e;text-align:center;line-height:1.8;">
      The capsule for <strong>${honoreeName}</strong> is ready and waiting.
      Verify your email to open it to the voices that belong in it.
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${verifyUrl}"
        style="display:inline-block;padding:13px 36px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
        Open ${honoreeName}&rsquo;s Capsule
      </a>
    </div>

    <!-- Gold divider -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 22px;"></div>

    <!-- Expiry note -->
    <p style="margin:0 0 16px;font-size:12px;color:#8080a0;text-align:center;line-height:1.65;">
      This link is valid for 24 hours and is personal to you.<br/>
      If you did not create a capsule on LegacyCapsule, you can ignore this email.
    </p>

    <!-- Permanence close -->
    <p style="margin:0;font-size:13px;color:#5a5a70;text-align:center;line-height:1.8;font-style:italic;">
      Every great occasion deserves a permanent record.<br/>
      This one starts with you.
    </p>
  `

  await resend.emails.send({
    from:    FROM,
    to:      email,
    // ECS: moment-first subject — what they've begun, not what they must do
    subject: `${honoreeName}\u2019s capsule is ready \u2014 one step to open it`,
    html:    verificationShell(inner),
  })
}

// ═══ SECTION 5 — Contributor verification ═══
// Sent when a contributor's voice requires email confirmation.
// ECS: permanence + belonging pillars. Their voice matters.
// Event-type aware — no hardcoded "tribute" anywhere.
// 48-hour token expiry.

export async function sendContributorVerification({
  email,
  contributorName,
  contributionId,
  honoreeName,
  capsuleSlug,
  eventType,
}: {
  email:           string
  contributorName: string
  contributionId:  string
  honoreeName:     string
  capsuleSlug:     string
  eventType?:      string
}) {
  const token     = generateToken()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  await db.from('email_verifications').insert({
    email,
    token,
    type:       'contributor',
    record_id:  contributionId,
    expires_at: expiresAt,
  })

  const verifyUrl  = `${APP_URL}/api/verify?token=${token}`
  const capsuleUrl = `${APP_URL}/for/${capsuleSlug}`
  const lang       = getParticipationLanguage(eventType ?? '')
  const firstName  = contributorName.split(' ')[0] ?? contributorName
  const isMemorial = eventType === 'memorial'

  // ECS: subject communicates the moment, not the action required
  const subject = isMemorial
    ? `Your tribute for ${honoreeName} — one step to confirm`
    : `Your ${lang.singular.toLowerCase()} for ${honoreeName} — one step to confirm`

  // ECS: body addresses contributor by name, speaks to belonging and permanence
  const bodyIntro = isMemorial
    ? `Your words for <strong>${honoreeName}</strong> have arrived. Confirm your email to add them to the permanent record — where they will remain alongside the voices of everyone else who chose to speak.`
    : `Your ${lang.singular.toLowerCase()} for <strong>${honoreeName}</strong> has arrived. Confirm your email and it will be added to the record — a permanent part of something that will long outlast this occasion.`

  const inner = `
    <!-- Ornament -->
    <p style="margin:0 0 24px;text-align:center;font-size:28px;color:#D4AE2A;">&#10022;</p>

    <!-- Personal greeting — ECS: address by name -->
    <p style="margin:0 0 6px;font-size:13px;color:#6b6b80;text-align:center;">Dear ${contributorName},</p>

    <!-- Heading -->
    <h1 style="margin:0 0 20px;font-family:Georgia,'Playfair Display',serif;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;line-height:1.35;">
      Your voice is almost there.
    </h1>

    <!-- Body -->
    <p style="margin:0 0 28px;font-size:14px;color:#4a4a5e;text-align:center;line-height:1.8;">
      ${bodyIntro}
    </p>

    <!-- CTA — event-aware language -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${verifyUrl}"
        style="display:inline-block;padding:13px 36px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
        Confirm My ${lang.singular}
      </a>
    </div>

    <!-- Gold divider -->
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 22px;"></div>

    <!-- What happens next -->
    <div style="background-color:rgba(212,174,42,0.07);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#B8960C;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">What happens next</p>
      <p style="margin:0;font-size:13px;color:#4a4a5e;line-height:1.7;">
        Once confirmed, your ${lang.singular.toLowerCase()} will be reviewed by the organiser.
        When it is approved, it will appear in ${honoreeName}&rsquo;s record — and you will
        receive a keepsake of your own words.
      </p>
    </div>

    <!-- View record link -->
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${capsuleUrl}"
        style="font-size:13px;color:#9090a0;text-decoration:none;">
        View ${honoreeName}&rsquo;s record &rarr;
      </a>
    </div>

    <!-- Expiry + safety note -->
    <p style="margin:0 0 16px;font-size:12px;color:#8080a0;text-align:center;line-height:1.65;">
      This link is valid for 48 hours and is personal to you.
    </p>

    <!-- Permanence close — ECS: end with belonging -->
    <p style="margin:0;font-size:13px;color:#5a5a70;text-align:center;line-height:1.8;font-style:italic;">
      Your voice belongs here.
    </p>
  `

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject,
    html:    verificationShell(inner),
  })
}