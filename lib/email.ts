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

export async function sendOrganiserWelcome({
  to,
  honoureeName,
  slug,
  tier,
}: {
  to: string
  honoureeName: string
  slug: string
  tier: string
}) {
  const capsuleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capsule/${slug}`
  const manageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capsule/${slug}/manage`
  const tierLabel = tier === 'free' ? 'Free Tribute Wall' : tier === 'honour' ? 'Legacy Honour' : 'Legacy Premier'

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your LegacyCapsule for ${honoureeName} is live`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0D0820; color: #ffffff; padding: 40px 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 13px; letter-spacing: 0.3em; color: #B8960C; text-transform: uppercase;">LegacyCapsule</span>
        </div>
        <h1 style="font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Your capsule is live.</h1>
        <p style="color: rgba(255,255,255,0.6); font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
          The tribute wall for <strong style="color: #D4AE2A;">${honoureeName}</strong> is ready to receive tributes from anywhere in the world.
        </p>
        <div style="background: rgba(184,150,12,0.08); border: 1px solid rgba(184,150,12,0.25); border-radius: 8px; padding: 20px 24px; margin-bottom: 32px;">
          <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 8px;">Package</p>
          <p style="font-size: 16px; color: #D4AE2A; font-weight: 600; margin: 0;">${tierLabel}</p>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${capsuleUrl}" style="display: inline-block; background: linear-gradient(135deg, #B8960C, #D4AE2A); color: #0D0820; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; letter-spacing: 0.05em;">
            View Your Capsule →
          </a>
          <p style="text-align:center;margin-top:16px;">
            <a href="${manageUrl}" style="color:#B8960C;font-size:13px;text-decoration:underline;">
              Manage your capsule & moderate tributes →
            </a>
          </p>
        </div>
        <p style="color: rgba(255,255,255,0.4); font-size: 13px; line-height: 1.6;">
          Share your capsule link with guests and start collecting tributes immediately.<br/>
          <span style="color: rgba(255,255,255,0.25); font-size: 11px;">${capsuleUrl}</span>
        </p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0;" />
        <p style="color: rgba(255,255,255,0.2); font-size: 11px; text-align: center; letter-spacing: 0.15em; text-transform: uppercase;">
          VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
        </p>
      </div>
    `,
  })
}

