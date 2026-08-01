import { NextRequest, NextResponse } from 'next/server'
import { getParticipationLanguage } from '@/lib/utils/getParticipationLanguage'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSION CONFIRMATION EMAIL — Path A, Step 1
// Route: POST /api/email/submission-confirmation
// Triggered immediately on tribute submission if contributor provided email.
// Sends warm acknowledgement + unique edit link.
// D27: Path A — submission confirmation sent immediately. Keepsake Card on approval.
// Never imported directly into client components — always called via fetch POST.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY!)

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────────────────────
// EDIT TOKEN GENERATOR
// Creates a unique token in email_verifications table for the contributor
// edit link: /for/[slug]/edit/[token]
// ─────────────────────────────────────────────────────────────────────────────
async function createEditToken(contributionId: string): Promise<string> {
  const token =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)

  await adminClient.from('email_verifications').insert({
    token,
    type: 'contributor_edit',
    record_id: contributionId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return token
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATE
// Warm, premium HTML. Inline styles throughout for email client compatibility.
// FROM: noreply@itslegacycapsule.com — confirmed domain.
// ─────────────────────────────────────────────────────────────────────────────
function buildSubmissionEmail({
  contributorName,
  subjectName,
  eventType,
  tributeText,
  editLink,
  capsuleUrl,
}: {
  contributorName: string
  subjectName: string
  eventType: string
  tributeText: string
  editLink: string
  capsuleUrl: string
}): string {
  const lang = getParticipationLanguage(eventType)
  const isMemorial = eventType === 'memorial'
  const greeting = isMemorial
    ? 'Thank you for honouring ' + subjectName
    : 'Thank you for your ' + lang.singular.toLowerCase() + ' for ' + subjectName

  const bodyIntro = isMemorial
    ? 'Your words are a meaningful gift to those who loved ' + subjectName + '. We have received Your ${lang.singular} and it is now awaiting review.'
    : 'Your ' + lang.singular.toLowerCase() + ' has been received and is now awaiting review by the organiser.'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${lang.singular} has been received</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0820;font-family:'DM Sans',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0820;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo area -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:10px;color:rgba(212,174,42,0.5);letter-spacing:0.2em;text-transform:uppercase;">
                LegacyCapsule
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.1em;">
                RevoWorldTech · VALNEX, UNIPESSOAL LDA
              </p>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#F5F3EE;border-radius:16px;border-top:4px solid #D4AE2A;padding:40px 36px;">

              <!-- Ornament -->
              <p style="margin:0 0 20px;text-align:center;font-size:32px;">✦</p>

              <!-- Heading -->
              <h1 style="margin:0 0 12px;font-family:Georgia,'Playfair Display',serif;font-size:24px;font-weight:700;color:#1a1a2e;text-align:center;line-height:1.3;">
                ${greeting}
              </h1>

              <!-- Subheading -->
              <p style="margin:0 0 28px;font-size:14px;color:#5a5a70;text-align:center;line-height:1.7;">
                ${bodyIntro}
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);margin:0 0 28px;"></div>

              <!-- Tribute preview -->
              <div style="background-color:#FFFFFF;border-radius:10px;border-left:3px solid #D4AE2A;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;color:#9090a0;text-transform:uppercase;letter-spacing:0.1em;">
                  Your ${lang.singular}
                </p>
                <p style="margin:0;font-size:14px;color:#2a2a3e;line-height:1.75;font-style:italic;">
                  &ldquo;${tributeText.slice(0, 300)}${tributeText.length > 300 ? '…' : ''}&rdquo;
                </p>
              </div>

              <!-- What happens next -->
              <div style="background-color:rgba(212,174,42,0.08);border-radius:10px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-size:12px;color:#B8960C;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">
                  What happens next
                </p>
                <p style="margin:0;font-size:13px;color:#4a4a5e;line-height:1.65;">
                  The organiser will review your ${lang.singular.toLowerCase()}. Once approved, it will appear on the ${lang.wallTitle} and you will receive a beautiful keepsake of your words.
                </p>
              </div>

              <!-- Edit link -->
              <div style="text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 12px;font-size:13px;color:#6b6b80;">
                  Need to make a change? You can edit your tribute before it is approved.
                </p>
                <a href="${editLink}"
                  style="display:inline-block;padding:10px 28px;border-radius:8px;border:1px solid #D4AE2A;color:#B8960C;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.05em;">
                  Edit My ${lang.singular}
                </a>
              </div>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,174,42,0.3),transparent);margin:0 0 24px;"></div>

              <!-- View wall link -->
              <div style="text-align:center;">
                <a href="${capsuleUrl}"
                  style="font-size:13px;color:#9090a0;text-decoration:none;">
                  View the tribute wall &rarr;
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 4px;font-size:10px;color:rgba(255,255,255,0.15);letter-spacing:0.1em;text-transform:uppercase;">
                VALNEX, UNIPESSOAL LDA · RevoWorldTech
              </p>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.1);">
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
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      contributionId,
      capsuleSlug,
      contributorName,
      contributorEmail,
      subjectName,
      eventType,
      tributeText,
    } = await req.json()

    // ── Validate required fields ───────────────────────────────────────────
    if (!contributionId || !capsuleSlug || !contributorName || !contributorEmail) {
      return NextResponse.json(
        { error: 'contributionId, capsuleSlug, contributorName and contributorEmail are required' },
        { status: 400 }
      )
    }

    // ── Generate edit token ────────────────────────────────────────────────
    const token = await createEditToken(contributionId)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'
    const editLink = appUrl + '/for/' + capsuleSlug + '/edit/' + token
    const capsuleUrl = appUrl + '/for/' + capsuleSlug
const lang = getParticipationLanguage(eventType ?? '')

    // ── Build and send email ───────────────────────────────────────────────
    const html = buildSubmissionEmail({
      contributorName,
      subjectName: subjectName ?? 'the honouree',
      eventType: eventType ?? '',
      tributeText: tributeText ?? '',
      editLink,
      capsuleUrl,
    })

    const { error: sendError } = await resend.emails.send({
      from: 'LegacyCapsule <noreply@itslegacycapsule.com>',
      to: contributorEmail,
      subject: 'Your ' + (lang?.singular?.toLowerCase() ?? 'voice') + ' has been received — ' + (subjectName ?? 'LegacyCapsule'),
      html,
    })

    if (sendError) {
      console.error('Resend error:', sendError)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Submission confirmation route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}