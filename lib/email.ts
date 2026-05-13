import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// const FROM = "LegacyCapsule <onboarding@resend.dev>"
// When domain is verified change to:
const FROM = "LegacyCapsule <noreply@itslegacycapsule.com>"

// ── SUBMISSION CONFIRMATION ───────────────────────────────
export async function sendSubmissionConfirmation({
  to,
  contributorName,
  honoreeName,
  capsuleSlug,
}: {
  to:              string
  contributorName: string
  honoreeName:     string
  capsuleSlug:     string
}) {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Your tribute for ${honoreeName} has been received`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#ffffff;">
        
        <div style="background:#2D1B69;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
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
          Your message has been received and is currently under review. 
          You will receive another email once it has been approved and 
          appears on the tribute wall.
        </p>

        <div style="background:#F5F3EE;border-left:3px solid #B8960C;
          padding:12px 16px;border-radius:4px;margin:20px 0;">
          <p style="margin:0;color:#5F5E5A;font-size:13px;">
            You can view the tribute wall at any time:
          </p>
          <a href="https://itslegacycapsule.com/event/${capsuleSlug}"
            style="color:#2D1B69;font-size:13px;font-weight:bold;">
            itslegacycapsule.com/event/${capsuleSlug}
          </a>
        </div>

        <p style="color:#5F5E5A;font-size:13px;line-height:1.6;">
          Leave your email address when contributing and you will 
          receive the Event Digital Publication when it is ready — 
          a beautifully produced commemorative document containing 
          every tribute, every face, and every moment from the event.
        </p>

        <div style="border-top:1px solid #F0EEE8;margin-top:24px;padding-top:16px;
          text-align:center;">
          <p style="color:#B8960C;font-size:11px;letter-spacing:1px;margin:0;">
            LEGACYCAPSULE — EVERY EVENT. PRESERVED.
          </p>
        </div>

      </div>
    `,
  })
}

// ── APPROVAL NOTIFICATION ─────────────────────────────────
export async function sendApprovalNotification({
  to,
  contributorName,
  honoreeName,
  capsuleSlug,
}: {
  to:              string
  contributorName: string
  honoreeName:     string
  capsuleSlug:     string
}) {
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `Your tribute for ${honoreeName} is now live`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#ffffff;">
        
        <div style="background:#2D1B69;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#B8960C;font-size:20px;margin:0;letter-spacing:2px;">
            LEGACYCAPSULE
          </h1>
          <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">
            Every event. Preserved.
          </p>
        </div>

        <p style="color:#1C1C1E;font-size:15px;">Dear ${contributorName},</p>
        
        <p style="color:#1C1C1E;font-size:15px;line-height:1.6;">
          Your tribute for <strong>${honoreeName}</strong> has been 
          approved and is now live on the tribute wall.
        </p>

        <a href="https://itslegacycapsule.com/event/${capsuleSlug}"
          style="display:block;background:#B8960C;color:#2D1B69;
            text-align:center;padding:12px 24px;border-radius:8px;
            font-weight:bold;font-size:14px;text-decoration:none;
            margin:20px 0;">
          View the Tribute Wall
        </a>

        <p style="color:#5F5E5A;font-size:13px;line-height:1.6;">
          When the Event Digital Publication is ready, you will receive 
          a personal copy showing the page your tribute appears on.
        </p>

        <div style="border-top:1px solid #F0EEE8;margin-top:24px;padding-top:16px;
          text-align:center;">
          <p style="color:#B8960C;font-size:11px;letter-spacing:1px;margin:0;">
            LEGACYCAPSULE — EVERY EVENT. PRESERVED.
          </p>
        </div>

      </div>
    `,
  })
}

