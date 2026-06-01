/* =========================================================
   app/api/rep/resend/route.ts

   Resends an existing family rep portal access link.
   Does NOT create a new token — reuses the most recent
   active token for that email + capsule combination.
   If all tokens are expired, creates a fresh one.

   Body: { capsuleId, slug, repEmail }
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
    const { capsuleId, slug, repEmail } = await request.json()
    if (!capsuleId || !slug || !repEmail) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Fetch capsule
    const { data: capsule } = await supabase
      .from('capsules')
      .select('id, slug, honouree_name, event_type, family_rep_name')
      .eq('id', capsuleId)
      .single()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com'

    // Find most recent active token for this rep + capsule
    const { data: existing } = await supabase
      .from('honouree_portal_tokens')
      .select('token, expires_at')
      .eq('capsule_id', capsuleId)
      .eq('honouree_email', repEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let portalToken: string

    const isActive = existing?.expires_at
      ? new Date(existing.expires_at) > new Date()
      : !!existing

    if (existing && isActive) {
      // Reuse existing active token
      portalToken = existing.token
    } else {
      // All expired or none — create fresh token
      portalToken = crypto.randomBytes(32).toString('hex')
      const { error: insertErr } = await supabase
        .from('honouree_portal_tokens')
        .insert({
          token: portalToken,
          capsule_id: capsuleId,
          honouree_email: repEmail,
          expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          session_type: 'link',
        })
      if (insertErr) {
        return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
      }
    }

    const portalUrl = `${APP_URL}/for/${slug}/honouree?token=${portalToken}`
    const repName = capsule.family_rep_name || 'Family Representative'
    const honourName = capsule.honouree_name

    await resend.emails.send({
      from: 'LegacyCapsule <hello@itslegacycapsule.com>',
      to: repEmail,
      subject: `Your Family Rep Access — ${honourName}'s LegacyCapsule`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:#E2C36B;">LEGACY</span>
          <span style="font-size:13px;font-weight:800;letter-spacing:0.18em;color:rgba(255,255,255,0.3);">CAPSULE</span>
        </td></tr>
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(226,195,107,0.18);border-radius:20px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="2" style="background:linear-gradient(to right,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 32px 28px;">
            <tr><td align="center" style="padding-bottom:20px;">
              <div style="width:52px;height:52px;border-radius:50%;background:rgba(226,195,107,0.1);border:1px solid rgba(226,195,107,0.25);display:inline-flex;align-items:center;justify-content:center;">
                <span style="font-size:22px;">✦</span>
              </div>
            </td></tr>
            <tr><td align="center" style="padding-bottom:12px;">
              <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(255,255,255,0.92);margin:0;line-height:1.3;">Your Portal Access Link</h1>
            </td></tr>
            <tr><td align="center" style="padding-bottom:28px;">
              <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0;max-width:380px;">
                Here is your access link for <strong style="color:rgba(255,255,255,0.85);">${honourName}</strong>'s LegacyCapsule portal.
              </p>
            </td></tr>
            <tr><td style="padding-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="background:rgba(226,195,107,0.07);border:1px solid rgba(226,195,107,0.2);border-radius:12px;padding:16px 20px;">
                  <p style="font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(226,195,107,0.55);margin:0 0 8px;">Your Private Access Link</p>
                  <p style="font-size:12px;color:#E2C36B;word-break:break-all;margin:0;line-height:1.6;">${portalUrl}</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td align="center" style="padding-bottom:20px;">
              <a href="${portalUrl}" style="display:inline-block;padding:14px 36px;border-radius:30px;background:linear-gradient(135deg,#E2C36B,rgba(226,195,107,0.7));color:#1a0845;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">Open My Portal →</a>
            </td></tr>
            <tr><td align="center">
              <p style="font-size:11px;color:rgba(255,255,255,0.28);line-height:1.6;margin:0;">
                This link is private and unique to you. Do not share it.<br/>
                ${isActive ? 'Your original access period remains unchanged.' : 'A fresh 6-month access period has been issued.'}
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:28px;">
          <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;">
            LegacyCapsule · RevoWorldTech · Valnex, Unipessoal LDA<br/>
            <a href="https://itslegacycapsule.com" style="color:rgba(226,195,107,0.35);text-decoration:none;">itslegacycapsule.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Rep resend error:', err)
    return NextResponse.json({ error: 'Failed to resend' }, { status: 500 })
  }
}
