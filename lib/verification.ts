import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM    = "LegacyCapsule <noreply@itslegacycapsule.com>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// Generate a secure random token
function generateToken(): string {
  return Math.random().toString(36).slice(2) +
         Math.random().toString(36).slice(2) +
         Date.now().toString(36)
}

// ── ORGANISER VERIFICATION ────────────────────────────────
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

  await db.from("email_verifications").insert({
    email,
    token,
    type:      "organiser",
    record_id: capsuleId,
    expires_at: expiresAt,
  })

  const verifyUrl = `${APP_URL}/api/verify?token=${token}`

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: `Verify your LegacyCapsule for ${honoreeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        
        <div style="background:#2D1B69;padding:24px;border-radius:12px;
          text-align:center;margin-bottom:24px;">
          <h1 style="color:#B8960C;font-size:20px;margin:0;letter-spacing:2px;">
            LEGACYCAPSULE
          </h1>
          <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">
            Every event. Preserved.
          </p>
        </div>

        <p style="color:#1C1C1E;font-size:15px;">
          Thank you for creating a Capsule for <strong>${honoreeName}</strong>.
        </p>

        <p style="color:#1C1C1E;font-size:15px;line-height:1.6;">
          Please verify your email address to activate your Capsule 
          and make it accessible to contributors.
        </p>

        <a href="${verifyUrl}"
          style="display:block;background:#B8960C;color:#2D1B69;
            text-align:center;padding:14px 24px;border-radius:10px;
            font-weight:bold;font-size:15px;text-decoration:none;
            margin:24px 0;">
          Verify & Activate My Capsule
        </a>

        <p style="color:#5F5E5A;font-size:13px;line-height:1.6;">
          This link expires in 24 hours. If you did not create a 
          LegacyCapsule, you can safely ignore this email.
        </p>

        <div style="border-top:1px solid #F0EEE8;margin-top:24px;
          padding-top:16px;text-align:center;">
          <p style="color:#B8960C;font-size:11px;letter-spacing:1px;margin:0;">
            LEGACYCAPSULE — EVERY EVENT. PRESERVED.
          </p>
        </div>
      </div>
    `,
  })
}

// ── CONTRIBUTOR VERIFICATION ──────────────────────────────
export async function sendContributorVerification({
  email,
  contributorName,
  contributionId,
  honoreeName,
  capsuleSlug,
}: {
  email:          string
  contributorName: string
  contributionId: string
  honoreeName:    string
  capsuleSlug:    string
}) {
  const token     = generateToken()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  await db.from("email_verifications").insert({
    email,
    token,
    type:      "contributor",
    record_id: contributionId,
    expires_at: expiresAt,
  })

  const verifyUrl = `${APP_URL}/api/verify?token=${token}`

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: `Confirm your tribute for ${honoreeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        
        <div style="background:#2D1B69;padding:24px;border-radius:12px;
          text-align:center;margin-bottom:24px;">
          <h1 style="color:#B8960C;font-size:20px;margin:0;letter-spacing:2px;">
            LEGACYCAPSULE
          </h1>
          <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">
            Every event. Preserved.
          </p>
        </div>

        <p style="color:#1C1C1E;font-size:15px;">Dear ${contributorName},</p>

        <p style="color:#1C1C1E;font-size:15px;line-height:1.6;">
          Thank you for your tribute for <strong>${honoreeName}</strong>. 
          Please confirm your email address to complete your submission.
        </p>

        <a href="${verifyUrl}"
          style="display:block;background:#B8960C;color:#2D1B69;
            text-align:center;padding:14px 24px;border-radius:10px;
            font-weight:bold;font-size:15px;text-decoration:none;
            margin:24px 0;">
          Confirm My Tribute
        </a>

        <p style="color:#5F5E5A;font-size:13px;line-height:1.6;">
          Once confirmed your tribute will be reviewed and published 
          on the tribute wall. You will receive another email when 
          it goes live. This link expires in 48 hours.
        </p>

        <div style="background:#F5F3EE;border-left:3px solid #B8960C;
          padding:12px 16px;border-radius:4px;margin:20px 0;">
          <p style="margin:0;color:#5F5E5A;font-size:13px;">
            View the tribute wall:
          </p>
          <a href="${APP_URL}/for/${capsuleSlug}"
            style="color:#2D1B69;font-size:13px;font-weight:bold;">
            ${APP_URL}/for/${capsuleSlug}
          </a>
        </div>

        <div style="border-top:1px solid #F0EEE8;margin-top:24px;
          padding-top:16px;text-align:center;">
          <p style="color:#B8960C;font-size:11px;letter-spacing:1px;margin:0;">
            LEGACYCAPSULE — EVERY EVENT. PRESERVED.
          </p>
        </div>
      </div>
    `,
  })
}


