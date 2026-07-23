/* =========================================================
   app/api/rep/invite/route.ts
   Generates Family Rep portal token + sends invite email
   UPDATED: AI13 - Claude Opus 4.6 - 22 July 2026
     -- repName now used in email greeting
     -- Raw token URL removed from email body (security)
     -- Masked domain reference replaces raw URL display
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { capsuleId, slug } = await request.json()
    if (!capsuleId || !slug) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Fetch capsule + family rep details
    const { data: capsule } = await supabase
      .from('capsules')
      .select('id, slug, honouree_name, event_type, family_rep_name, family_rep_email, organiser_email')
      .eq('id', capsuleId)
      .single()

    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    if (!capsule.family_rep_email) return NextResponse.json({ error: 'No family rep email set' }, { status: 400 })

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'}/for/${slug}/honouree?token=${token}`

    // Insert token into honouree_portal_tokens
    const { error: tokenError } = await supabase
      .from('honouree_portal_tokens')
      .insert({
        token,
        capsule_id: capsuleId,
        honouree_email: capsule.family_rep_email,
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
        session_type: 'link',
      })

    if (tokenError) {
      console.error('Token insert error:', tokenError)
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
    }

    // Send invite email via Resend
    const repName = capsule.family_rep_name || 'Family Representative'
    const honourName = capsule.honouree_name

    await resend.emails.send({
      from: 'LegacyCapsule <hello@itslegacycapsule.com>',
      to: capsule.family_rep_email,
      subject: `Your Family Rep Access -- ${honourName}'s LegacyCapsule`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span><span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">

              <!-- Gold top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 28px;">

                <!-- Icon -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <div style="width:52px;height:52px;border-radius:50%;background:rgba(226,195,107,0.1);border:1px solid rgba(226,195,107,0.25);display:inline-flex;align-items:center;justify-content:center;">
                      <span style="font-size:22px;">&#10022;</span>
                    </div>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(255,255,255,0.92);margin:0;line-height:1.3;">
                      Family Rep Access
                    </h1>
                  </td>
                </tr>

                <!-- Personal greeting -->
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <p style="font-size:13px;color:rgba(226,195,107,0.7);margin:0;font-style:italic;">
                      Dear ${repName},
                    </p>
                  </td>
                </tr>

                <!-- Subtext -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0;max-width:380px;">
                      You have been given Family Representative access to <strong style="color:rgba(255,255,255,0.85);">${honourName}</strong>'s LegacyCapsule. Your private portal gives you a dedicated view of tributes, support details, and acknowledgements received on behalf of the family.
                    </p>
                  </td>
                </tr>

                <!-- CTA button -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 40px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.75));color:#1a0845;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
                      Open My Portal &#8594;
                    </a>
                  </td>
                </tr>

                <!-- Security note -- no raw URL exposed -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <p style="font-size:11px;color:rgba(255,255,255,0.28);line-height:1.7;margin:0;">
                      This link is private and unique to you. Please do not forward this email.<br/>
                      Your access remains valid for 6 months from the date of issue.
                    </p>
                  </td>
                </tr>

                <!-- What you can access -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(226,195,107,0.1);border-radius:12px;padding:16px 18px;">
                      <tr>
                        <td>
                          <p style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(226,195,107,0.55);margin:0 0 12px;">What you can access</p>
                          <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 8px;line-height:1.6;">&#10022; &nbsp;All approved tributes for ${honourName}</p>
                          <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 8px;line-height:1.6;">&#10022; &nbsp;Gifting details shared by the family</p>
                          <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;line-height:1.6;">&#10022; &nbsp;Support acknowledgements received</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.8;">
                LegacyCapsule &middot; RevoWorldTech &middot; Valnex, Unipessoal LDA<br/>
                <a href="https://itslegacycapsule.com" style="color:rgba(226,195,107,0.35);text-decoration:none;">itslegacycapsule.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    // Update capsule with sent timestamp
    await supabase
      .from('capsules')
      .update({ rep_portal_sent_at: new Date().toISOString() } as any)
      .eq('id', capsuleId)

    return NextResponse.json({ success: true, portalUrl })

  } catch (err) {
    console.error('Rep invite error:', err)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}